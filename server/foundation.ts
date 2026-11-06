import hosting from '../.openai/hosting.json';
import { digest } from './crypto';
import { serializeBootstrapIntent } from '../lib/bootstrap-intent.mjs';

export type FoundationEnv = {
  DB?: D1Database;
  BUCKET?: R2Bucket;
  MOTIVE_INSTANCE?: string;
  MOTIVE_BOOTSTRAP_V2?: string;
};
type Instance = { siteId: string; instanceId: string; stage: 'local' | 'staging' | 'production' };
type Intent = Instance & {
  version: 2; operationId: string; issuedAt: number; expiresAt: number;
  adminEmail: string; passwordHash: string; invitationEmail: string;
  invitationHash: string; invitationExpiresAt: number;
  publicKey: {kty:'EC'; crv:'P-256'; x:string; y:string};
};
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
function approvedIntent(env: FoundationEnv): Intent | null {
  try {
    const p = JSON.parse(env.MOTIVE_BOOTSTRAP_V2 ?? 'null'), target = instance(env), now = Date.now();
    if (!target || p?.version !== 2 || p.siteId !== target.siteId || p.instanceId !== target.instanceId || p.stage !== target.stage
      || typeof p.operationId !== 'string' || !/^[a-f0-9-]{36}$/.test(p.operationId)
      || !Number.isSafeInteger(p.issuedAt) || p.issuedAt > now || !Number.isSafeInteger(p.expiresAt) || p.expiresAt <= now || p.expiresAt > p.issuedAt + 3600000
      || !email(p.adminEmail) || !email(p.invitationEmail) || p.adminEmail === p.invitationEmail
      || typeof p.passwordHash !== 'string' || !/^pbkdf2-sha256\$600000\$[a-f0-9]{64}\$[a-f0-9]{64}$/.test(p.passwordHash)
      || typeof p.invitationHash !== 'string' || !/^[a-f0-9]{64}$/.test(p.invitationHash)
      || !Number.isSafeInteger(p.invitationExpiresAt) || p.invitationExpiresAt <= now || p.invitationExpiresAt > p.issuedAt + DAY
      || p.publicKey?.kty !== 'EC' || p.publicKey.crv !== 'P-256' || !/^[A-Za-z0-9_-]{43}$/.test(p.publicKey.x) || !/^[A-Za-z0-9_-]{43}$/.test(p.publicKey.y)) return null;
    return p;
  } catch { return null; }
}
async function signedIntent(req: Request, env: FoundationEnv, payload: (req: Request) => Promise<Record<string,string>>): Promise<Intent | null> {
  const p = approvedIntent(env);
  // Never read or authenticate the retired bearer header. Legacy permits are ignored.
  if (!p || req.headers.has('X-Motive-Bootstrap')) return null;
  const request = await payload(req);
  if (Object.keys(request).sort().join(',') !== 'operationId,signature,version' || request.version !== '2' || request.operationId !== p.operationId || !/^[a-f0-9]{128}$/.test(request.signature ?? '')) return null;
  try {
    const key = await crypto.subtle.importKey('jwk',p.publicKey,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
    const signature = Uint8Array.from(request.signature.match(/../g)!,v=>parseInt(v,16));
    return await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,signature,new TextEncoder().encode(serializeBootstrapIntent(p))) ? p : null;
  } catch { return null; }
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
    // Pre-initialization diagnostics no longer accept any HTTP credential.
    if (!await administrator(req, env)) return deny(403);
    return Response.json(await diagnostics(env));
  }
  if (req.method !== 'POST') return deny(405);
  if (req.headers.get('Origin') !== new URL(req.url).origin) return deny(403);
  const intent = await signedIntent(req, env, payload);
  if (!intent) return deny(403);
  let phase = 'readiness';
  try {
    const state = await diagnostics(env);
    if (!state.d1.reachable || !state.d1.schemaReady || !state.r2.reachable) {
      return Response.json({error:'BOOTSTRAP_UNAVAILABLE',phase:!state.d1.reachable?'d1_read':!state.d1.schemaReady?'schema':'r2_read'},{status:503});
    }
    if (state.d1.claimed || (state.r2.claimed && !state.r2.matches)) return deny(409);
    const db = env.DB!, bucket = env.BUCKET!;
    const empty = ['accounts','invitations','sessions','recovery','groups','plans','group_members','plan_members','guest_grants','guest_sessions','images'].map(table=>`NOT EXISTS(SELECT 1 FROM ${table})`).join(' AND ');
    phase = 'd1_empty_check';
    if (!(await db.prepare(`SELECT ${empty} AS empty`).first<{empty:number}>())?.empty) return deny(409);
    phase = 'r2_reserve';
    if (!state.r2.claimed && (await bucket.list({limit:1})).objects.length !== 0) return deny(409);
    if (!state.r2.claimed) await bucket.put(MARKER_KEY,JSON.stringify({site_id:intent.siteId,instance_id:intent.instanceId,stage:intent.stage}),{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'}});
    phase = 'r2_verify';
    const marker = await bucketMarker(env);
    if (!marker || !same(intent,marker)) return deny(409);
    const bootstrapId = crypto.randomUUID(), accountId = crypto.randomUUID();
    phase = 'd1_commit';
    // No runtime password KDF and no credential generation/transmission over HTTP.
    // Only the exact signed, native-approved operation can populate this batch.
    let result: D1Result[];
    try {
      result = await db.batch([
        db.prepare(`INSERT INTO foundation_installation(id,site_id,instance_id,stage,bootstrap_id,initialized_at) SELECT 1,?,?,?,?,? WHERE ${empty}`).bind(intent.siteId,intent.instanceId,intent.stage,bootstrapId,Date.now()),
        db.prepare('INSERT INTO accounts(id,email,password,admin) SELECT ?,?,?,1 FROM foundation_installation WHERE id=1 AND bootstrap_id=?').bind(accountId,intent.adminEmail,intent.passwordHash,bootstrapId),
        db.prepare('INSERT INTO invitations(hash,email,expires,used) SELECT ?,?,?,0 FROM foundation_installation WHERE id=1 AND bootstrap_id=?').bind(intent.invitationHash,intent.invitationEmail,intent.invitationExpiresAt,bootstrapId),
      ]);
    } catch {
      // A concurrent winner or an ambiguous commit acknowledgment must never cause
      // a second initialization. Never serialize a database exception or its values.
      if (await db.prepare('SELECT 1 FROM foundation_installation WHERE id=1').first()) return deny(409);
      throw new Error('Commit unavailable');
    }
    if (result.some(r=>r.meta.changes !== 1)) return deny(409);
    return Response.json({initialized:true},{status:201});
  } catch (error) {
    if (error instanceof Response) throw error;
    // Fixed phase enums help safe hosted diagnosis without fetching raw request logs.
    return Response.json({error:'BOOTSTRAP_UNAVAILABLE',phase},{status:503});
  }
}
