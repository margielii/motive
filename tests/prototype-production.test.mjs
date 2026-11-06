import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
const require = createRequire(import.meta.resolve("wrangler"));
const { Miniflare } = require("miniflare");
test(
  "emitted prototype Worker serves shell/PWA and rejects every server operation",
  { skip: !process.env.MOTIVE_BUILT_WORKER, timeout: 150_000 },
  async (t) => {
    const files = [
      "index.js",
      ...(await readdir("dist/server", { recursive: true })).filter(
        (p) => p.endsWith(".js") && p !== "index.js",
      ),
    ];
    console.log("Production integration: constructing Miniflare");
    const mf = new Miniflare({
      modules: files.map((p) => ({
        type: "ESModule",
        path: resolve("dist/server", p),
      })),
      modulesRoot: resolve("dist/server"),
      compatibilityFlags: ["nodejs_compat"],
      compatibilityDate: "2026-05-15",
      assets: {
        directory: resolve("dist/client"),
        binding: "ASSETS",
        routerConfig: {
          has_user_worker: true,
          invoke_user_worker_ahead_of_assets: true,
        },
      },
    });
    t.after(() => mf.dispose());
    console.log("Production integration: requesting shell");
    const home = await mf.dispatchFetch("https://motive.test/");
    assert.equal(home.status, 200);
    assert.match(await home.text(), /Explore as Alex/);
    for (const path of [
      "/manifest.webmanifest",
      "/sw.js",
      "/fonts/inter.ttf",
      "/fonts/OFL.txt",
      "/icons/motive-192.png",
      "/icons/motive-512.png",
      "/icons/motive-apple.png",
      ...[
        "wordmark",
        "icon",
        "seats",
        "hoops",
        "controller",
        "night",
        "dinner",
      ].map((name) => `/brand/${name}-reference.png`),
    ]) {
      const response = await mf.dispatchFetch("https://motive.test" + path);
      assert.equal(response.status, 200, path);
      assert.deepEqual(
        Buffer.from(await response.arrayBuffer()),
        await readFile("dist/client" + path),
        path + " must deliver the packaged asset bytes",
      );
    }
    const chunks = await readdir("dist/client/_next/static/chunks");
    const script = chunks.find((p) => p.startsWith("page-"));
    assert.ok(script);
    const scriptResponse = await mf.dispatchFetch(
      "https://motive.test/_next/static/chunks/" + script,
    );
    assert.equal(scriptResponse.status, 200);
    assert.deepEqual(
      Buffer.from(await scriptResponse.arrayBuffer()),
      await readFile("dist/client/_next/static/chunks/" + script),
    );
    for (const path of [
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/me",
      "/api/guest/redeem",
      "/api/foundation/bootstrap",
      "/api/plans",
      "/api/groups",
      "/api/images/sample",
      "/private",
      "/brand/provenance.json",
      "/brand/unapproved.png",
      "/",
    ])
      for (const method of path === "/"
        ? ["POST", "PUT"]
        : ["GET", "POST", "PUT", "DELETE"]) {
        const r = await mf.dispatchFetch("https://motive.test" + path, {
          method,
        });
        assert.equal(r.status, 404, method + " " + path);
        assert.equal(r.headers.get("set-cookie"), null);
        assert.equal(r.headers.get("cache-control"), "private, no-store");
        assert.equal(
          (await r.json()).error,
          "Synthetic prototype: server operations disabled",
        );
      }
    const manifest = JSON.parse(
      await readFile("dist/client/manifest.webmanifest", "utf8"),
    );
    assert.equal(manifest.theme_color, "#141516");
  },
);
