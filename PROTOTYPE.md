# MOTIVE usable Sites prototype

Development branch: `prototype/usable-sites`, created directly from verified foundation `faf7e92cd752cb0854ec68418a32014276aa472c`. PR #1 and `foundation/poc` remain unchanged and unmerged. This is a stacked draft targeting `foundation/poc` so reviewers see only prototype changes, with no implication that the foundation is ready to merge.

## Experience and data contract

Home, Plans, Groups and Calendar use bottom navigation. Home has a cinematic CSS cityscape Next Up card, two compact action tiles, upcoming plans, activity beside the top-right profile avatar. Graphite surfaces and red accents are mobile-first, with safe-area padding, 44px controls, 16px form fields, a native modal dialog, visible keyboard focus and reduced-motion support.

Start an explicitly synthetic session as fictional Alex. There is no account-free access to real records: no real records are in the app, and the outer Sites gate remains owner-only. Create/edit sample private-group plans, change attendance, replace a poll vote, view group members/plans, change calendar month/date, customize a fictional profile, reset data and end the session. All mutations are in memory; reload/new tab/end session discard changes. No participant is invited or notified. There is no guest redemption, public registration, password form, upload, outbound app request or multi-user persistence.

The production Worker uses `server/prototype-boundary.ts`, which rejects ALL server operations, including legacy account/guest/bootstrap/data APIs and framework POSTs. The reviewed foundation implementation and tests remain preserved as source but are not the active deployed authority. PWA assets and framework scripts remain allowlisted. The UI's synthetic identity is a usability device, not an authentication/security boundary. Do not host this artifact publicly; owner-only access is enforced by Sites outside this application.

## Replaceable adapters

- `lib/prototype/model.ts`: typed `PlanRepository`, `IdentityAdapter`, records and snapshots.
- `lib/prototype/adapters.ts`: per-component-instance, in-memory implementations. No fetch, storage, token or platform SDK dependencies.
- Interface consumes snapshots and repository mutations. A production repository can implement authorized HTTP access backed by D1 while retaining these screens. Convert calls to awaited operations and add loading/error/conflict handling when that implementation becomes asynchronous.
- Firebase Authentication is the preferred future provider, **not integrated or validated here**. Replace `IdentityAdapter` with a real identity contract only after validating Firebase browser SDK/Workers token verification, revoked/expired tokens, account mapping, authorized origins, private membership enforcement and platform logging protection. Never send real Firebase tokens through Sites until that protection is independently established.
- Production decision: open account registration, authenticated users only, private groups and explicit plan permissions. This supersedes foundation invitation/guest product behavior; the retained foundation code is historical infrastructure, not a production product specification. Do not activate it unchanged as the long-term identity implementation.

## Portability and packaging

The existing Vinext/Vite/Cloudflare pipeline, `sites()` integration, Site project ID, D1/R2 bindings and migration artifacts are preserved. No dependency was added and no paid service was provisioned. UI/model code imports no Sites SDK. The original Worker connector wrapper is retained for compatibility, but unused by the interface. Native Workers can use the emitted ESM/ASSETS pipeline with account-specific configuration; external owner authentication is required before hosting. Do not copy generated platform resource IDs or bypass credentials into a native config. D1-backed application access and Firebase remain future work.

Run `npm run install:ci` on a clean checkout, then `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:production`, `npm run check:package`.

`npm test` preserves the full foundation emulator suite and adds synthetic lifecycle/state/PWA checks. `test:production` now tests the actual emitted **prototype** Worker (without DB/R2 credentials or migrations) for shell/assets and universal API denial. It intentionally does not claim the dormant foundation APIs run in the prototype artifact. `check:package` compares native Sites metadata, Worker/asset bindings, migrations and PWA output locally.

## Verification limits and deployment approval

This managed environment has neither installed Sites `site-workflow.mjs`/`build-site.mjs` helpers nor supported `cua_repl.js` browser tool. Per the Sites skill, no preview server, alternate browser installation or improvised browser-control path was used. Therefore screenshots, browser interaction/layout checks and native archive upload/acceptance have **not** passed. No screenshots are fabricated. Local emitted-Worker tests are not browser or physical iPhone tests. Native packaging acceptance normally requires a save/upload action; no version was saved because publication/deployment awaits separate approval.

Before deployment: review this draft, capture mobile screenshots in a supported browser, finish native source-helper packaging and verify the unchanged owner-only Site audience. Request approval for the exact commit/archive and Site `appgprj_6aed48a714408191879b5c36ca346b9d`. Do not enable publish-on-push. Do not merge, change hosted secrets, initialize/reset storage, retrieve raw logs, enable registration, publish publicly or modify Orbit. The existing staging publication is unchanged. Existing foundation logging/503 blockers remain unresolved.

See [iPhone acceptance](IPHONE_ACCEPTANCE.md) and the captured `verification/prototype-*.txt` outputs.
