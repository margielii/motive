const encoder = new TextEncoder();
export const token = () => hex(crypto.getRandomValues(new Uint8Array(32)));
function hex(bytes: Uint8Array) { return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''); }
export async function digest(value: string) { return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))); }
export async function passwordHash(password: string, salt = token()) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 600000 }, key, 256);
  return `pbkdf2-sha256$600000$${salt}$${hex(new Uint8Array(bits))}`;
}
export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256' || parts[1] !== '600000') return false;
  const candidate = await passwordHash(password, parts[2]);
  let diff = candidate.length ^ stored.length;
  for (let i = 0; i < stored.length; i++) diff |= stored.charCodeAt(i) ^ candidate.charCodeAt(i);
  return diff === 0;
}
