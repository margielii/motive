# Prototype verification — 2026-11-06

Source baseline: `faf7e92cd752cb0854ec68418a32014276aa472c`. Node v24.22.1. Pinned lockfile retained; no dependency added. Dependency install completed with optional foreign-platform packages skipped normally.

| Check | Result | Evidence |
| --- | --- | --- |
| Typecheck | PASS | prototype-typecheck.txt |
| ESLint | PASS, no warnings/errors | prototype-lint.txt |
| Full foundation + prototype model/PWA suite | PASS: 47 passed, 1 intentional skip | prototype-tests.txt |
| Vinext/Cloudflare build | PASS; existing generic route-classification notice | prototype-build.txt |
| Actual emitted prototype Worker | PASS: 1 integration test | prototype-production.txt |
| Sites output metadata, bindings, migrations, PWA files | PASS locally | prototype-package.txt |
| Browser functional/visual checks and screenshots | BLOCKED: supported browser tool absent | PROTOTYPE.md |
| Native Sites source-helper archive/upload acceptance | BLOCKED: helper absent; no hosted save authorized/performed | PROTOTYPE.md |
| Physical iPhone Safari/PWA acceptance | PENDING approved deployment and device | IPHONE_ACCEPTANCE.md |

The intentional default-suite skip is the production test requiring a build; it passed separately with MOTIVE_BUILT_WORKER=1. Full suite tests preserved foundation APIs in an isolated boundary emulator; the prototype production wrapper denies those APIs. Production integration serves entry, manifest, all three PWA PNGs, service worker and emitted page script and checks all legacy auth/guest/bootstrap/data/unknown endpoints and root mutations return 404 with no session cookie and no-store. The production integration does not initialize or require D1/R2 or hosted secrets.

Synthetic tests cover explicit session start/end, per-instance isolation, create/edit, group validation, attendance, poll replacement (no double counting), profile/reset, immutable snapshots and online-only PWA policy. These are model/HTTP tests, not browser click tests. Calendar/layout/form keyboard behavior remains manual acceptance.

Read-only Site policy inspection found owner role, custom policy with one owner, no groups and zero external visitors. No access, configuration, secret or hosting changes were made. No raw Worker logs were retrieved. The original foundation 503 and logging issues remain unresolved and are not tested by this prototype.

React review applied: state lives per component instance, no module-shared mutable state, effects limited to service worker/dialog integration, native labels/dialog, focus styles, nav current-state semantics, poll/attendance pressed state, no real credential UI or heavy new dependencies. Final browser accessibility/contrast checks remain pending.

No preview was started because managed Sites instructions forbid improvising another browser-control path when cua_repl.js is absent. No screenshots or deployment success are claimed. Repository `git diff --check` passed. No Orbit modification, foundation merge, PR #1 update, hosted version save, audience change, public registration, real credential use, deployment or publication.
