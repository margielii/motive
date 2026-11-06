import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const require = createRequire(import.meta.resolve("wrangler"));
const { build } = require("esbuild");
const bundle = await build({
  entryPoints: ["lib/prototype/adapters.ts"],
  bundle: true,
  format: "esm",
  write: false,
});
const { createMockRepository, createSyntheticIdentity } = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundle.outputFiles[0].text).toString("base64")
);
test("synthetic session is explicit, isolated and can end without credentials", () => {
  const a = createSyntheticIdentity(),
    b = createSyntheticIdentity();
  assert.equal(a.current(), null);
  a.startSyntheticSession();
  assert.equal(a.current().synthetic, true);
  assert.equal(b.current(), null);
  a.signOut();
  assert.equal(a.current(), null);
});
test("create and edit preserve private group, poll and attendance state, with no shared persistence", () => {
  const a = createMockRepository(),
    b = createMockRepository();
  const seed = a.snapshot();
  const p = { ...seed.plans[0], id: "new", title: "Synthetic brunch" };
  assert.equal(a.savePlan(p).plans.length, 4);
  assert.equal(b.snapshot().plans.length, 3);
  a.attend("new", "Maybe");
  a.vote("new", 0);
  let v = a.vote("new", 1).plans.find((p) => p.id === "new");
  assert.deepEqual(v.votes, [p.votes[0], p.votes[1] + 1]);
  assert.equal(v.attendance, "Maybe");
  const edited = { ...v, title: "Synthetic lunch", date: "2027-01-12" };
  v = a.savePlan(edited).plans.find((p) => p.id === "new");
  assert.equal(v.title, "Synthetic lunch");
  assert.equal(v.vote, 1);
  assert.equal(v.date, "2027-01-12");
  assert.throws(() => a.savePlan({ ...edited, groupId: "public" }));
  assert.throws(() => a.vote("new", 2));
  a.profile({ name: "Demo", bio: "Fiction", avatar: "M" });
  assert.equal(a.snapshot().profile.name, "Demo");
  assert.equal(b.snapshot().profile.name, "Alex");
  assert.equal(a.reset().plans.length, 3);
  assert.equal(a.snapshot().profile.name, "Alex");
});
test("snapshots cannot mutate adapter records", () => {
  const r = createMockRepository();
  const s = r.snapshot();
  s.plans[0].title = "changed";
  s.groups[0].members.push("extra");
  assert.notEqual(r.snapshot().plans[0].title, "changed");
  assert.equal(r.snapshot().groups[0].members.length, 5);
});
test("PWA stays online-only, uses graphite theme and includes Apple icon", async () => {
  const m = JSON.parse(await readFile("public/manifest.webmanifest", "utf8"));
  assert.equal(m.display, "standalone");
  assert.equal(m.theme_color, "#111113");
  assert.equal(m.start_url, "/");
  assert.equal(m.icons.length, 2);
  const sw = await readFile("public/sw.js", "utf8");
  assert.doesNotMatch(sw, /caches\.|addEventListener\(['"]fetch/);
  assert.match(await readFile("app/layout.tsx", "utf8"), /motive-apple.png/);
  const adapter = await readFile("lib/prototype/adapters.ts", "utf8");
  assert.doesNotMatch(adapter, /\bfetch\s*\(|localStorage\.|document.cookie/);
});
