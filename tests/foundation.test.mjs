import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir,mkdtemp,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
const require=createRequire(import.meta.resolve('wrangler'));
const {build}=require('esbuild'), {Miniflare}=require('miniflare');
const manifest=JSON.parse(await readFile('.openai/hosting.json','utf8'));
const journal=JSON.parse(await readFile('drizzle/meta/_journal.json','utf8'));
const hash=async s=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))).toString('hex');
const token=()=>crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
const markerKey='__motive_installation_v1';
let bundle;
async function fixture(t,{migrate=true,omit,config,permit}={}) {
 const target={siteId:manifest.project_id,instanceId:crypto.randomUUID(),stage:'staging',...config};
 const raw=token(), issuedAt=Date.now();
 const authorization={tokenHash:await hash(raw),issuedAt,expiresAt:issuedAt+3600000,adminEmail:'operator@motive.test',...permit};
 const vars={MOTIVE_INSTANCE:JSON.stringify(target),MOTIVE_BOOTSTRAP:JSON.stringify(authorization)};
 bundle??=build({entryPoints:['tests/boundary-worker.ts'],bundle:true,format:'esm',write:false});
 const modules=process.env.MOTIVE_BUILT_WORKER ? ['index.js',...(await readdir('dist/server',{recursive:true})).filter(p=>p.endsWith('.js') && p!=='index.js')].map(p=>({type:'ESModule',path:resolve('dist/server',p)})) : null;
 const persist=await mkdtemp(resolve(tmpdir(),'motive-infrastructure-'));
 const options={bindings:vars,compatibilityFlags:['nodejs_compat'],compatibilityDate:'2026-05-15',d1Persist:resolve(persist,'d1'),r2Persist:resolve(persist,'r2'),...(omit==='DB'?{}:{d1Databases:['DB']}),...(omit==='BUCKET'?{}:{r2Buckets:['BUCKET']}),...(modules?{modules,modulesRoot:resolve('dist/server'),assets:{directory:resolve('dist/client'),binding:'ASSETS',routerConfig:{has_user_worker:true,invoke_user_worker_ahead_of_assets:true}}}:{modules:true,script:(await bundle).outputFiles[0].text})};
 const mf=new Miniflare(options);
 t.after(async()=>{await mf.dispose();await rm(persist,{recursive:true,force:true});});
 let db=omit==='DB'?null:await mf.getD1Database('DB');
 let bucket=omit==='BUCKET'?null:await mf.getR2Bucket('BUCKET');
 const apply=async entries=>{for(const e of entries){const sql=await readFile(`drizzle/${e.tag}.sql`,'utf8');for(const s of sql.split(';').map(s=>s.replace('--> statement-breakpoint','').trim()).filter(Boolean))await db.prepare(s).run();}};
 if(migrate&&db)await apply(journal.entries);
 const call=(path,{method='GET',body,key,cookie,origin='https://motive.test',headers={}}={})=>mf.dispatchFetch('https://motive.test'+path,{method,headers:{'Content-Type':'application/json',...(method==='GET'?{}:{Origin:origin}),...(key?{'X-Motive-Bootstrap':key}:{}),...(cookie?{Cookie:cookie}:{}),...headers},body:body?JSON.stringify(body):undefined});
 const request={...target,adminEmail:authorization.adminEmail,password:'a secure operator test password',invitationEmail:'invitee@motive.test',confirm:'INITIALIZE MOTIVE ONCE'};
 const bootstrap=(overrides={})=>call('/api/foundation/bootstrap',{method:'POST',key:raw,body:request,...overrides});
 const diagnostic=(overrides={})=>call('/api/foundation/diagnostics',{key:raw,...overrides});
 const update=async (values={})=>{Object.assign(vars,values);await mf.setOptions({...options,bindings:vars});db=omit==='DB'?null:await mf.getD1Database('DB');bucket=omit==='BUCKET'?null:await mf.getR2Bucket('BUCKET');};
 const count=async table=>(await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first()).n;
 return {target,raw,authorization,vars,get db(){return db;},get bucket(){return bucket;},call,bootstrap,diagnostic,update,request,apply,count};
}
async function status(response,expected){const r=await response;assert.equal(r.status,expected,await r.clone().text());return r;}

test('bootstrap rejects anonymous, forged headers, wrong token, wrong origin and missing confirmation',async t=>{
 const f=await fixture(t);
 await status(f.bootstrap({key:undefined}),403);
 await status(f.bootstrap({key:token()}),403);
 await status(f.bootstrap({key:undefined,headers:{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':f.request.adminEmail,'OAI-Sites-Authorization':'Bearer forged'}}),403);
 await status(f.bootstrap({origin:'https://evil.test'}),403);
 for(const patch of [{confirm:''},{siteId:'wrong'},{instanceId:crypto.randomUUID()},{stage:'production'},{adminEmail:'attacker@motive.test'},{invitationEmail:f.request.adminEmail},{password:'weak'}])await status(f.bootstrap({body:{...f.request,...patch}}),400);
 await status(f.call('/api/foundation/bootstrap',{key:f.raw}),405);
 await status(f.diagnostic({key:undefined}),403);
 assert.equal(await f.count('accounts'),0);assert.equal(await f.count('foundation_installation'),0);assert.equal(await f.bucket.get(markerKey),null);
});

test('bootstrap requires deliberate, valid runtime arming; missing/expired/overlong permit cannot initialize',async t=>{
 for(const kind of ['missing','malformed','expired','long','future','wrongSite','missingInstance'])await t.test(kind,async t=>{
  const f=await fixture(t);
  const permit={...f.authorization};
  if(kind==='expired')permit.expiresAt=Date.now()-1;
  if(kind==='long')permit.expiresAt=permit.issuedAt+3600001;
  if(kind==='future'){permit.issuedAt=Date.now()+60000;permit.expiresAt=permit.issuedAt+1000;}
  await f.update({MOTIVE_BOOTSTRAP:kind==='missing'?'':kind==='malformed'?'{':JSON.stringify(permit),...(kind==='wrongSite'?{MOTIVE_INSTANCE:JSON.stringify({...f.target,siteId:'other-site'})}:{}),...(kind==='missingInstance'?{MOTIVE_INSTANCE:''}:{})});
  await status(f.bootstrap(),403);assert.equal(await f.count('accounts'),0);
 });
});

test('diagnostics are authorized, read-only and non-sensitive, including missing bindings',async t=>{
 for(const omit of ['DB','BUCKET',undefined])await t.test(omit??'uninitialized',async t=>{
  const f=await fixture(t,{omit});
  const r=await status(f.diagnostic(),200), text=await r.text(), d=JSON.parse(text);
  assert.equal(d.d1.bound,omit!=='DB');assert.equal(d.r2.bound,omit!=='BUCKET');assert.equal(d.ready,false);
  for(const secret of [f.raw,f.authorization.tokenHash,f.authorization.adminEmail,'password','database_id','bucket_name'])assert.equal(text.includes(secret),false);
  assert.match(r.headers.get('cache-control'),/no-store/);assert.equal(r.headers.get('referrer-policy'),'no-referrer');
  if(f.db)assert.equal(await f.count('foundation_installation'),0);
  if(f.bucket)assert.equal(await f.bucket.get(markerKey),null);
  if(omit)await status(f.bootstrap(),503);
 });
});

test('append-only migration preserves baseline data and refuses takeover of an occupied database',async t=>{
 const f=await fixture(t,{migrate:false});
 await status(f.bootstrap(),503);
 assert.equal((await (await f.diagnostic()).json()).d1.schemaReady,false);
 await f.apply(journal.entries.slice(0,2));
 await f.db.prepare("INSERT INTO foundation_probe VALUES ('retained','synthetic baseline',1)").run();
 await f.db.prepare("INSERT INTO accounts(id,email,password) VALUES ('existing','existing@motive.test','unchanged-hash')").run();
 await status(f.bootstrap(),503);
 await f.apply(journal.entries.slice(2));
 assert.equal((await f.db.prepare("SELECT value FROM foundation_probe WHERE id='retained'").first()).value,'synthetic baseline');
 await status(f.bootstrap(),409);
 assert.deepEqual(await f.db.prepare("SELECT password,admin FROM accounts WHERE id='existing'").first(),{password:'unchanged-hash',admin:0});
 assert.equal(await f.count('foundation_installation'),0);assert.equal(await f.bucket.get(markerKey),null);
});

test('bootstrap atomically creates one admin and a least-privilege first invitation',async t=>{
 const f=await fixture(t);
 const response=await status(f.bootstrap(),201), result=await response.json();
 assert.match(response.headers.get('cache-control'),/no-store/);assert.equal(response.headers.get('set-cookie'),null);
 assert.equal(await f.count('accounts'),1);assert.equal(await f.count('invitations'),1);assert.equal(await f.count('sessions'),0);
 const account=await f.db.prepare('SELECT password,admin FROM accounts').first();assert.match(account.password,/pbkdf2-sha256\$600000/);assert.equal(account.admin,1);
 const invite=await f.db.prepare('SELECT hash,email FROM invitations').first();assert.equal(invite.hash,await hash(result.invitation.token));assert.notEqual(invite.hash,result.invitation.token);assert.equal(invite.email,f.request.invitationEmail);
 const login=await status(f.call('/api/auth/login',{method:'POST',body:{email:f.request.adminEmail,password:f.request.password}}),200);
 const adminCookie=login.headers.get('set-cookie').split(';')[0];
 await f.update({MOTIVE_BOOTSTRAP:''});
 const before=await f.bucket.head(markerKey);const diagnostic=await status(f.diagnostic({key:undefined,cookie:adminCookie}),200);
 assert.equal((await diagnostic.json()).ready,true);assert.equal((await f.bucket.head(markerKey)).etag,before.etag);
 await status(f.bootstrap(),403);
 const redemption=await status(f.call('/api/auth/register',{method:'POST',body:{email:f.request.invitationEmail,password:'safe invitation test password',token:result.invitation.token}}),200);
 const inviteCookie=redemption.headers.get('set-cookie').split(';')[0];
 assert.equal((await (await f.call('/api/auth/me',{cookie:inviteCookie})).json()).admin,false);
 assert.deepEqual(await (await f.call('/api/groups',{cookie:inviteCookie})).json(),[]);assert.deepEqual(await (await f.call('/api/plans',{cookie:inviteCookie})).json(),[]);
 await status(f.diagnostic({key:undefined,cookie:inviteCookie}),403);
 await status(f.call('/api/admin/invitations',{method:'POST',cookie:inviteCookie,body:{email:'other@motive.test'}}),403);
 await status(f.call('/api/auth/logout',{method:'POST',cookie:adminCookie}),200);
 await status(f.diagnostic({key:undefined,cookie:adminCookie}),403);
});

test('concurrent initialization has one winner; new permits and deleted accounts cannot reset the ledger',async t=>{
 const f=await fixture(t);
 const responses=await Promise.all([f.bootstrap(),f.bootstrap()]);assert.deepEqual(responses.map(r=>r.status).sort(),[201,409]);
 assert.equal(await f.count('foundation_installation'),1);assert.equal(await f.count('accounts'),1);assert.equal(await f.count('invitations'),1);
 const old=await f.db.prepare('SELECT * FROM foundation_installation').first();
 const next=token();await f.update({MOTIVE_BOOTSTRAP:JSON.stringify({...f.authorization,tokenHash:await hash(next)})});
 await status(f.bootstrap({key:next}),409);
 await f.db.prepare('DELETE FROM invitations').run();await f.db.prepare('DELETE FROM accounts').run();
 await status(f.bootstrap({key:next}),409);
 assert.deepEqual(await f.db.prepare('SELECT * FROM foundation_installation').first(),old);
});

test('R2 reservation survives a failed D1 batch without a partial admin and supports same-target retry',async t=>{
 const f=await fixture(t);
 await f.db.prepare("CREATE TRIGGER deny_test_admin BEFORE INSERT ON accounts BEGIN SELECT RAISE(ABORT,'synthetic failure'); END").run();
 await status(f.bootstrap(),409);
 assert.equal(await f.count('accounts'),0);assert.equal(await f.count('invitations'),0);assert.equal(await f.count('foundation_installation'),0);
 const before=await f.bucket.head(markerKey);assert.ok(before);
 await f.db.prepare('DROP TRIGGER deny_test_admin').run();await status(f.bootstrap(),201);
 assert.equal((await f.bucket.head(markerKey)).etag,before.etag);
});

test('an unclaimed bucket containing existing objects is not adopted',async t=>{
 const f=await fixture(t);
 await f.bucket.put('synthetic-preexisting-object','retain');
 await status(f.bootstrap(),409);
 assert.equal(await f.bucket.get(markerKey),null);
 assert.equal(await f.count('accounts'),0);
 assert.equal(await (await f.bucket.get('synthetic-preexisting-object')).text(),'retain');
});

test('conflicting bucket reservation is never overwritten',async t=>{
 const f=await fixture(t), marker={site_id:f.target.siteId,instance_id:crypto.randomUUID(),stage:'production'};
 await f.bucket.put(markerKey,JSON.stringify(marker));await status(f.bootstrap(),409);
 assert.deepEqual(await (await f.bucket.get(markerKey)).json(),marker);assert.equal(await f.count('accounts'),0);
});

test('wrong stage, wrong instance, absent markers and unconfigured runtime fail closed before private data',async t=>{
 const f=await fixture(t);await status(f.bootstrap(),201);
 const login=await status(f.call('/api/auth/login',{method:'POST',body:{email:f.request.adminEmail,password:f.request.password}}),200), cookie=login.headers.get('set-cookie').split(';')[0];
 for(const target of [{...f.target,stage:'production'},{...f.target,instanceId:crypto.randomUUID()},null]){
  await f.update({MOTIVE_INSTANCE:target?JSON.stringify(target):''});
  for(const path of ['/api/auth/me','/api/groups','/api/plans','/api/images/00000000-0000-0000-0000-000000000000'])await status(f.call(path,{cookie}),503);
  assert.equal((await (await status(f.diagnostic({key:undefined,cookie}),200)).json()).ready,false);
 }
 await f.update({MOTIVE_INSTANCE:JSON.stringify(f.target)});
 await f.bucket.delete(markerKey);
 await status(f.call('/api/auth/me',{cookie}),503);
 const d=await (await f.diagnostic({key:undefined,cookie})).json();assert.equal(d.d1.matches,true);assert.equal(d.r2.matches,false);
});

test('separate emulator instances have separate D1/R2 claims and no shared account access',async t=>{
 const a=await fixture(t), b=await fixture(t);await status(a.bootstrap(),201);await status(b.bootstrap(),201);
 const aMarker=await (await a.bucket.get(markerKey)).json(),bMarker=await (await b.bucket.get(markerKey)).json();assert.notEqual(aMarker.instance_id,bMarker.instance_id);
 const login=await status(a.call('/api/auth/login',{method:'POST',body:{email:a.request.adminEmail,password:a.request.password}}),200),cookie=login.headers.get('set-cookie').split(';')[0];
 await status(b.call('/api/auth/me',{cookie}),401);
 await a.bucket.put('synthetic-isolation-probe','not shared');assert.equal(await b.bucket.get('synthetic-isolation-probe'),null);
});
