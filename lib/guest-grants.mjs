// Standalone proof-of-concept primitives. NOT an authorization middleware.
// Callers must load the grant by hash from durable storage on every request.
export function issueGuestToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashGuestToken(token) {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

export function allowsGuestAction(grant, { planId, action, now = Date.now() }) {
  return Boolean(grant && grant.revokedAt == null && Number.isFinite(grant.expiresAt)
    && now < grant.expiresAt && grant.planId === planId
    && Array.isArray(grant.actions) && grant.actions.includes(action));
}
