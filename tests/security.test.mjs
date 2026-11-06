import {test} from 'node:test';
import assert from 'node:assert/strict';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {readFile, readdir, mkdtemp, rm} from 'node:fs/promises';
const require = createRequire(import.meta.resolve('wrangler'));
const {build} = require('esbuild');
const {Miniflare} = require('miniflare');
const hash = async s=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))).toString('hex');
const raw=()=>crypto.getRandomValues(new Uint8Array(32)).reduce((s,b)=>s+b.toString(16).padStart(2,'0'),'');

test('MOTIVE D1/R2 authorization and lifecycle integration', async t=>{
 const bundle=await build({entryPoints:['tests/boundary-worker.ts'],bundle:true,format:'esm',write:false});
 const builtModules = process.env.MOTIVE_BUILT_WORKER ? ['index.js',...(await readdir('dist/server',{recursive:true})).filter(p=>p.endsWith('.js') && p!=='index.js')].map(p=>({type:'ESModule',path:resolve('dist/server',p)})) : null;
 const persist=await mkdtemp(resolve(tmpdir(),'motive-emulator-'));
 const options={d1Persist:resolve(persist,'d1'),r2Persist:resolve(persist,'r2'),...(builtModules ? {modules:builtModules,modulesRoot:resolve('dist/server'),assets:{directory:resolve('dist/client'),binding:'ASSETS',routerConfig:{has_user_worker:true,invoke_user_worker_ahead_of_assets:true}}} : {modules:true,script:bundle.outputFiles[0].text}),compatibilityFlags:['nodejs_compat'],compatibilityDate:'2026-05-15',d1Databases:['DB'],r2Buckets:['BUCKET']};
 let mf=new Miniflare(options);
 try {
 if (builtModules) await t.test('production assets, manifest and PWA are reachable without private records',async()=>{
  const manifest=await mf.dispatchFetch('https://motive.test/manifest.webmanifest');assert.equal(manifest.status,200);assert.equal((await manifest.json()).name,'MOTIVE');
  const files=await readdir('dist/client/_next/static/chunks');
  const script=await mf.dispatchFetch('https://motive.test/_next/static/chunks/'+files.find(f=>f.startsWith('page-')));assert.equal(script.status,200);
  const icon=await mf.dispatchFetch('https://motive.test/icons/motive-192.png');assert.equal(icon.status,200);
 });
 const db=await mf.getD1Database('DB');
 for(const name of ['0000_fast_imperial_guard','0001_motive']) {
  const sql=await readFile(`drizzle/${name}.sql`,'utf8');
  for(const statement of sql.split(';').map(s=>s.replace('--> statement-breakpoint','').trim()).filter(Boolean)) await db.prepare(statement).run();
 }
 const q=(sql,...args)=>db.prepare(sql).bind(...args);
 const call=async(path,{method='GET',data,cookie,origin='https://motive.test',type,body}={})=>mf.dispatchFetch('https://motive.test'+path,{method,headers:{...(method!=='GET'?{Origin:origin}:{}),...(cookie?{Cookie:cookie}:{}),...(type?{'Content-Type':type}:{'Content-Type':'application/json'})},body:body??(data?JSON.stringify(data):undefined)});
 const expect=async(path,status,opts)=>{const r=await call(path,opts);assert.equal(r.status,status,`${path}: ${await r.clone().text()}`);return r;};
 const invite=async email=>{const token=raw();await q('INSERT INTO invitations VALUES (?,?,?,0)',await hash(token),email,Date.now()+60000).run();return token;};
 const password='correct horse battery staple';
 let ownerCookie,otherCookie,viewerCookie,planId,groupId,imageId,guestCookie,grantHash;
 await t.test('default deny, spoofed identity, CSRF and unknown methods',async()=>{
  await expect('/api/plans',401);await expect('/private',404);await expect('/api/unknown',404);await expect('/api/plans',403,{method:'POST',origin:'https://evil.test',data:{}});
  const r=await mf.dispatchFetch('https://motive.test/api/auth/me',{headers:{'oai-authenticated-user-id':'admin','oai-authenticated-user-email':'x@y.test'}});assert.equal(r.status,401);
  await expect('/api/auth/login',404,{method:'PUT'});
  assert.equal((await call('/')).status,200);
 });
 await t.test('invitation registration, secure persistent session, replay, password hashing',async()=>{
  await expect('/api/auth/register',403,{method:'POST',data:{email:'owner@motive.test',password,token:raw()}});
  const token=await invite('owner@motive.test');
  await expect('/api/auth/register',403,{method:'POST',data:{email:'wrong@motive.test',password,token}});
  const r=await expect('/api/auth/register',200,{method:'POST',data:{email:'owner@motive.test',password,token}});ownerCookie=r.headers.get('set-cookie').split(';')[0];
  assert.match(r.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);
  await expect('/api/auth/register',403,{method:'POST',data:{email:'owner@motive.test',password,token}});
  const a=await q('SELECT * FROM accounts WHERE email=?','owner@motive.test').first();assert.notEqual(a.password,password);assert.match(a.password,/pbkdf2-sha256\$600000/);
  const s=await q('SELECT * FROM sessions WHERE account_id=?',a.id).first();assert.notEqual(s.hash,ownerCookie.split('=')[1]);
  await expect('/api/auth/me',200,{cookie:ownerCookie});await q('UPDATE accounts SET admin=1 WHERE id=?',a.id).run();
  for(const [email,save] of [['other@motive.test',v=>otherCookie=v],['viewer@motive.test',v=>viewerCookie=v]]){const token=await invite(email);const r=await expect('/api/auth/register',200,{method:'POST',data:{email,password,token}});save(r.headers.get('set-cookie').split(';')[0]);}
  await expect('/api/auth/login',401,{method:'POST',data:{email:'owner@motive.test',password:'incorrect password'}});
  await expect('/api/auth/login',200,{method:'POST',data:{email:'owner@motive.test',password}});
 });
 await t.test('expired invitations and weak passwords cannot register',async()=>{
  const token=raw();await q('INSERT INTO invitations VALUES (?,?,?,0)',await hash(token),'expired@motive.test',Date.now()-1).run();
  await expect('/api/auth/register',403,{method:'POST',data:{email:'expired@motive.test',password,token}});
  await expect('/api/auth/register',400,{method:'POST',data:{email:'weak@motive.test',password:'weak',token}});
 });
 await t.test('separate group and plan membership; viewer cannot write',async()=>{
  groupId=(await (await expect('/api/groups',201,{method:'POST',cookie:ownerCookie,data:{name:'Friends'}})).json()).id;
  planId=(await (await expect('/api/plans',201,{method:'POST',cookie:ownerCookie,data:{title:'Weekend',groupId}})).json()).id;
  const other=await q('SELECT id FROM accounts WHERE email=?','other@motive.test').first();const viewer=await q('SELECT id FROM accounts WHERE email=?','viewer@motive.test').first();
  await expect(`/api/groups/${groupId}/members`,200,{method:'POST',cookie:ownerCookie,data:{accountId:other.id}});
  await expect(`/api/plans/${planId}`,403,{cookie:otherCookie});
  await q("INSERT INTO plan_members VALUES (?,?,'viewer')",planId,viewer.id).run();
  await expect(`/api/plans/${planId}`,200,{cookie:viewerCookie});
  await expect(`/api/plans/${planId}/guests`,403,{method:'POST',cookie:viewerCookie});
  await expect(`/api/plans/${planId}/images`,403,{method:'POST',cookie:viewerCookie,body:'bad',type:'image/png'});
 });
 await t.test('R2 actual-byte limits, signatures, authorized retrieval and ownership',async()=>{
  await expect(`/api/plans/${planId}/images`,415,{method:'POST',cookie:ownerCookie,type:'image/png',body:'<svg/>'});
  await expect(`/api/plans/${planId}/images`,415,{method:'POST',cookie:ownerCookie,type:'image/svg+xml',body:'<svg/>'});
  await expect(`/api/plans/${planId}/images`,413,{method:'POST',cookie:ownerCookie,type:'image/png',body:new Uint8Array(2*1024*1024+1)});
  const png=await readFile('public/icons/motive-192.png');
  imageId=(await (await expect(`/api/plans/${planId}/images`,201,{method:'POST',cookie:ownerCookie,type:'image/png',body:png})).json()).id;
  await expect(`/api/images/${imageId}`,403);await expect(`/api/images/${imageId}`,403,{cookie:otherCookie});
  const r=await expect(`/api/images/${imageId}`,200,{cookie:viewerCookie});assert.deepEqual(Buffer.from(await r.arrayBuffer()),png);assert.match(r.headers.get('cache-control'),/no-store/);assert.equal(r.headers.get('x-content-type-options'),'nosniff');
  await expect(`/api/images/${imageId}`,403,{method:'DELETE',cookie:viewerCookie});
 });
 await t.test('guest atomic redemption replay, read scope, cross-plan denial, revocation',async()=>{
  const g=await (await expect(`/api/plans/${planId}/guests`,200,{method:'POST',cookie:ownerCookie})).json();grantHash=g.hash;
  const results=await Promise.all([call('/api/guest/redeem',{method:'POST',data:{token:g.token}}),call('/api/guest/redeem',{method:'POST',data:{token:g.token}})]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,403]);guestCookie=results.find(r=>r.status===200).headers.get('set-cookie').split(';')[0];
  await expect(`/api/plans/${planId}`,200,{cookie:guestCookie});await expect(`/api/images/${imageId}`,200,{cookie:guestCookie});
  await expect('/api/groups',401,{cookie:guestCookie});await expect('/api/plans/other',403,{cookie:guestCookie});await expect(`/api/plans/${planId}/images`,403,{method:'POST',cookie:guestCookie,body:'bad',type:'image/png'});
  await expect(`/api/plans/${planId}/guests`,200,{method:'DELETE',cookie:ownerCookie,data:{hash:grantHash}});
  await expect(`/api/plans/${planId}`,403,{cookie:guestCookie});await expect(`/api/images/${imageId}`,403,{cookie:guestCookie});
 });
 await t.test('expiry denies redemption and existing guest/account sessions',async()=>{
  const token=raw();await q('INSERT INTO guest_grants VALUES (?,?,?,0,0)',await hash(token),planId,Date.now()-1).run();await expect('/api/guest/redeem',403,{method:'POST',data:{token}});
  const g=await (await expect(`/api/plans/${planId}/guests`,200,{method:'POST',cookie:ownerCookie})).json();const r=await expect('/api/guest/redeem',200,{method:'POST',data:{token:g.token}});const cookie=r.headers.get('set-cookie').split(';')[0];await q('UPDATE guest_grants SET expires=0 WHERE hash=?',g.hash).run();await expect(`/api/plans/${planId}`,403,{cookie});
  await q('UPDATE sessions SET expires=0 WHERE hash=?',await hash(otherCookie.split('=')[1])).run();await expect('/api/auth/me',401,{cookie:otherCookie});
 });
 await t.test('image creator can delete; object disappears from D1 and R2',async()=>{
  await expect(`/api/images/${imageId}`,200,{method:'DELETE',cookie:ownerCookie});
  await expect(`/api/images/${imageId}`,404,{cookie:ownerCookie});
  assert.equal(await (await mf.getR2Bucket('BUCKET')).get(imageId),null);
 });
 await t.test('administrator restriction and recovery invalidate sessions; recovery replay',async()=>{
  const viewer=await q('SELECT id FROM accounts WHERE email=?','viewer@motive.test').first();
  await expect('/api/admin/invitations',403,{method:'POST',cookie:viewerCookie,data:{email:'x@y.test'}});
  await expect('/api/admin/restrict',200,{method:'POST',cookie:ownerCookie,data:{id:viewer.id,status:'disabled'}});await expect('/api/auth/me',401,{cookie:viewerCookie});await expect('/api/auth/login',401,{method:'POST',data:{email:'viewer@motive.test',password}});
  const recovery=await (await expect('/api/admin/recovery',200,{method:'POST',cookie:ownerCookie,data:{email:'owner@motive.test'}})).json();
  await expect('/api/auth/recover',200,{method:'POST',data:{email:'owner@motive.test',password:'new secure password phrase',token:recovery.token}});await expect('/api/auth/me',401,{cookie:ownerCookie});
  await expect('/api/auth/recover',403,{method:'POST',data:{email:'owner@motive.test',password:'new secure password phrase',token:recovery.token}});
  const login=await expect('/api/auth/login',200,{method:'POST',data:{email:'owner@motive.test',password:'new secure password phrase'}});ownerCookie=login.headers.get('set-cookie').split(';')[0];
  await expect('/api/auth/logout',200,{method:'POST',cookie:ownerCookie});await expect('/api/auth/me',401,{cookie:ownerCookie});
 });
 await t.test('persistent rate limits reject repeated authentication attempts',async()=>{
  let blocked=false;
  for(let i=0;i<32;i++) {
   const r=await call('/api/auth/login',{method:'POST',data:{email:'attacker@motive.test',password:'incorrect password'}});
   if(r.status===429){blocked=true;break;}
   assert.equal(r.status,401);
  }
  assert.equal(blocked,true);
 });
 await t.test('D1 account sessions and R2 bytes survive emulator restart',async()=>{
  const account=await q('SELECT id FROM accounts WHERE email=?','owner@motive.test').first();
  const token=raw();await q('INSERT INTO sessions VALUES (?,?,?)',await hash(token),account.id,Date.now()+60000).run();
  const png=await readFile('public/icons/motive-192.png');await (await mf.getR2Bucket('BUCKET')).put('restart-probe',png);
  await mf.dispose();mf=new Miniflare(options);
  await expect('/api/auth/me',200,{cookie:'__Host-motive='+token});
  assert.deepEqual(Buffer.from(await (await (await mf.getR2Bucket('BUCKET')).get('restart-probe')).arrayBuffer()),png);
 });
 } finally {await mf.dispose();await rm(persist,{recursive:true,force:true});}
});
