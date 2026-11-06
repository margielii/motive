import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
const read = async p => JSON.parse(await readFile(p,'utf8'));
const source=await read('.openai/hosting.json');
assert.deepEqual(await read('dist/.openai/hosting.json'),source);
assert.equal(source.d1,'DB');assert.equal(source.r2,'BUCKET');
const config=await read('dist/server/wrangler.json');
assert.equal(config.d1_databases[0].binding,source.d1);assert.equal(config.r2_buckets[0].binding,source.r2);
assert.equal(config.assets.binding,'ASSETS');assert.equal(config.assets.run_worker_first,true);
await access('dist/server/'+config.main);
for(const entry of (await read('drizzle/meta/_journal.json')).entries) {
 assert.deepEqual(await readFile(`drizzle/${entry.tag}.sql`),await readFile(`dist/.openai/drizzle/${entry.tag}.sql`));
}
assert.deepEqual(await read('drizzle/meta/_journal.json'),await read('dist/.openai/drizzle/meta/_journal.json'));
const manifest=await read('dist/client/manifest.webmanifest');
assert.equal(manifest.display,'standalone');
for(const icon of manifest.icons) await access('dist/client'+icon.src);
await access('dist/client/icons/motive-apple.png');await access('dist/client/sw.js');
console.log('PASS: Sites manifest, bindings, worker-first assets, migration journal/SQL and PWA assets match build output. Hosted archive acceptance is unverified.');
