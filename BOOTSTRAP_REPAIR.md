# Hosted bootstrap failure and credential transport repair

Deployed source baseline: `4a2b9cbc05a889a6748cb66916014d186ebbfa05`. Existing draft PR #1 / `foundation/poc`. **PASS for the local replacement protocol only; BLOCKED for the hosted 503 root cause, safe outer-platform access and hosted credential-bearing application tests.** No hosted logs/secrets, exposed credential or credential-bearing evidence were retrieved, copied, displayed, or reused. No hosted configuration/deployment/provisioning/publication or Orbit change was performed.

## What is established, and what is not

The user reports that Sites staging revision 2 passed native archive acceptance, migrations, D1/R2 reachability and PWA asset checks, then returned HTTP 503 on one-time bootstrap without account/invitation/installation-ledger rows. The user also reports that platform logs retained the credential header, that the permit was removed, and that redeploying the same source now returns 403. These are supplied sanitized observations, not independently repeated hosted tests. The exposed credential is compromised permanently; removal/expiry is not a reason to reuse it.

The repository contains local verification evidence, including the separately committed [independent verification report](verification/resume-development-2026-11-06.md) at `ecbe12c2b85a69b4db80121aa1226a35556a5481`. That report predates the incident and contains no hosted exception/error code or failing phase. It has been preserved unchanged; the deployed baseline remains an ancestor. No sanitized hosted exception/error code or failing phase was supplied. A sanitized exception/code/phase was requested without any header, cookie or body values. Raw Worker-log tools have no field-projection/redaction guarantee and were deliberately not called. Neither Sites runtime values nor Site discovery responses that might return service credentials were fetched.

**The hosted 503 root cause is not established.** At the deployed baseline:

| Source path | Possible 503 explanation | Evidence status |
| --- | --- | --- |
| Bootstrap readiness check | DB unreadable, required table set not detected, R2 marker read/parse failure | Possible even after general reachability checks; exact failing check not supplied. |
| `passwordHash` before storage writes | Hosted PBKDF2 iteration/runtime/CPU constraint | Hypothesis only. Local workerd accepts 600,000 iterations; this does not establish hosted support or budget. |
| Empty-store checks / R2 list, reserve or verification | A query, conditional write or object operation throws | Hypothesis only; reachability does not establish successful conditional writes. |
| D1 batch | Baseline catches a rejected batch and normally returns 409, not 503 | A batch rejection alone does not explain the reported status in that source. |
| Platform/proxy before or during Worker execution | A platform-generated 503 or resource-limit failure | Not excluded by an HTTP status and empty tables. |

Malformed permits/targets normally produce 403 and malformed initialization input normally 400; existing initialization/conflicting markers normally produce 409. This mapping cannot prove which code executed on the hosted request. Empty D1 tables also do not prove the R2 marker is absent: an R2 reservation can precede a rolled-back/failed D1 transaction. Do not reset either store based on the 503 alone.

The replacement removes the bootstrap runtime password KDF and adds fixed, non-sensitive failure-phase responses. These changes reduce uncertainty and eliminate one possible failure path; **they do not prove the old failure was caused by PBKDF2 or that hosted bootstrap is fixed.** Normal MOTIVE login still performs the original 600,000-iteration KDF and needs its own hosted runtime/CPU validation.

## Credential audit

| Surface | Finding / handling |
| --- | --- |
| Retired bootstrap header | Confirmed disclosed per user report. Old bearer authorization and legacy permit parsing are removed. Do not retrieve even an errors-only raw-log export containing it. Never reactivate the old permit. |
| Old bootstrap request password / response invitation | Old code transmitted a password in the request and could return an invitation code. Body/response capture policy is unverified. Treat any real password submitted to that attempt as potentially exposed and generate entirely fresh credentials; do not infer their confidentiality from header-only evidence. |
| Old offline helper stdout | Could print credential-bearing output. Replaced with exclusive mode-0600 file output outside the checkout; stdout contains only a fixed success statement. No private signing key is exported or persisted. |
| Native configuration | Supported native Sites secret-marked runtime values hold only the approved plan, salted password verifier, invitation digest, public verification key and recipient metadata. No plaintext password, raw invitation or signing private key is configured. This uses the supported secret-control-plane channel, not a Worker HTTP request. Control-plane secret handling must remain trusted; no new values were configured here. |
| New bootstrap Worker traffic | Only protocol version, operation ID and a signature go in the body; only non-secret content type and Origin are needed. Response is initialization status or fixed error/phase codes. No password, verifier, invitation code, private signing key, bearer header or session cookie is required by this application protocol. |
| Legacy local invitation SQL helper | `prepare-invitation.mjs` remains historical local/operator source and can print an invitation code if executed. It is not a supported hosted bootstrap path and must not be used as a fallback in logged automation. It was not executed or changed by this repair. |
| Normal app traffic | Login/register/recovery submit credentials in bodies; account/guest sessions use Cookie/Set-Cookie; invitation/recovery issuance returns bearer codes. Their protection in platform request/response logging is **not established**. Application `HttpOnly`, no-store and lack of console logging do not redact platform logs. Hosted account/guest/image tests remain blocked until supported platform protections for these surfaces are verified. |

No application filter or logger is presented as a platform-redaction control. There is no exposed Sites logging-configuration API in the available tools. Existing retained compromised data requires the platform's supported access/retention/remediation process; this code does not purge it and no such external action was taken.

## Replacement: offline-signed immutable initialization intent

`MOTIVE_INSTANCE` and the existing installation identity remain unchanged. New native secret key `MOTIVE_BOOTSTRAP_V2` contains a short-lived, exact initialization intent: target Site/instance/stage, unique operation ID, timestamps, verified admin and initial-invitee emails, a precomputed strong salted password hash, invitation digest/expiry, and a P-256 public verification key.

An offline helper generates fresh random 256-bit password and invitation code, computes the same PBKDF2-SHA256/600,000 verifier, creates a temporary ECDSA P-256 signing key, and signs the domain-separated deterministic intent. The signing private key is never sent to the Worker, exported, or written to the private bundle. Only its public key is configured. The helper requires the already-reviewed instance JSON as input; it does not generate a replacement installation identity.

The POST contains exactly `{ "version": "2", "operationId": "...", "signature": "..." }`. The server requires exact same-origin Origin, a currently valid native-approved intent (at most one hour), matching target and operation ID, and a valid signature over **all** initialization fields. Unknown request fields and the retired credential header are rejected. Changing the target, password verifier, invitee, invitation digest, expiry or verification key invalidates the authorization. The signature is public proof for that one immutable operation, not a reusable secret or a general bearer capability.

A captured signed request can cause only the exact already-approved operation to run during its approval window. It may race the original request or retry the same operation before commit; it cannot choose a different administrator/password/recipient or create a second initialization. If trigger timing itself must remain private or require additional live operator presence, this protocol does not provide that property and a separately established trusted platform gate is required. Never present signatures as confidential log fields.

The original permanent singleton ledger, unique per-attempt nonce and atomic D1 batch remain. Ledger, account and initial invitation commit together; concurrent attempts produce one winner. A committed ledger permanently denies replay, new intents and reinitialization even after account deletion. Conditional R2 reservation and fail-closed Site/instance/stage checks remain; conflicting or occupied unclaimed storage is not adopted. A failed D1 batch leaves no partial rows and may leave a matching R2 reservation suitable for exact-target retry. D1/R2 still have no cross-service transaction.

The Worker returns no invitation or session after bootstrap. The raw invitation and generated password stay exclusively in the offline private bundle until shared through independently trusted private channels. Pre-initialization HTTP diagnostics no longer accept any credential. Post-initialization diagnostics still require an active admin session and therefore must not be exercised on hosted infrastructure until its cookie logging safety is established.

Authorized failures now return only `BOOTSTRAP_UNAVAILABLE` and a fixed phase (`d1_read`, `schema`, `r2_read`, `d1_empty_check`, `r2_reserve`, `r2_verify`, `d1_commit`, or fallback `readiness`). No exception text, SQL values, request dumps, credentials or private data are logged or serialized. A committed concurrent winner/ambiguous commit acknowledgment is treated as conflict, never permission to reset storage.

## Local verification

Executed successfully on 2026-11-06:

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, no warnings/errors |
| `npm test` | PASS, 43 tests including nested cases |
| `npm run build` | PASS |
| `npm run test:production` | PASS, 39 tests including nested cases |
| `npm run check:package` | PASS, local emitted Sites structure; no native upload |

 The source/emulator and emitted-Worker suites cover signed bootstrap success; absent/invalid/expired/modified native approval; tampering; forged/legacy/unsigned requests; concurrent/repeated initialization; rollback/retry; non-disclosure under simulated full HTTP capture; missing bindings/schema with safe phase codes; migration compatibility; admin/guest authorization and existing storage/security regressions. All credentials in tests are newly generated or explicitly synthetic, never sourced from hosted state.

Migrations `0000`–`0002` and their snapshots are unchanged. No new migration is required: the existing ledger schema already supports the replacement. Tests apply the full tracked migration sequence to fresh emulators and test upgrade from the pre-ledger schema while preserving synthetic data. Sites metadata/journal/bindings/assets checks are local; the previously accepted native archive for the deployed baseline does not establish native acceptance of this new artifact. Full output: [bootstrap repair verification](verification/bootstrap-repair-2026-11-06.txt).

## Prepared hosted procedure — STOP gates before any action

No step below has been executed. Each hosted configuration change, native save/deployment and initialization requires explicit approval for the exact target and action. Do not silently reactivate any permit, change audience, provision storage, fetch exposed logs, or use Orbit resources.

1. Obtain only sanitized failure metadata (status, exception code, failing phase, outcome and non-secret timestamp/request correlation), exported through a trusted channel with **all** credential/header/cookie/body values omitted. If the platform cannot provide a safe export, leave the original root cause unverified; do not retrieve the raw event and redact it afterward.
2. Establish a supported safe outer-platform request path **before** deployment/bootstrap execution. The prepared request must use `credentials: 'omit'`, no Cookie/Authorization/service-bypass header, no token in URL, and manual/no automatic redirect following. If the private Site redirects/rejects that request, stop. Do not add platform cookies or service credentials to get around the gate, and do not make the Site public as a workaround. A documented/verified platform guarantee for protected outer authentication is required before any alternative sender is considered. This is currently an external blocker.
3. Verify supported platform logging controls/contract independently. Use only non-secret canaries if an explicitly approved test is needed. Determine capture/redaction/retention behavior for request and response headers, cookies, bodies, platform exception events and the native secret-control-plane channel. Do not test redaction with real credentials, disable logs without authorization, or claim that app-level filtering controls infrastructure capture.
4. Retain the exact existing staging instance and resource claims; use the supported project-bound storage contract and sanitized marker/negative-test evidence to assess isolation, without requiring inaccessible internal allocation IDs. Determine whether an R2-only reservation remains. Never wipe or relabel it, and do not assume empty D1 means both stores are unused. Stop for conflicting/uncertain resources or unclear migration history.
5. After specific authorization and on a trusted offline machine, prepare a fresh bundle with `node scripts/prepare-foundation.mjs <verified-instance-json-path> <verified-admin-email> <verified-invitee-email> <private-output-path-outside-checkout>`. The destination parent must exist, and output is created exclusively with mode 0600. Keep it out of screenshots, logs, artifacts, repositories and tool output. Upload **neither** the whole bundle nor its `privateCredentials` section. Only the `request` subsection is safe for Worker HTTP capture.
6. After configuration approval, configure only the bundle's `runtimeValue` using the native Sites tool with `is_secret: true`; preserve `MOTIVE_INSTANCE` and keep the old permit absent. Native control-plane secret handling must be trusted first. After separate redeployment approval, save/deploy the exact reviewed new commit through supported Sites packaging. Apply the existing migration journal before Worker availability; do not replay applied SQL or add data-bearing migrations. No paid service is needed.
7. With both deployment and initialization approval, send only the signed request subsection on the exact approved origin using the safe sender established above, omitting all cookies/authorization/bypass credentials and following no redirects. A 201 contains only `{ "initialized": true }`. Record that result or only its fixed safe failure phase; do not fetch raw platform logs. A 409 may mean a committed winner or conflicting storage; never clear the ledger to retry. For a 503, use its safe phase plus an approved non-sensitive storage-state inspection to decide whether exact-target retry is appropriate while the same approved intent remains valid.
8. Do not log in, redeem the invitation or test guest/image access until the logging controls for their credential-bearing HTTP flows have been verified. Once separately authorized and safe, use the freshly generated offline password/code, test least privilege, revocation and session behavior, and inspect diagnostics with verified cookie protection. If platform logging safety cannot be established, stop those hosted flows and retain BLOCKED.
9. After cleanup approval, remove `MOTIVE_BOOTSTRAP_V2` and apply that revision with a separately approved deployment. Keep `MOTIVE_INSTANCE` and both claims unchanged. Expiry and the ledger already prevent reusable bootstrap authority. Verify signed-request replay denial without transmitting old credentials. Handle the private offline bundle through the operator's secure storage/cleanup process; no application reset endpoint is added.

A secure public-only bootstrap exchange is locally demonstrated. A supported end-to-end path through the current hosted private gate and broader credential-safe logging have **not** been established. Do not claim hosted unblocking, a verified 503 fix, production security or C$0 operation from local passes.
