import { test } from 'node:test';
import assert from 'node:assert/strict';
import { passwordHash, verifyPassword } from '../server/crypto.ts';
test('PBKDF2 uses unique salts and validates only the correct password', async()=>{
 const a=await passwordHash('long test password'), b=await passwordHash('long test password');
 assert.notEqual(a,b);assert.equal(await verifyPassword('long test password',a),true);assert.equal(await verifyPassword('wrong test password',a),false);
 assert.equal(await verifyPassword('long test password','malformed'),false);
 assert.equal(await verifyPassword('long test password',a.replace('600000','1')),false);
});
