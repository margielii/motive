# MOTIVE independent verification — 2026-11-06

Tested source: 4a2b9cbc05a889a6748cb66916014d186ebbfa05.
Fresh public Git checkout of foundation/poc matched this SHA and was clean. Existing implementation and migrations preserved. No functional source changes.

## Focused hosting investigation
Sites storage guidance establishes that Sites provisions and connects the declared D1/R2 resources for a project. The supported design is a separate MOTIVE Site with project-bound storage; inaccessible internal allocation IDs are not a prerequisite. This is platform-contract evidence, not observed hosted allocation or an assurance against misconfiguration.
Official guide: https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites
It states Plus/Pro hosting is currently included and shared limits apply. The available Site controls do not expose remaining quota, CPU allowance, or an enforceable no-overage control; the guide does not specify automatic-overage versus hard-stop behavior for this workload. The remaining deployment blocker is confirmation of non-chargeable exhaustion behavior. No further deployment attempts will be made without resolving that capability. No paid service is enabled.

The preserved MOTIVE Site remains version 0 with no live URL and custom access. No provisioning, secret configuration, save, deployment or hosted initialization was attempted. This does not block local work.

## Fresh automated verification
| Area | Verdict | Evidence scope |
| --- | --- | --- |
| TypeScript and lint | PASS | Fresh commands exited 0 |
| Invitation registration and password verification | PASS | Isolated local Worker/D1 |
| Persistent sessions, logout, expiry, recovery, restrictions | PASS | Local integration and compiled Worker |
| Server authorization, CSRF, spoofed headers, unknown methods | PASS | Local integration and compiled Worker |
| Guest single-use redemption, plan scope, expiry and revocation | PASS | Local integration and compiled Worker |
| Bootstrap permit/target checks, replay/concurrency and fail-closed installation guard | PASS | Local integration and compiled Worker |
| D1/R2 persistence and storage access controls | PASS | Separate temporary stores and emulator restart |
| Production build and package compatibility | PASS | Local emitted artifact; native upload acceptance untested |
| PWA manifest, icons and client-script delivery | PASS | Compiled Worker asset router |
| Browser UI and PWA installation | BLOCKED | Managed preview reported running but cloud browser returned ERR_CONNECTION_REFUSED |
| Physical iPhone | BLOCKED | Requires actual device |
| Hosted verification and C$0 operational guarantee | BLOCKED | Non-chargeable exhaustion policy unavailable; no deployment performed |

npm test: 38 tests passed, 0 failed.
npm run test:production: 34 tests passed, 0 failed.
npm run typecheck, npm run lint, npm run build and npm run check:package passed.
The compiled-Worker suite is the strongest executable environment used in this run. Local timings are not hosted CPU measurements.

## Physical iPhone acceptance
After a supported hosted test path is available:
1. Open Safari, verify the public shell and denial of protected data while signed out.
2. Redeem a synthetic invitation; verify login, relaunch persistence, logout and recovery invalidation.
3. Share → Add to Home Screen; verify icon, standalone launch, keyboard and safe areas.
4. Upload JPEG/PNG within the 2 MiB limit; verify oversized rejection and unauthorized download denial.
5. Redeem an account-free guest code; verify one-plan scope and denial following revocation/expiry.
6. Disconnect and reconnect; confirm clear network errors with no private-data offline cache.
7. After controlled redeployment, verify the same synthetic records and image bytes persist.

No application rewrite or new backend was needed. Overall: PASS for independently rerun local foundation areas; BLOCKED for hosted verification and device acceptance.
