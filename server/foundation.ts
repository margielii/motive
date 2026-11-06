import hosting from '../.openai/hosting.json';
import { digest, passwordHash, token } from './crypto';

export type FoundationEnv = {
  DB?: D1Database;
  BUCKET?: R2Bucket;
  MOTIVE_INSTANCE?: string;
  MOTIVE_BOOTSTRAP?: string;
};
type Instance = { siteId: string; instanceId: string; stage: 'local' | 'staging' | 'production' };
type Permit = { tokenHash: string; issuedAt: number; expiresAt: number; adminEmail: string };
type Installation = { site_id: string; instance_id: string; stage: string };
const DAY = 86400000;
export const MARKER_KEY = '__motive_installation_v1';
const deny = (status: number) => { throw Response.json({ error: 'Foundation request denied' }, { status }); };
const email = (s: unknown): s is string => typeof s === 'string' && s === s.trim().toLowerCase() && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const same = (a: Instance, b: Installation) => a.siteId === b.site_id && a.instanceId === b.instance_id && a.stage === b.stage;

function instance(env: FoundationEnv): Instance | null {
  try {
    const p = JSON.parse(env.MOTIVE_INSTANCE ?? 'null');
    if (p?.siteId !== hosting.project_id || typeof p.instanceId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(p.instanceId) || !['local','staging','production'].includes(p.stage)) return null;
    return { siteId: p.siteId, instanceId: p.instanceId, stage: p.stage };
  } catch { return null; }
}
function permit(env: FoundationEnv): Permit | null {
  try {
    const p = JSON.parse(env.MOTIVE_BOOTSTRAP ?? 'null');
    const now = Date.now();
    if (!instance(env) || typeof p?.tokenHash !== 'string' || !/^[a-f0-9]{64}$/.test(p.tokenHash) || !Number.isSafeInteger(p.issuedAt) || p.issuedAt > now || !Number.isSafeInteger(p.expiresAt) || p.expiresAt <= now || p.expiresAt > p.issuedAt + 3600000 || !email(p.adminEmail)) return null;
    return p;
  } catch { return null; }
}
async function operator(req: Request, env: FoundationEnv): Promise<Permit | null> {
  const p = permit(env), raw = req.headers.get('X-Motive-Bootstrap') ?? '';
  if (!p || !/^[a-f0-9]{64}$/.test(raw)) return null;
  const hash = await digest(raw);
  let diff = 0;
  for (let i = 0; i < 64; i++) diff |= hash.charCodeAt(i) ^ p.tokenHash.charCodeAt(i);
  return diff === 0 ? p : null;
}
async function administrator(req: Request, env: FoundationEnv) {
  const raw = req.headers.get('Cookie')?.split(';').map(c => c.trim()).find(c => c.startsWith('__Host-motive='))?.slice('__Host-motive='.length) ?? '';
  if (!env.DB || !/^[a-f0-9]{64}$/.test(raw)) return false;
  try {
    return !!await env.DB.prepare("SELECT 1 FROM accounts a JOIN sessions s ON s.account_id=a.id WHERE s.hash=? AND s.expires>? AND a.status='active' AND a.admin=1").bind(await digest(raw), Date.now()).first();
  } catch { return false; }
}
async function bucketMarker(env: FoundationEnv): Promise<Installation | null> {
  if (!env.BUCKET) throw new Error('Unavailable');
  const obj = await env.BUCKET.get(MARKER_KEY);
  if (!obj) return null;
  if (obj.size > 1024) throw new Error('Invalid marker');
  const value = await obj.json<Installation>();
  if (!value || typeof value !== 'object') throw new Error('Invalid marker');
  return value;
}
// No instance configuration or mismatched/absent marker => no private app access.
// Never cache this result across requests or trust a caller-supplied stage header.
export async function installationMatches(env: FoundationEnv) {
  const target = instance(env);
  if (!target || !env.DB || !env.BUCKET) return false;
  try {
    const [db, bucket] = await Promise.all([
      env.DB.prepare('SELECT site_id,instance_id,stage FROM foundation_installation WHERE id=1').first<Installation>(),
      bucketMarker(env),
    ]);
    return !!db && !!bucket && same(target, db) && same(target, bucket);
  } catch { return false; }
}
async function diagnostics(env: FoundationEnv) {
  const target = instance(env);
  const d1 = { bound: !!env.DB, reachable: false, schemaReady: false, claimed: false, matches: false };
  const r2 = { bound: !!env.BUCKET, reachable: false, claimed: false, matches: false };
  await Promise.all([
    (async () => {
      if (!env.DB) return;
      try {
        // Query schema names only; no user rows, account counts or resource IDs are returned.
        const schema = await env.DB.prepare("SELECT COUNT(*) AS n FROM sqlite_schema WHERE type='table' AND name IN ('accounts','invitations','sessions','recovery','groups','group_members','plans','plan_members','guest_grants','guest_sessions','images','rate_limits','foundation_installation')").first<{n:number}>();
        d1.reachable = true; d1.schemaReady = schema?.n === 13;
        if (!d1.schemaReady) return;
        const row = await env.DB.prepare('SELECT site_id,instance_id,stage FROM foundation_installation WHERE id=1').first<Installation>();
        d1.claimed = !!row; d1.matches = !!target && !!row && same(target, row);
      } catch { /* Only non-sensitive status flags leave this function. */ }
    })(),
    (async () => {
      if (!env.BUCKET) return;
      try { const marker = await bucketMarker(env); r2.reachable = true; r2.claimed = !!marker; r2.matches = !!target && !!marker && same(target, marker); } catch { /* No raw binding errors. */ }
    })(),
  ]);
  return { target, d1, r2, ready: !!target && d1.schemaReady && d1.matches && r2.matches };
}

export async function foundationRequest(req: Request, env: FoundationEnv, path: string, payload: (req: Request) => Promise<Record<string,string>>): Promise<Response | null> {
  if (path !== '/api/foundation/bootstrap' && path !== '/api/foundation/diagnostics') return null;
  if (path === '/api/foundation/diagnostics') {
    if (req.method !== 'GET') return deny(405);
    // Before initialization: short-lived operator permit. Afterward: active MOTIVE admin.
    // No reliance on spoofable ChatGPT identity or on the Site being private.
    if (!await operator(req, env) && !await administrator(req, env)) return deny(403);
    return Response.json(await diagnostics(env));
  }
  if (req.method !== 'POST') return deny(405);
  if (req.headers.get('Origin') !== new URL(req.url).origin) return deny(403);
  const authorization = await operator(req, env);
  if (!authorization) return deny(403);
  const target = instance(env)!;
  const p = await payload(req);
  if (p.confirm !== 'INITIALIZE MOTIVE ONCE' || p.siteId !== target.siteId || p.instanceId !== target.instanceId || p.stage !== target.stage || p.adminEmail !== authorization.adminEmail || !email(p.invitationEmail) || p.invitationEmail === p.adminEmail || typeof p.password !== 'string' || p.password.length < 12 || p.password.length > 128) return deny(400);
  const state = await diagnostics(env);
  if (!state.d1.reachable || !state.d1.schemaReady || !state.r2.reachable) return deny(503);
  if (state.d1.claimed || (state.r2.claimed && !state.r2.matches)) return deny(409);
  const db = env.DB!, bucket = env.BUCKET!;
  // Refuse pre-existing application data. No automatic takeover/promotion of imported accounts.
  const empty = ['accounts','invitations','sessions','recovery','groups','plans','group_members','plan_members','guest_grants','guest_sessions','images'].map(table=>`NOT EXISTS(SELECT 1 FROM ${table})`).join(' AND ');
  if (!(await db.prepare(`SELECT ${empty} AS empty`).first<{empty:number}>())?.empty) return deny(409);
  const password = await passwordHash(p.password);
  // R2 and D1 have no shared transaction. Reserve the bucket once, never overwrite it.
  // A matching R2 reservation without a D1 commit is safe to retry with the same target.
  if (!state.r2.claimed && (await bucket.list({limit:1})).objects.length !== 0) return deny(409);
  if (!state.r2.claimed) await bucket.put(MARKER_KEY, JSON.stringify({site_id:target.siteId,instance_id:target.instanceId,stage:target.stage}), { onlyIf: { etagDoesNotMatch: '*' }, httpMetadata:{contentType:'application/json'} });
  const marker = await bucketMarker(env);
  if (!marker || !same(target, marker)) return deny(409);
  const bootstrapId = crypto.randomUUID(), accountId = crypto.randomUUID(), invitation = token(), now = Date.now();
  const invitationHash = await digest(invitation);
  // Unique singleton row serializes concurrent attempts; every dependent write is
  // tied to this invocation's nonce. D1 batch rollback prevents partial admin setup.
  const result = await db.batch([
    db.prepare(`INSERT INTO foundation_installation(id,site_id,instance_id,stage,bootstrap_id,initialized_at) SELECT 1,?,?,?,?,? WHERE ${empty}`).bind(target.siteId,target.instanceId,target.stage,bootstrapId,now),
    db.prepare("INSERT INTO accounts(id,email,password,admin) SELECT ?,?,?,1 FROM foundation_installation WHERE id=1 AND bootstrap_id=?").bind(accountId,p.adminEmail,password,bootstrapId),
    db.prepare('INSERT INTO invitations(hash,email,expires,used) SELECT ?,?,?,0 FROM foundation_installation WHERE id=1 AND bootstrap_id=?').bind(invitationHash,p.invitationEmail,now+DAY,bootstrapId),
  ]).catch(() => null);
  if (!result || result.some(r=>r.meta.changes !== 1)) return deny(409);
  // No automatic session, privilege grant to the invitee, or reusable reset route.
  return Response.json({ initialized:true, invitation:{token:invitation,expires:now+DAY} },{status:201});
}
