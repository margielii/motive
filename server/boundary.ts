import { digest, token, passwordHash, verifyPassword } from './crypto';

type Env = { DB?: D1Database; BUCKET?: R2Bucket };
type Account = { id: string; email: string; admin: number; password: string };
const DAY = 86400000;
const MAX_IMAGE = 2 * 1024 * 1024;
const fail = (status = 403) => { throw new Response(JSON.stringify({ error: status === 401 ? 'Sign in required' : 'Request denied' }), { status, headers: { 'Content-Type': 'application/json' } }); };
const json = (data: unknown, status = 200) => Response.json(data, { status });
function cookie(req: Request, name: string) { return req.headers.get('Cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='))?.slice(name.length + 1) ?? ''; }
const setCookie = (name: string, value: string, seconds: number) => `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${seconds}`;
async function bytes(req: Request, max: number) {
  const reader = req.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length; if (size > max) { await reader.cancel(); fail(413); } chunks.push(value);
  }
  const result = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}
async function payload(req: Request): Promise<Record<string, string>> {
  try {
    const value = JSON.parse(new TextDecoder().decode(await bytes(req, 8192)));
    if (!value || Array.isArray(value) || typeof value !== 'object' || Object.values(value).some(v => typeof v !== 'string')) return fail(400);
    return value;
  } catch (e) { if (e instanceof Response) throw e; return fail(400); }
}
const validToken = (s: string) => /^[a-f0-9]{64}$/.test(s);
export async function boundary(req: Request, env: Env): Promise<Response | null> {
  const url = new URL(req.url), path = url.pathname;
  // Only these static public assets and the public sign-in shell reach Vinext.
  const publicAsset = path === '/' || path === '/manifest.webmanifest' || path === '/sw.js' || /^\/icons\/motive-(192|512|apple)\.png$/.test(path) || path === '/favicon.svg' || path.startsWith('/_next/static/');
  if (publicAsset && ['GET', 'HEAD'].includes(req.method)) return null;
  let response: Response;
  try { response = await route(req, env, path); }
  catch (error) { response = error instanceof Response ? error : json({ error: 'Service unavailable' }, 503); }
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Vary', 'Cookie, Authorization');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  return response;
}
async function route(req: Request, env: Env, path: string): Promise<Response> {
  const db = env.DB; if (!db) return fail(503);
  const q = (sql: string, ...args: (string | number)[]) => db.prepare(sql).bind(...args);
  const now = Date.now();
  if (!['GET', 'HEAD'].includes(req.method) && req.headers.get('Origin') !== new URL(req.url).origin) return fail();
  async function account(): Promise<Account> {
    const raw = cookie(req, '__Host-motive'); if (!validToken(raw)) return fail(401);
    const a = await q("SELECT a.* FROM accounts a JOIN sessions s ON s.account_id=a.id WHERE s.hash=? AND s.expires>? AND a.status='active'", await digest(raw), now).first<Account>();
    return a ?? fail(401);
  }
  async function plan(id: string, write = false) {
    // Group membership is never sufficient for plan access.
    try {
      const a = await account();
      const member = await q('SELECT role FROM plan_members WHERE plan_id=? AND account_id=?', id, a.id).first<{role:string}>();
      if (member && (!write || ['owner','editor'].includes(member.role))) return a;
    } catch (e) { if (!(e instanceof Response) || e.status !== 401) throw e; }
    if (!write) {
      const raw = cookie(req, '__Host-motive-guest');
      if (validToken(raw) && await q('SELECT g.hash FROM guest_sessions s JOIN guest_grants g ON g.hash=s.grant_hash WHERE s.hash=? AND s.expires>? AND g.plan_id=? AND g.expires>? AND g.revoked=0', await digest(raw), now, id, now).first()) return null;
    }
    return fail();
  }
  async function owner(id: string) {
    const a = await account();
    if (!await q("SELECT 1 FROM plan_members WHERE plan_id=? AND account_id=? AND role='owner'", id, a.id).first()) return fail();
    return a;
  }
  async function limited(key: string, limit: number) {
    await q('DELETE FROM rate_limits WHERE key IN (SELECT key FROM rate_limits WHERE expires<=? LIMIT 100)',now).run();
    const r = await q('INSERT INTO rate_limits(key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<=? THEN 1 ELSE count+1 END, expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END RETURNING count', await digest(key), now + 900000, now, now).first<{count:number}>();
    if (!r || r.count > limit) fail(429);
  }
  async function session(a: {id:string;password:string}) {
    const raw = token();
    const inserted = await q("INSERT INTO sessions SELECT ?,id,? FROM accounts WHERE id=? AND password=? AND status='active'", await digest(raw), now + 7 * DAY, a.id, a.password).run();
    if (inserted.meta.changes !== 1) return fail(401);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json', 'Set-Cookie': setCookie('__Host-motive', raw, 604800) } });
  }
  if (path === '/api/auth/me' && req.method === 'GET') { const a = await account(); return json({ id: a.id, email: a.email, admin: !!a.admin }); }
  if (['/api/auth/register', '/api/auth/login', '/api/auth/recover', '/api/guest/redeem'].includes(path) && req.method === 'POST') {
    await limited('ip:' + (req.headers.get('CF-Connecting-IP') ?? 'local'), 30);
    const p = await payload(req);
    if (path === '/api/guest/redeem') {
      if (!validToken(p.token ?? '')) return fail();
      const hash = await digest(p.token), raw = token();
      // Atomic consume + session creation in one D1 transaction. A replay creates nothing.
      const result = await db.batch([
        q('INSERT INTO guest_sessions SELECT ?,hash,MIN(expires,?) FROM guest_grants WHERE hash=? AND used=0 AND revoked=0 AND expires>?', await digest(raw), now + DAY, hash, now),
        q('UPDATE guest_grants SET used=1 WHERE hash=? AND used=0 AND revoked=0 AND expires>?', hash, now),
      ]);
      if (result[0].meta.changes !== 1) return fail();
      return new Response('{"ok":true}', { headers: { 'Content-Type':'application/json', 'Set-Cookie':setCookie('__Host-motive-guest', raw, 86400) } });
    }
    const email = (p.email ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return fail(400);
    await limited('email:' + email, 10);
    if (typeof p.password !== 'string' || p.password.length < 12 || p.password.length > 128) return fail(400);
    if (path === '/api/auth/login') {
      const a = await q("SELECT * FROM accounts WHERE email=? AND status='active'", email).first<Account>();
      // Equal KDF work for unknown identities.
      const dummy = 'pbkdf2-sha256$600000$' + '0'.repeat(64) + '$' + '0'.repeat(64);
      const ok = await verifyPassword(p.password, a?.password ?? dummy);
      if (!a || !ok) return fail(401);
      return session(a);
    }
    if (!validToken(p.token ?? '')) return fail();
    const hash = await digest(p.token), password = await passwordHash(p.password);
    if (path === '/api/auth/register') {
      const id = crypto.randomUUID();
      const result = await db.batch([
        q('INSERT INTO accounts(id,email,password) SELECT ?,email,? FROM invitations WHERE hash=? AND email=? AND used=0 AND expires>?', id, password, hash, email, now),
        q('UPDATE invitations SET used=1 WHERE hash=? AND email=? AND used=0 AND expires>?', hash, email, now),
      ]);
      if (result[0].meta.changes !== 1) return fail();
      return session({ id, password });
    }
    const a = await q("SELECT a.id FROM accounts a JOIN recovery r ON r.account_id=a.id WHERE r.hash=? AND a.email=? AND a.status='active' AND r.used=0 AND r.expires>?", hash, email, now).first<{id:string}>();
    if (!a) return fail();
    const result = await db.batch([
      q('UPDATE accounts SET password=? WHERE id=? AND EXISTS(SELECT 1 FROM recovery WHERE hash=? AND used=0 AND expires>?)', password, a.id, hash, now),
      q('DELETE FROM sessions WHERE account_id=?', a.id),
      q('UPDATE recovery SET used=1 WHERE account_id=?', a.id),
    ]);
    if (result[0].meta.changes !== 1) return fail();
    return json({ ok: true });
  }
  if (path === '/api/auth/logout' && req.method === 'POST') {
    await db.batch([q('DELETE FROM sessions WHERE hash=?', await digest(cookie(req, '__Host-motive'))), q('DELETE FROM guest_sessions WHERE hash=?', await digest(cookie(req, '__Host-motive-guest')))]);
    const r = json({ ok: true }); r.headers.append('Set-Cookie',setCookie('__Host-motive','',0)); r.headers.append('Set-Cookie',setCookie('__Host-motive-guest','',0)); return r;
  }
  if (path === '/api/admin/invitations' && req.method === 'POST') {
    const a = await account(); if (!a.admin) return fail();
    const p = await payload(req), email = (p.email ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return fail(400);
    const raw = token(); await q('INSERT INTO invitations VALUES (?,?,?,0)', await digest(raw), email, now + DAY).run(); return json({ token: raw, expires: now + DAY });
  }
  if (path === '/api/admin/recovery' && req.method === 'POST') {
    const a = await account(); if (!a.admin) return fail();
    const p = await payload(req), target = await q("SELECT id FROM accounts WHERE email=? AND status='active'", (p.email ?? '').trim().toLowerCase()).first<{id:string}>();
    if (!target) return fail();
    const raw = token();
    await db.batch([q('UPDATE recovery SET used=1 WHERE account_id=?',target.id),q('INSERT INTO recovery VALUES (?,?,?,0)', await digest(raw), target.id, now + 3600000)]);
    return json({ token: raw, expires: now + 3600000 });
  }
  if (path === '/api/admin/restrict' && req.method === 'POST') {
    const a = await account(); if (!a.admin) return fail(); const p = await payload(req);
    if (p.id === a.id || !['active','disabled'].includes(p.status)) return fail(400);
    await db.batch([q('UPDATE accounts SET status=? WHERE id=?',p.status,p.id),q('DELETE FROM sessions WHERE account_id=?',p.id)]); return json({ ok:true });
  }
  if (path === '/api/groups') {
    const a = await account();
    if (req.method === 'GET') return json((await q('SELECT g.* ,m.role FROM groups g JOIN group_members m ON m.group_id=g.id WHERE m.account_id=?',a.id).all()).results);
    if (req.method === 'POST') { const p = await payload(req), id = crypto.randomUUID(); if (!p.name?.trim() || p.name.length > 100) return fail(400); await db.batch([q('INSERT INTO groups VALUES (?,?)',id,p.name),q("INSERT INTO group_members VALUES (?,?,'owner')",id,a.id)]); return json({ id },201); }
  }
  const group = path.match(/^\/api\/groups\/([^/]+)\/members$/);
  if (group && ['POST','DELETE'].includes(req.method)) {
    const a = await account(), p = await payload(req);
    if (!await q("SELECT 1 FROM group_members WHERE group_id=? AND account_id=? AND role='owner'",group[1],a.id).first()) return fail();
    if (await q("SELECT 1 FROM group_members WHERE group_id=? AND account_id=? AND role='owner'",group[1],p.accountId).first()) return fail();
    if (req.method === 'POST') {
      if (!await q("SELECT 1 FROM accounts WHERE id=? AND status='active'",p.accountId).first()) return fail();
      await q("INSERT OR IGNORE INTO group_members VALUES (?,?,'member')",group[1],p.accountId).run();
    } else {
      await db.batch([q('DELETE FROM plan_members WHERE account_id=? AND plan_id IN (SELECT id FROM plans WHERE group_id=?)',p.accountId,group[1]),q('DELETE FROM group_members WHERE group_id=? AND account_id=?',group[1],p.accountId)]);
    }
    return json({ok:true});
  }
  if (path === '/api/plans') {
    const a = await account();
    if (req.method === 'GET') return json((await q('SELECT p.*,m.role FROM plans p JOIN plan_members m ON m.plan_id=p.id WHERE m.account_id=?',a.id).all()).results);
    if (req.method === 'POST') { const p = await payload(req), id = crypto.randomUUID(); if (!p.title?.trim() || p.title.length > 200) return fail(400); if (!await q("SELECT 1 FROM group_members WHERE group_id=? AND account_id=? AND role='owner'",p.groupId,a.id).first()) return fail(); await db.batch([q('INSERT INTO plans VALUES (?,?,?)',id,p.groupId,p.title),q("INSERT INTO plan_members VALUES (?,?,'owner')",id,a.id)]); return json({ id },201); }
  }
  const match = path.match(/^\/api\/plans\/([^/]+)(?:\/(guests|images|members))?$/);
  if (match) {
    const [,id,kind] = match;
    if (!kind && req.method === 'GET') { await plan(id); return json(await q('SELECT id,title FROM plans WHERE id=?',id).first()); }
    if (kind === 'members' && req.method === 'POST') {
      await owner(id); const p = await payload(req);
      // Owner transfer is intentionally excluded. Target must be an active group member.
      if (!['editor','viewer'].includes(p.role)) return fail(400);
      if (!await q("SELECT 1 FROM plans p JOIN group_members m ON m.group_id=p.group_id JOIN accounts a ON a.id=m.account_id WHERE p.id=? AND m.account_id=? AND a.status='active'",id,p.accountId).first()) return fail();
      if (await q("SELECT 1 FROM plan_members WHERE plan_id=? AND account_id=? AND role='owner'",id,p.accountId).first()) return fail();
      await q('INSERT INTO plan_members VALUES (?,?,?) ON CONFLICT(plan_id,account_id) DO UPDATE SET role=excluded.role',id,p.accountId,p.role).run(); return json({ ok:true });
    }
    if (kind === 'guests') {
      await owner(id);
      if (req.method === 'POST') { const raw = token(); await q('INSERT INTO guest_grants VALUES (?,?,?,0,0)',await digest(raw),id,now + DAY).run(); return json({ token:raw, hash:await digest(raw), expires:now+DAY }); }
      if (req.method === 'DELETE') { const p = await payload(req); await q('UPDATE guest_grants SET revoked=1 WHERE hash=? AND plan_id=?',p.hash,id).run(); return json({ ok:true }); }
    }
    if (kind === 'images') {
      if (req.method === 'GET') { await plan(id); return json((await q('SELECT id,type,size FROM images WHERE plan_id=?',id).all()).results); }
      if (req.method === 'POST') {
        const a = await plan(id,true); if (!a || !env.BUCKET) return fail(503);
        const data = await bytes(req,MAX_IMAGE), type = req.headers.get('Content-Type');
        const png = [137,80,78,71,13,10,26,10].every((b,i)=>data[i]===b);
        const jpeg = data.length > 3 && data[0]===255 && data[1]===216 && data[2]===255;
        if (!((type==='image/png' && png) || (type==='image/jpeg' && jpeg))) return fail(415);
        const imageId=crypto.randomUUID(); await env.BUCKET.put(imageId,data,{httpMetadata:{contentType:type!}});
        try { await q('INSERT INTO images VALUES (?,?,?,?,?)',imageId,id,a.id,type!,data.length).run(); } catch(e) { await env.BUCKET.delete(imageId); throw e; }
        return json({id:imageId},201);
      }
    }
  }
  const image = path.match(/^\/api\/images\/([a-f0-9-]{36})$/);
  if (image) {
    const row = await q('SELECT * FROM images WHERE id=?',image[1]).first<{id:string;plan_id:string;owner_id:string;type:string}>(); if (!row) return fail(404);
    await plan(row.plan_id, req.method === 'DELETE');
    if (!env.BUCKET) return fail(503);
    if (req.method === 'GET') { const obj=await env.BUCKET.get(row.id); if (!obj) return fail(404); return new Response(obj.body,{headers:{'Content-Type':row.type,'Content-Disposition':'attachment; filename="motive-image"'}}); }
    if (req.method === 'DELETE') { const a=await account(); if(a.id!==row.owner_id) await owner(row.plan_id); await env.BUCKET.delete(row.id); await q('DELETE FROM images WHERE id=?',row.id).run(); return json({ok:true}); }
  }
  // All unknown pages, APIs, methods and framework endpoints fail closed.
  return fail(404);
}
