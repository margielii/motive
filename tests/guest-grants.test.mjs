import { test } from 'node:test';
import assert from 'node:assert/strict';
import { issueGuestToken, hashGuestToken, allowsGuestAction } from '../lib/guest-grants.mjs';

test('tokens are random 256-bit values and only hashes are looked up', async () => {
  const a = issueGuestToken(), b = issueGuestToken();
  assert.match(a, /^[a-f0-9]{64}$/);
  assert.notEqual(a, b);
  assert.notEqual(await hashGuestToken(a), a);
  assert.equal(await hashGuestToken('bad'), null);
});
test('grant denies wrong resource, action, expiry and revocation', () => {
  const grant = {planId: 'p1', actions: ['view'], expiresAt: 200, revokedAt: null};
  assert.equal(allowsGuestAction(grant, {planId:'p1', action:'view', now:100}), true);
  assert.equal(allowsGuestAction(grant, {planId:'p2', action:'view', now:100}), false);
  assert.equal(allowsGuestAction(grant, {planId:'p1', action:'edit', now:100}), false);
  assert.equal(allowsGuestAction(grant, {planId:'p1', action:'view', now:200}), false);
  assert.equal(allowsGuestAction({...grant, revokedAt: 50}, {planId:'p1', action:'view', now:100}), false);
  assert.equal(allowsGuestAction(null, {planId:'p1', action:'view', now:100}), false);
});
