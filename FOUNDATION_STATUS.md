> **Current incident status:** Hosted bootstrap at deployed baseline `4a2b9cb` reportedly returned 503 and exposed its credential header in platform logs. The cause is unverified without sanitized failure metadata. The old bootstrap is retired; see [BOOTSTRAP_REPAIR.md](BOOTSTRAP_REPAIR.md). Hosted account/guest/image tests remain blocked by initialization and platform logging/outer-gate verification. Historical local passes below are not hosted proof.

# MOTIVE Foundation PR #1

Verdict: **BLOCKED for release/publication**. **PASS for local foundation checks** on 2026-11-06. Hosted security, real iPhone installation and actual account quota/CPU evidence remain outstanding. Keep PR #1 draft. No merge, deployment, publication, paid provisioning, Site audience change or Orbit modification was performed.

## Infrastructure follow-up

The additive follow-up to `bc5357f7d6e4ec7405f67db95c9fb910a27742bf` implements a supported native-runtime-secret/bootstrap route, permanent initialization ledger, D1/R2 claims and fail-closed installation checks. It supersedes the original manual-SQL bootstrap assumption below. Current evidence, deployment ordering and cost/isolation limitations are in [FOUNDATION_INFRASTRUCTURE.md](FOUNDATION_INFRASTRUCTURE.md). No hosted resource or environment configuration was changed. The 16/13 test counts below describe the original baseline; see the infrastructure report for the expanded suite.

## Baseline and scope

Inspected existing draft https://github.com/margielii/motive/pull/1 before editing. Its branch `foundation/poc` was at `1573581519f83bf23fc537b9bea1bfd12c91572d`, matching the verified imported baseline. Continued the existing checkout and preserved the imported components, framework, connectors, probe migration and guest primitives. Replaced the starter placeholder page with the MOTIVE shell; added application code and an append-only migration. No competing PR or repository was created.

## Implemented boundary

- Invitation-only email/password accounts, per-password random 256-bit salts and PBKDF2-HMAC-SHA256 (600,000 iterations). Passwords accept 12–128 characters. No ChatGPT identity header grants MOTIVE access.
- Random 256-bit account session cookies, only SHA-256 digests in D1, fixed seven-day expiry. Every protected request revalidates the persistent session and active account. Cookies are host-only, HttpOnly, Secure, SameSite=Strict. Logout removes durable account and guest sessions. Recovery and account disabling invalidate account sessions. Session issuance checks the verified password again in SQL to prevent issuance against an intervening password change.
- Single-use, email-bound, 24-hour invitations; one-hour single-use recovery codes. Admin-only issuance; no mail provider or paid identity service. Registration consumes the invitation in the same D1 batch as account insertion. Recovery changes the password and invalidates sessions/codes in a batch. Login does equal KDF work for unknown identities. D1 enforces 30 unauthenticated auth attempts per IP and 10 per email per 15 minutes; expired rate rows are removed in bounded batches.
- Worker boundary allows only the public shell and explicit public asset paths through to the framework. Unknown pages, APIs, alternate methods and framework action endpoints fail closed. Same-origin Origin is required for every mutation. Private responses carry `private, no-store`, `Vary: Cookie, Authorization`, `no-referrer` and `nosniff`. SQL uses prepared parameters. There are no private server-rendered records, browser token storage, signed public R2 URLs or private assets in the public build directory.
- Group membership and plan membership are distinct. Group owners can create plans and add/remove group members; group membership alone grants no plan reads. Plan owners assign viewer/editor membership and issue/revoke guests. Editors upload; viewers read. Group removal also removes that member's plan permissions for that group. Owner transfer is intentionally absent.
- Guest codes authorize **read-only access to one plan and its images**, expire after 24 hours, and are redeemed once into an HttpOnly guest session. Concurrent redemption creates exactly one session. Every guest read joins the durable grant to recheck scope, expiry and revocation. Raw invitation/recovery/guest tokens are entered as codes and sent in request bodies, never URL query strings. Admin code responses are no-store; share privately, never in repository issues or logs.
- PNG/JPEG uploads enforce a streaming actual-byte 2 MiB limit and matching signatures/MIME. Upload requires explicit plan editor/owner permission. Random server-generated R2 keys and D1 ownership metadata; failed metadata writes attempt object cleanup. Retrieval rechecks plan/guest authorization and returns an attachment. Deletion requires the creator with current write permission or the plan owner. R2 remains reachable only through the server binding in application code.
- Installable online-only PWA foundation: manifest, 192/512 PNG icons, 180px Apple icon, standalone display, responsive shell, safe-area support and an online-only service worker. No push notifications or offline editing/cache of private responses.

`server/boundary.ts` is the production authority. `lib/guest-grants.mjs` remains a preserved standalone predicate; it is not itself the authorization layer. `examples/` is preserved reference source, excluded from app routing/typechecking, and is not an exposed notes API. `db/index.ts` remains a server-only helper with no application route using an unscoped query.

## Local verification evidence

Executed with Node 24.22.1 and the existing pinned dependency lockfile; no dependency additions.

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS, no TypeScript errors |
| `npm run lint` | PASS, no warnings/errors |
| `npm test` | PASS, 16 tests including nested emulator cases |
| `npm run build` | PASS, production Vinext/Cloudflare Worker, client and SSR output |
| `npm run test:production` | PASS, 13 tests including nested cases against the actual emitted Worker and static asset router |
| `npm run check:package` | PASS, Sites metadata, DB/BUCKET bindings, ASSETS binding, worker-first routing, migration journal/SQL and PWA assets |

Security cases cover password salt uniqueness and verification; no-invite/wrong-email/expired invitation rejection and replay; weak passwords; persistent sessions, expiry, logout, recovery replay and restrictions; header spoofing, CSRF, unknown routes/methods; group versus plan authorization; viewer write denial; guest concurrent replay, cross-plan scope, expiry and revocation; SVG/signature rejection, oversized actual bytes, image ownership, unauthorized reads and byte-for-byte R2 retrieval/deletion. D1 account sessions and R2 bytes survive disposal/recreation of the emulator using filesystem persistence. All records/images are synthetic, isolated from hosted databases.

The production test includes the real compiled wrapper, not just the isolated boundary. It verifies anonymous manifest/icon/client-script delivery as well as protected endpoints with Worker-first asset routing. The build's generic route-classification notice is a Vinext limitation; authorization runs in the outer Worker before framework routing. No browser preview was launched; browser interaction/accessibility and physical-device behavior remain manual checks.

## Sites compatibility and remaining release gates

The original Site project ID and `sites()` integration are preserved. Read-only Site inspection on 2026-11-06 found version 0 and no live/preview deployment URL. Local builds retain `.openai/hosting.json`, DB/BUCKET bindings, `dist/server/wrangler.json`, client assets, and matching Drizzle SQL/journal in `dist/.openai/drizzle`. The asset binding is explicit, and Worker-first routing preserves authorization ahead of asset resolution. Packaging structure and local execution PASS; the native upload/archive acceptance and hosted migration application have **not** been tested. No Site version was saved or deployed.

A separately approved hosted **test** deployment, using synthetic data only, is needed to verify:

1. Native Sites artifact acceptance, migration application and true DB/R2 bindings; session/file persistence across two deployments.
2. HTTPS cookie handling and Origin behavior through the actual proxy; no shared-cache private responses; no direct public R2 endpoint/custom domain or storage route bypass; negative tests from a fresh anonymous browser against every protected route, including alternate methods and framework paths.
3. Guest expiry/revocation after redemption and concurrent redemption across isolates; account disable/recovery across devices; platform log redaction for request bodies and codes. The app does not log secrets, but platform behavior is unverified.
4. Authentication CPU time at 600,000 PBKDF2 iterations under the actual Sites Worker allowance, storage/traffic quotas and exhaustion behavior. Emulator wall time does not measure hosted billable CPU.
5. Full browser form/upload flows, iPhone Safari install via Share → Add to Home Screen, correct icon/safe areas/standalone launch, session persistence after relaunch, logout/recovery, and camera-library JPEG behavior. HEIC is deliberately rejected; convert to JPEG/PNG. A physical iPhone is required for final acceptance.

Limits: no malware scanning, full image decoding/re-encoding, EXIF removal or thumbnail generation; files remain authorized downloads. Cross-service D1/R2 writes are not an atomic transaction: cleanup failure or deletion failure can leave an inaccessible orphan, requiring operator reconciliation. No MFA, audit dashboard, owner transfer or self-service email recovery. Operational retention/backup procedures and production load testing are not established. These are foundation limitations, not claims of hosted production readiness.

## Invitation and recovery operations

See [FOUNDATION_OPERATIONS.md](FOUNDATION_OPERATIONS.md). There are no seeded accounts or default passwords. The supported bootstrap HTTP route requires a short-lived native runtime permit, exact target confirmation and a fresh database, and is permanently disabled by its committed ledger after successful initialization. See the infrastructure follow-up for ordering and safeguards. Do not execute hosted bootstrap or change any hosted resources without separate user approval.

## C$0 incremental monthly assessment

**Conditionally feasible for a small group using the already-paid ChatGPT subscription and platform URL; not verified for this account or workload.** No email, identity, push, domain purchase or external paid service is required by the implementation. Existing subscription cost is excluded from "incremental" cost.

Official documentation inspected on 2026-11-06:

| Evidence | Published allowance / implication |
| --- | --- |
| [OpenAI Sites guide](https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites), usage/storage and FAQ | Hosting currently included with Plus/Pro; shared usage/storage limits apply, 10 GB per Site database. No numeric remaining account traffic/file allowance was exposed by the available Site inspection. |
| [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/) | Direct Workers Free: 100,000 requests/day, 10 ms CPU/invocation. This is **not evidence** that Sites uses that plan or that this KDF fits it. |
| [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) | Direct Free: 5 million rows read/day, 100,000 rows written/day, 5 GB account storage. These are Cloudflare allowances, not verified Sites entitlements. |
| [R2 pricing](https://developers.cloudflare.com/r2/pricing/) | Standard free tier: 10 GB-month storage, 1 million Class A and 10 million Class B operations/month, free egress. Not proof of the account's remaining Sites storage allowance. |

Illustrative storage demand: 1,000 maximum-sized images occupy about 2.10 GB before metadata; this is a workload estimate, not a verified bill. Rate-limit/session writes and permission lookups consume D1 usage, and stored images accumulate until deleted. Remaining shared allowances, service restrictions, KDF CPU and sustained traffic must be measured before promising C$0. Do not weaken password hashing simply to fit an unverified free-tier CPU assumption. No paid fallback has been provisioned.
