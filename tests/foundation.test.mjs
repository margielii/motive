import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir,mkdtemp,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {makeBootstrap,freshToken} from './bootstrap-fixture.mjs';
const require=createRequire(import.meta.resolve('wrangler'));
const {build}=require('esbuild'),{Miniflare}=require('miniflare');
const manifest=JSON.parse(await readFile('.openai/hosting.json','utf8'));
const journal=JSON.parse(await readFile('drizzle/meta/_journal.json','utf8'));
const markerKey='__motive_installation_v1';
let bundle;
async function fixture(t,{migrate=true,omit,patch={}}={}) {
 const target={siteId:manifest.project_id,instanceId:crypto.randomUUID(),stage:'staging'};
 const preparation=await makeBootstrap(target,patch),intent=preparation.intent;
 const vars={MOTIVE_INSTANCE:JSON.stringify(target),MOTIVE_BOOTSTRAP_V2:JSON.stringify(intent)};
 bundle??=build({entryPoints:['tests/boundary-worker.ts'],bundle:true,format:'esm',write:false});
 const modules=process.env.MOTIVE_BUILT_WORKER?['index.js',...(await readdir('dist/server',{recursive:true})).filter(p=>p.endsWith('.js')&&p!=='index.js')].map(p=>({type:'ESModule',path:resolve('dist/server',p)})):null;
 const persist=await mkdtemp(resolve(tmpdir(),'motive-repair-'));
 const options={bindings:vars,compatibilityFlags:['nodejs_compat'],compatibilityDate:'2026-05-15',d1Persist:resolve(persist,'d1'),r2Persist:resolve(persist,'r2'),...(omit==='DB'?{}:{d1Databases:['DB']}),...(omit==='BUCKET'?{}:{r2Buckets:['BUCKET']}),...(modules?{modules,modulesRoot:resolve('dist/server'),assets:{directory:resolve('dist/client'),binding:'ASSETS',routerConfig:{has_user_worker:true,invoke_user_worker_ahead_of_assets:true}}}:{modules:true,script:(await bundle).outputFiles[0].text})};
 const mf=new Miniflare(options);
 t.after(async()=>{await mf.dispose();await rm(persist,{recursive:true,force:true});});
 let db=omit==='DB'?null:await mf.getD1Database('DB'),bucket=omit==='BUCKET'?null:await mf.getR2Bucket('BUCKET');
 const apply=async entries=>{for(const e of entries){const sql=await readFile(`drizzle/${e.tag}.sql`,'utf8');for(const s of sql.split(';').map(s=>s.replace('--> statement-breakpoint','').trim()).filter(Boolean))await db.prepare(s).run();}};
 if(migrate&&db)await apply(journal.entries);
 const exchanges=[];
 const call=async(path,{method='GET',body,cookie,origin='https://motive.test',headers={}}={})=>{
  const request=new Request('https://motive.test'+path,{method,headers:{'Content-Type':'application/json',...(method==='GET'?{}:{Origin:origin}),...(cookie?{Cookie:cookie}:{}),...headers},body:body?JSON.stringify(body):undefined});
  // Deliberately model a platform retaining ALL HTTP fields, including bodies.
  const requestLog={url:request.url,headers:[...request.headers],body:await request.clone().text()};
  const response=await mf.dispatchFetch(request.url,{method:request.method,headers:Object.fromEntries(request.headers),body:request.method==='GET'?undefined:requestLog.body});
  exchanges.push({request:requestLog,response:{status:response.status,headers:[...response.headers],body:await response.clone().text()}});
  return response;
 };
 const bootstrap=(overrides={})=>call('/api/foundation/bootstrap',{method:'POST',body:preparation.request,...overrides});
 const diagnostic=(overrides={})=>call('/api/foundation/diagnostics',overrides);
 const update=async values=>{Object.assign(vars,values);await mf.setOptions({...options,bindings:vars});db=omit==='DB'?null:await mf.getD1Database('DB');bucket=omit==='BUCKET'?null:await mf.getR2Bucket('BUCKET');};
 const count=async table=>(await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first()).n;
 return {...preparation,target,vars,get db(){return db;},get bucket(){return bucket;},call,bootstrap,diagnostic,update,apply,count,exchanges};
}
async function status(response,expected){const r=await response;assert.equal(r.status,expected,await r.clone().text());return r;}
async function login(f){const r=await status(f.call('/api/auth/login',{method:'POST',body:{email:f.intent.adminEmail,password:f.password}}),200);return r.headers.get('set-cookie').split(';')[0];}

test('unsigned, forged, legacy and wrong-origin requests cannot initialize',async t=>{
 const f=await fixture(t);
 for(const body of [{},{...f.request,signature:'0'.repeat(128)},{...f.request,operationId:crypto.randomUUID()},{...f.request,password:'synthetic legacy password'},{...f.request,adminEmail:'attacker@motive.test'}])await status(f.bootstrap({body}),403);
 await status(f.bootstrap({origin:'https://evil.test'}),403);
 await status(f.bootstrap({headers:{'X-Motive-Bootstrap':freshToken()}}),403);
 await status(f.call('/api/foundation/bootstrap'),405);
 await status(f.diagnostic(),403);
 assert.equal(await f.count('accounts'),0);assert.equal(await f.count('foundation_installation'),0);assert.equal(await f.bucket.get(markerKey),null);
});

test('native approval is mandatory and scoped, expiring and immutable under the signature',async t=>{
 for(const kind of ['missing','malformed','legacyOnly','expired','overlong','future','changedRecipient','changedTarget','changedHash','changedKey'])await t.test(kind,async t=>{
  const f=await fixture(t);const p={...f.intent,publicKey:{...f.intent.publicKey}};
  if(kind==='expired')p.expiresAt=Date.now()-1;
  if(kind==='overlong')p.expiresAt=p.issuedAt+3600001;
  if(kind==='future'){p.issuedAt=Date.now()+60000;p.expiresAt=p.issuedAt+1000;}
  if(kind==='changedRecipient')p.invitationEmail='changed@motive.test';
  if(kind==='changedTarget')p.stage='production';
  if(kind==='changedHash')p.invitationHash=freshToken();
  if(kind==='changedKey')p.publicKey.x='A'.repeat(43);
  await f.update({MOTIVE_BOOTSTRAP_V2:kind==='missing'||kind==='legacyOnly'?'':kind==='malformed'?'{':JSON.stringify(p),...(kind==='legacyOnly'?{MOTIVE_BOOTSTRAP:'synthetic retired permit; never a real credential'}:{})});
  await status(f.bootstrap(),403);assert.equal(await f.count('accounts'),0);
 });
});

test('bootstrap HTTP exchange discloses no password, invitation, verifier or private signing key even under full capture',async t=>{
 const f=await fixture(t);const response=await status(f.bootstrap(),201);
 assert.deepEqual(await response.json(),{initialized:true});assert.equal(response.headers.get('set-cookie'),null);
 assert.match(response.headers.get('cache-control'),/no-store/);
 const captured=JSON.stringify(f.exchanges);
 for(const value of [f.password,f.invitation,f.intent.passwordHash,f.intent.invitationHash,f.intent.adminEmail,f.intent.invitationEmail,JSON.stringify(f.intent)])assert.equal(captured.includes(value),false);
 assert.equal(captured.includes('X-Motive-Bootstrap'),false);
 assert.equal(captured.includes('PRIVATE KEY'),false);
 assert.equal(await f.count('accounts'),1);assert.equal(await f.count('invitations'),1);assert.equal(await f.count('sessions'),0);
 assert.equal((await f.db.prepare('SELECT password FROM accounts').first()).password,f.intent.passwordHash);
 // A complete logged exchange authorizes only this immutable operation; replay
 // cannot create new recipients or sessions and cannot initialize a second time.
 await status(f.bootstrap({body:JSON.parse(f.exchanges[0].request.body)}),409);
 assert.equal(await f.count('accounts'),1);
});

test('first invitation retains least privilege; diagnostics require an active admin session',async t=>{
 const f=await fixture(t);await status(f.bootstrap(),201);const cookie=await login(f);
 const response=await status(f.diagnostic({cookie}),200);const text=await response.text();assert.equal(JSON.parse(text).ready,true);
 for(const value of [f.password,f.invitation,f.intent.passwordHash,f.intent.adminEmail])assert.equal(text.includes(value),false);
 await status(f.diagnostic(),403);
 const r=await status(f.call('/api/auth/register',{method:'POST',body:{email:f.intent.invitationEmail,password:'synthetic invitee secure password',token:f.invitation}}),200),guestCookie=r.headers.get('set-cookie').split(';')[0];
 assert.equal((await (await f.call('/api/auth/me',{cookie:guestCookie})).json()).admin,false);
 assert.deepEqual(await (await f.call('/api/plans',{cookie:guestCookie})).json(),[]);
 await status(f.diagnostic({cookie:guestCookie}),403);
 await status(f.call('/api/admin/invitations',{method:'POST',cookie:guestCookie,body:{email:'other@motive.test'}}),403);
 await status(f.call('/api/auth/logout',{method:'POST',cookie}),200);await status(f.diagnostic({cookie}),403);
});

test('concurrent requests have one winner, and deleted accounts or a new signed approval cannot reset the ledger',async t=>{
 const f=await fixture(t);const results=await Promise.all([f.bootstrap(),f.bootstrap()]);assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
 assert.equal(await f.count('foundation_installation'),1);assert.equal(await f.count('accounts'),1);assert.equal(await f.count('invitations'),1);
 const next=await makeBootstrap(f.target);await f.update({MOTIVE_BOOTSTRAP_V2:JSON.stringify(next.intent)});
 await status(f.bootstrap({body:next.request}),409);
 await f.db.prepare('DELETE FROM invitations').run();await f.db.prepare('DELETE FROM accounts').run();
 await status(f.bootstrap({body:next.request}),409);assert.equal(await f.count('foundation_installation'),1);
});

test('missing bindings and schema have safe phase codes, no raw errors or private data',async t=>{
 for(const omit of ['DB','BUCKET','schema'])await t.test(omit,async t=>{
  const f=await fixture(t,{omit:omit==='schema'?undefined:omit,migrate:omit!=='schema'});
  const r=await status(f.bootstrap(),503),body=await r.json();assert.deepEqual(body,{error:'BOOTSTRAP_UNAVAILABLE',phase:omit==='DB'?'d1_read':omit==='BUCKET'?'r2_read':'schema'});
  await status(f.diagnostic(),403);if(f.bucket)assert.equal(await f.bucket.get(markerKey),null);
 });
});

test('migration compatibility preserves baseline data and refuses populated database adoption',async t=>{
 const f=await fixture(t,{migrate:false});await f.apply(journal.entries.slice(0,2));await status(f.bootstrap(),503);
 await f.db.prepare("INSERT INTO foundation_probe VALUES ('retained','synthetic baseline',1)").run();
 await f.db.prepare("INSERT INTO accounts(id,email,password) VALUES ('existing','existing@motive.test','unchanged-hash')").run();
 await f.apply(journal.entries.slice(2));await status(f.bootstrap(),409);
 assert.deepEqual(await f.db.prepare("SELECT password,admin FROM accounts WHERE id='existing'").first(),{password:'unchanged-hash',admin:0});
 assert.equal((await f.db.prepare("SELECT value FROM foundation_probe WHERE id='retained'").first()).value,'synthetic baseline');assert.equal(await f.bucket.get(markerKey),null);
});

test('D1 partial failure rolls back ledger/admin/invitation, preserves matching R2 reservation, and allows exact retry',async t=>{
 const f=await fixture(t);
 await f.db.prepare("CREATE TRIGGER deny_test_admin BEFORE INSERT ON accounts BEGIN SELECT RAISE(ABORT,'SYNTHETIC_PRIVATE_ERROR_DO_NOT_DISCLOSE'); END").run();
 const r=await status(f.bootstrap(),503);assert.deepEqual(await r.json(),{error:'BOOTSTRAP_UNAVAILABLE',phase:'d1_commit'});
 for(const table of ['accounts','invitations','foundation_installation'])assert.equal(await f.count(table),0);
 assert.equal(JSON.stringify(f.exchanges).includes('SYNTHETIC_PRIVATE_ERROR_DO_NOT_DISCLOSE'),false);
 const before=await f.bucket.head(markerKey);assert.ok(before);
 await f.db.prepare('DROP TRIGGER deny_test_admin').run();await status(f.bootstrap(),201);assert.equal((await f.bucket.head(markerKey)).etag,before.etag);
});

test('occupied or conflicting R2 storage is never adopted or overwritten',async t=>{
 for(const kind of ['occupied','conflict'])await t.test(kind,async t=>{
  const f=await fixture(t),key=kind==='occupied'?'retained-object':markerKey,body=kind==='occupied'?'retain':JSON.stringify({site_id:f.target.siteId,instance_id:crypto.randomUUID(),stage:'production'});
  await f.bucket.put(key,body);await status(f.bootstrap(),409);assert.equal(await (await f.bucket.get(key)).text(),body);assert.equal(await f.count('accounts'),0);
 });
});

test('wrong stage, instance, missing claims or configuration deny private routes even with a valid admin cookie',async t=>{
 const f=await fixture(t);await status(f.bootstrap(),201);const cookie=await login(f);
 for(const target of [{...f.target,stage:'production'},{...f.target,instanceId:crypto.randomUUID()},null]){
  await f.update({MOTIVE_INSTANCE:target?JSON.stringify(target):''});
  for(const path of ['/api/auth/me','/api/groups','/api/plans','/api/images/00000000-0000-0000-0000-000000000000'])await status(f.call(path,{cookie}),503);
  assert.equal((await (await f.diagnostic({cookie})).json()).ready,false);
 }
 await f.update({MOTIVE_INSTANCE:JSON.stringify(f.target)});await f.bucket.delete(markerKey);await status(f.call('/api/auth/me',{cookie}),503);
});

test('separate instances reject copied cookies and expose no shared R2 object',async t=>{
 const a=await fixture(t),b=await fixture(t);await status(a.bootstrap(),201);await status(b.bootstrap(),201);
 const cookie=await login(a);await status(b.call('/api/auth/me',{cookie}),401);
 await a.bucket.put('synthetic-isolation-probe','not shared');assert.equal(await b.bucket.get('synthetic-isolation-probe'),null);
});
