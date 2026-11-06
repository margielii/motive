import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
const execute=promisify(execFile);
test('offline foundation preparation emits unique target/permit, no default password, and no ready-to-run initialization',async()=>{
 const run=async()=>JSON.parse((await execute(process.execPath,['scripts/prepare-foundation.mjs','local','admin@example.test','invitee@example.test'])).stdout);
 const a=await run(),b=await run();
 const context=JSON.parse(a.runtimeValues[0].value),permit=JSON.parse(a.runtimeValues[1].value),raw=a.request.headers['X-Motive-Bootstrap'];
 assert.notEqual(raw,b.request.headers['X-Motive-Bootstrap']);assert.notEqual(context.instanceId,JSON.parse(b.runtimeValues[0].value).instanceId);
 assert.match(raw,/^[a-f0-9]{64}$/);assert.equal(permit.tokenHash,createHash('sha256').update(raw).digest('hex'));assert.equal(a.runtimeValues[1].is_secret,true);
 assert.equal(permit.expiresAt-permit.issuedAt,1800000);assert.equal(a.request.body.password,undefined);assert.equal(a.request.body.confirm,undefined);
});
