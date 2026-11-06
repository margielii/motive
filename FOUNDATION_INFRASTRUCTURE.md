# Foundation infrastructure unblocking

Baseline: `bc5357f7d6e4ec7405f67db95c9fb910a27742bf`, existing draft PR #1 / `foundation/poc`. This is a separate, additive change. **PASS for supported implementation and local validation; BLOCKED for hosted readiness, verified staging isolation and a verified C$0 operating claim.** No merge, provision, deployment, publication, runtime configuration change, or Orbit modification was performed.

## Supported infrastructure investigation

Evidence inspected on 2026-11-06:

| Source / capability | Established | Not established |
| --- | --- | --- |
| Sites storage guidance (`sites/references/storage.md`) | `.openai/hosting.json` declares logical D1/R2 binding names. Sites provisions and connects hosted resources. Tracked schema-only Drizzle SQL/journal is applied before Worker upload. Local databases are separate. | Actual hosted database/bucket IDs, allocation success and hosted migration success for this unpublished Site. |
| Native `sites.update_environment_variables` contract and Sites identity/secrets guidance | Runtime values and secret-marked entries are supported. Environment changes require deployment of a saved version to apply the new revision. Secrets belong in native runtime configuration, not source/build files. | This task has not configured any values or tested delivery to a hosted Worker. |
| Available Sites D1 tools | Database overview and bounded table reads are supported after deployment. | No arbitrary D1 write/SQL tool is exposed. The previous manual hosted SQL bootstrap runbook was not an established supported operation. |
| Native deployment tool contract | Every Sites deployment URL is production. There is no staging-environment selector in the exposed Sites tools. | A stage label, branch, preview URL, saved version or local placeholder binding is not proof of an isolated hosted database/bucket. |
| Read-only `get_site` and `get_environment_variables` for the preserved MOTIVE project | Version 0, no live URL, existing custom audience, and `requires_byop: false`; environment revision 0 with no entries. Values/credentials were not copied into source or evidence. | There is no running hosted Worker on which to confirm bindings or limits. Neither result exposes remaining traffic/CPU/storage allowance. |
| [D1 binding and batch API](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch) | Worker access through `env.DB` and transactional batches are supported. | D1 and R2 do not share a transaction. |

No Supabase, external backend, paid dependency, provider credentials or direct Cloudflare provisioning was needed. The supported path is declarative Sites resources, native runtime secrets, and a narrowly authorized application bootstrap using those bindings. The existing Sites project identity, DB/BUCKET names, assets integration and prior migrations remain unchanged.

## Minimal implementation

`server/foundation.ts` adds two server-only routes:

- `POST /api/foundation/bootstrap`: disabled unless a valid native runtime permit exists and the caller knows its independent random 256-bit credential. Requires same-origin Origin, exact target confirmation, the permit-bound verified admin email, a privately chosen 12–128 character password, a different verified first invitee email, and the literal confirmation `INITIALIZE MOTIVE ONCE`. There is no bootstrap UI or default password.
- `GET /api/foundation/diagnostics`: accepts that operator permit before setup, or an active MOTIVE administrator session. Ordinary users, guests, forged platform identity headers and anonymous requests cannot inspect it. It performs only reads and returns boolean binding/readability/schema/claim/match flags plus the expected, non-secret target tuple. It returns no account rows, emails, credential values, token hashes, private objects, bucket names, physical database/bucket IDs, quota guesses or raw binding errors. All responses use the existing no-store/referrer/content-type protections.

Required native runtime keys:

| Key | Value | Handling |
| --- | --- | --- |
| `MOTIVE_INSTANCE` | JSON `{ "siteId": "<exact selected Site ID>", "instanceId": "<new UUID for this installation>", "stage": "local or staging or production" }` | Stable for the lifetime of the installation. Site ID must match the built hosting manifest. Never regenerate on a normal redeployment. May be marked secret if platform policy requires. |
| `MOTIVE_BOOTSTRAP` | JSON `{ "tokenHash": "<SHA-256 of random 32-byte hex credential>", "issuedAt": <UTC epoch ms>, "expiresAt": <UTC epoch ms>, "adminEmail": "<verified lowercase email>" }` | Configure with native `is_secret: true`. Window must have started, remain unexpired, and span at most one hour. The helper uses 30 minutes. Store neither raw credential nor permit in tracked files. Remove after initialization. |

The raw credential is supplied in `X-Motive-Bootstrap`, never a URL, cookie or command-line argument. A Site service-access credential is a separate outer platform gate and does not grant bootstrap authority. The MOTIVE permit remains required regardless of Site audience or caller identity. MOTIVE invitations do not change the Sites audience or grant platform access: recipients must satisfy the existing Site policy. Making the Site public is a separate explicitly approved change.

The schema-only append migration `0002_foundation_bootstrap` adds a permanent singleton ledger. A D1 batch atomically inserts that ledger, exactly one administrator with a freshly salted password hash, and exactly one single-use first invitation (digest only). All dependent writes are bound to this attempt's random nonce. Competing attempts have one winner. Any prior application data blocks initialization; no existing account is promoted or overwritten. The first invitee receives no administrator, group or plan privileges. The administrator signs in through the normal password/session path; bootstrap issues no session.

R2 receives only a fixed, non-sensitive installation marker using a conditional create. A conflicting marker is never overwritten, and an unclaimed bucket containing existing objects is not adopted. A matching bucket reservation with no D1 ledger can be retried for the same target after a failed D1 batch; no partial administrator or invitation survives a failed batch. There is deliberately no marker reset/clear/adopt endpoint. A committed ledger blocks reinitialization even if accounts/invitations are later deleted or a new permit is configured.

Before **any private application route**, the Worker now rechecks both markers against `MOTIVE_INSTANCE`. Missing configuration, missing bindings, uninitialized storage, or a mismatched Site/instance/stage returns a generic 503 before account/plan/file access. Public shell/assets remain available and contain no private records. This also means an existing populated but unclaimed database is deliberately unavailable for private use: there is no automatic adoption/takeover. The currently preserved Site has no deployment; adoption of any unexpectedly populated hosted storage requires a separate reviewed procedure.

## Binding and staging evidence

Diagnostics prove that the Worker can read the services bound as DB/BUCKET and that their persistent claims agree with the expected target. `schemaReady` checks the required table set; it does not certify the platform's migration history or every column definition. `ready` is marker/readiness consistency, **not a physical resource-isolation certificate**. Identical/cloned claims and copied target configuration cannot reveal that two deployments share a physical service. Runtime binding APIs do not expose authoritative resource IDs here. R2 reads use the fixed non-sensitive marker key, not user images; diagnostic reads never create it.

For a hosted staging test, the supported candidate is a **separate, explicitly approved Site** with its own verified D1/R2 resources and unique installation UUID. A version/branch/stage label on this existing Site must not be presented as staging isolation. Keep the existing manifest unchanged until target selection/creation is authorized; build any approved separate Site artifact with its exact own manifest project ID. No staging Site was created in this task.

Before calling a hosted staging setup isolated, retain trusted platform/operator evidence of distinct Site and physical DB/bucket allocations, confirm the matching runtime markers, then exercise synthetic cross-environment account/cookie/object rejection. Check that R2 has no public URL or custom-domain bypass. If allocation identity or boundary evidence is unavailable, stop the hosted bootstrap and leave isolation BLOCKED. Local tests use genuinely separate temporary Miniflare D1/R2 stores and do not establish hosted resource identity.

## Supported deployment/bootstrap order — requires future explicit approval

1. Review the exact source commit, Site ID, intended audience, stage, verified admin and first invitee. Obtain explicit authorization covering the intended resource provisioning, runtime-secret configuration, deployment and initialization. This task authorizes implementation only; none of those operations was executed.
2. Retain the target Site identity and DB/BUCKET declarations. Generate/review schema-only migrations and run the local checks. Never replace placeholder IDs in Vite's **local** config with guessed hosted resource IDs or run a remote Wrangler SQL command against an assumed database. Do not replay applied migrations.
3. In a private terminal, `node scripts/prepare-foundation.mjs staging verified-admin@example.com verified-invitee@example.com` prepares a unique target and a fresh 30-minute permit **offline**. Output contains a credential: do not log, commit, paste into a PR, or capture it in screenshots. The helper writes no files and makes no network calls. It deliberately omits both password and execution confirmation, so its request template cannot initialize anything unchanged.
4. After approval, configure the exact target's `MOTIVE_INSTANCE` and secret-marked `MOTIVE_BOOTSTRAP` using native Sites runtime tools. Build/push/save the exact reviewed source through the supported Sites workflow, then perform the specifically approved deployment. Native provisioning/binding and migration application precede Worker availability. If the window expires during deployment, a new approved runtime revision and deployment are needed; environment edits alone do not update a running revision.
5. Inspect deployment/migration outcomes and independent allocation/isolation evidence. On the exact approved HTTPS origin, use an authorized same-origin operator client to call diagnostics with the short-lived credential. For a new installation expect D1/R2 bound/reachable, `schemaReady: true`, and no D1 claim. A matching R2-only reservation can reflect a retryable earlier failure. Stop for missing schema, unexpected data, conflicting marker or unclear resource identity; do not wipe or relabel anything to pass checks. On a private Site, also satisfy the existing platform gate without changing audience.
6. Only with explicit initialization authorization, send one POST with `X-Motive-Bootstrap`, the exact Origin and JSON target/admin/invitee fields, plus a privately entered password and `confirm: "INITIALIZE MOTIVE ONCE"`. No URLs or command arguments containing credentials. A 201 returns the first invitation once; share only through a trusted private channel. D1 stores its hash only.
7. Sign in as the new admin, confirm `admin: true` and diagnostic `ready: true`, and verify the invitation creates only an ordinary account with no group/plan access. If the response was lost after commit, sign in using the known admin password and issue a new invitation through the existing admin API; do not reset the ledger. Diagnostic errors do not echo private data.
8. Remove `MOTIVE_BOOTSTRAP` through native configuration and apply that revision with a separately authorized deployment. Keep `MOTIVE_INSTANCE` unchanged. Expiry and the durable ledger already limit reuse; removal is additional cleanup. Verify denial of repeated/anonymous bootstrap and persistence across redeployment. Destroy the short-lived raw credential and private helper output. Never drop the ledger or R2 marker as an account-recovery action.

Recovery remains the existing admin-issued code flow. If all administrators are inaccessible, stop and establish a separately reviewed, supported operator recovery mechanism. The exposed Sites database tools are read-only; a direct hosted SQL promotion/reset must not be presumed available.

## Verification and remaining limits

Local results on 2026-11-06. Full command output: [infrastructure verification evidence](verification/infrastructure-2026-11-06.txt).

| Command | Evidence |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, no warnings/errors |
| `npm test` | PASS, 38 tests including nested cases |
| `npm run build` | PASS |
| `npm run test:production` | PASS, 34 tests including nested cases against the emitted Worker and asset router |
| `npm run check:package` | PASS; emitted Sites metadata, bindings, migrations and assets match source |

New tests reject absent/wrong/expired/malformed/overlong/future permits, forged headers, wrong origin/confirmation/target, weak passwords and repeated/concurrent initialization. They verify private diagnostic denial/redaction, missing bindings, migration ordering, preserved baseline data, refusal to adopt populated storage, D1 rollback/R2 reservation recovery, refusal to adopt occupied buckets, non-overwrite of conflicting markers, least-privilege first-invitation redemption, marker mismatch denial even with a valid admin cookie, and separate emulator storage/cookie rejection. Existing password, session, recovery, guest-token, upload, authorization and persistence tests run against the configured installation. Tests use synthetic data only. The D1 emulator rejected the initial compound SELECT approach; final bounded `NOT EXISTS` checks pass its supported limits.

Hosted native archive acceptance, resource provisioning, migration application, runtime secret/header forwarding, platform log redaction, CPU allowance, persistence across deployments and multi-isolate races remain untested. Local compiled-Worker tests are not hosted evidence. No browser or physical iPhone test was performed. Preserve the earlier release gates in FOUNDATION_STATUS.md.

## Evidence required for zero-incremental-cost operation

No new dependency or paid service was added. [Official Sites guidance](https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites) states that Plus/Pro hosting is currently included, subject to shared usage/storage limits (10 GB per Site database); that does not expose this account's remaining allowance. Building/editing also consumes Codex usage. The available Site/runtime read tools do not provide numeric remaining storage, request or CPU quotas. Existing subscription cost is excluded from "incremental" cost.

The new installation guard adds **one D1 marker read and one R2 marker read per protected request**, before existing session/permission queries. Diagnostics add schema/claim reads; bootstrap adds a conditional R2 marker write and a three-statement D1 batch once. This deliberately favors fail-closed isolation checks over cached claims. Budget using measured request rates and actual billed/account usage, not object size alone. Expired rows and image retention also matter.

Before promising C$0: obtain the account's authoritative Sites allowances and remaining shared usage; identify how the planned separate staging Site shares those quotas; measure the real hosted 600,000-iteration password KDF against the applicable CPU budget; measure D1 row reads/writes, R2 operations/storage and traffic under a realistic workload; verify exhaustion/overage policy and any billing activation requirement without enabling a paid service. Retain plan evidence, measurements, observation dates and headroom. If Sites exposes no applicable CPU/quota evidence, the cost verdict remains BLOCKED.

Direct [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) and [R2 pricing](https://developers.cloudflare.com/r2/pricing/) are useful comparisons, not proof of Sites entitlements. In particular, direct Workers Free's 10 ms CPU limit cannot be assumed to accommodate this password KDF, nor assumed to be the Sites limit. Do not reduce password security or introduce a paid alternative to turn missing evidence into a PASS.
