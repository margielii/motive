# Approved MOTIVE audit — 2026-11-06

Outcome: audit completed; implementation/release stopped at unresolved gates. No application changes, dependency changes, hosted writes, PR creation, merge or publication performed. This is not an implementation-complete report.

## Evidence and source strategy

- Consolidated requirement source: [Issue #3](https://github.com/margielii/motive/issues/3), full body retrieved; repository snapshot in `APPROVED_DESIGN.md`. No comments were indicated by the issue metadata.
- Verified remote prototype `prototype/usable-sites`: `eaf3a95b5ec5029fa4bc5b3219784bac233f0ee3`.
- Verified remote foundation `foundation/poc`: `faf7e92cd752cb0854ec68418a32014276aa472c`.
- Remote `main`: `66cee05f9c1d2710258f43a7ef678846317f1279`; its tree contains only README.md.
- Dedicated local branch `implementation/approved-motive-ui` starts at the exact prototype. Future scoped implementation PR should target `prototype/usable-sites`, preserving the existing foundation stack. The current Site's saved v2 source matches this branch tip. Do not merge the historical foundation into main to obtain an app release.
- Existing PR #2 is an open draft, prototype → foundation; it reports pending visual/native acceptance. PR #1 is the foundation repair draft. Neither was changed.
- Read `PROTOTYPE.md`, `IPHONE_ACCEPTANCE.md`, `BOOTSTRAP_REPAIR.md`, foundation status/infrastructure/operations docs, recorded prototype review, app page/styles, model/adapters, Worker boundary, build configuration and tests.
- Architecture: React 19 / Next 16 via Vinext/Vite/Cloudflare Workers; Tailwind 4, TypeScript, ESLint; pnpm lockfile and repository CI installer. No tracked GitHub workflow was found. Current UI is one client page backed by per-instance in-memory adapters. The active production boundary rejects server mutations and all account/guest/bootstrap/data APIs. Dormant foundation APIs and emulator tests do not establish prototype multi-user functionality.
- Preserved deployment contract: existing `.openai/hosting.json` project ID, D1 `DB`, R2 `BUCKET`, Worker-first ASSETS, Drizzle migrations. No bindings, secrets, storage or configuration were changed.

## Requirement matrix

Status describes inspected source, not browser acceptance. Partial means functional pieces exist but do not meet the complete requirement. Missing means no supporting active model/UI path was found. Blocked means implementing/accepting the real-user behavior requires unresolved platform evidence.

| Approved requirement | Current evidence | Gap / status |
| --- | --- | --- |
| Night #141516, Graphite #2A2A2D, Canvas #F4F4F4, red #FF3B30; Inter | globals.css uses #111113, #ff4b4b, Arial | Missing exact tokens and font assets |
| O with red star; custom artwork and graphic participation motifs | Plain MOTIVE + registered mark, CSS skyline and group glyphs | Partial; no approved screenshot/reference image asset found in tracked source beyond PWA icons/favicon |
| Compact dark cards, restrained accents, no stock photography/Orbit | Dark CSS cards, no stock images | Partial; visual comparison not run |
| White question-mark dot; bell/profile; no Activity | Bell routes to Activity; no question-dot | Partial; replace Activity route and semantics |
| Home → Motives Spark → Groups → Calendar; red active outlines | Home → Plans Compass → Groups → Calendar | Partial; rename user-facing plan text and icon |
| Next Up compact image-led card | Existing skyline hero | Partial; approved reference comparison pending |
| Needs You, hidden when empty; full-page action context | Generic create/group action tiles | Missing actionable queue |
| Coming Up maximum three | On the horizon renders every non-next record | Missing cap/hierarchy |
| Floating + → Motive/Event → form; return scroll | Inline create buttons and dialog, no scroll restoration contract | Missing choice/FAB/scroll handling |
| Motives List/Calendar; All/Confirmed/Planning/Recurring | Flat Plans list | Missing switches, filters, independent status model |
| This Week/Next Week/Later; compact artwork/date/group/attendance | Date/group/artwork rows | Partial; missing groupings/status/attendance summary |
| Cancelled visible prominently | No cancellation field or action | Missing |
| Detail image header and Details/Polls/Attendance tabs | Graphic header with inline attendance and fixed poll | Partial; missing tabs/full-page poll navigation |
| Optional undecided date/time/location | Date/time required by form and repository | Partial; only location fallback exists |
| Compact poll summaries; no repeated Next Up/Message Group | Inline full fixed poll; no forbidden buttons found | Partial |
| Organizer overflow actions | Edit button visible without role model | Missing |
| Title/category/date/time/location/friend or group invites | Title/group/date/time/location/description form | Partial; date/time/group mandatory, no category/friend invites |
| Optional notes/artwork; collapsible recurrence | Description only | Partial; artwork/recurrence missing |
| Private draft vs Create & Invite; creation not confirmation | Save sample plan only | Missing lifecycle and invitations |
| Movie/Soccer/Dinner/FIFA/Gym/Drinks beer mug/Other/custom categories | No category model | Missing |
| Poll Date/Time/Location/General, single/multiple | One fixed two-option poll per record | Missing typed/dynamic poll model |
| Visible proportional counts including zero; votes vs unique voters | Counts/bars visible with zero-safe denominator | Partial; no voter records or unique-voter totals |
| Replace open votes | Two-option synthetic vote replacement exists | Partial; no open/closed lifecycle |
| Suggestions explicitly enabled; busy conflicts advisory | No suggestion or availability model | Missing |
| Optional auto deadline/manual close | No deadlines/status | Missing |
| Creator finalizes and explicitly applies; no automatic tie winner | No finalization/outcome | Missing |
| Creator edit/remove after votes; invalidate only affected votes and notify | No option IDs, voter attribution, edit/remove or notification model | Missing; must test affected and unaffected multi-choice votes, removals and substantive edits before acceptance |
| Going / Can't Go / No Response only | Going / Maybe / Not going, seeded Maybe | Noncompliant |
| Planning attendance editable; busy never implies Can't Go | No planning or busy state | Missing integration |
| User-created private friend groups, independent artwork | Three seeded fictional groups with glyphs | Partial; no creation/editing/artwork or organizer role |
| Group Motives/Calendar/Members tabs and organizer permissions | Members and matching list inline | Partial; no tabs or authorization model |
| Group month calendar: green reported-open/red busy/Motive dots | Personal Motive-dot calendar only | Missing aggregation |
| Selected-day compact summary; Best Days/Most Busy breakdown | Personal selected-day Motives | Partial; group breakdown missing |
| Unknown availability explicitly reported/unknown, never guaranteed free | No availability records | Missing |
| Personal Calendar sole busy-date editor; full-day default, hours/ranges/recurrence/edit/remove | Calendar selects date/month and creates a Motive | Missing |
| Propagate own busy data to authorized groups; no edits of others | No aggregation or privacy model | Missing; real-user enforcement blocked |
| Unified newest-first Notifications, no filters/sections/Activity | Hardcoded Activity examples | Missing chronological durable/session feed |
| Unread bell/read/deep links/consolidation/contextual permission | Always-present dot, static entries | Missing |
| Invitations/polls/attendance/changes/cancellation/conflicts/reminders | No generated notifications | Missing |
| Profile avatar/display name only, no bio | Name/avatar/bio editor | Partial; remove bio |
| Friends/requests/settings, private profiles/unique usernames | None beyond fictional profile | Missing; real identity blocked |
| Valid general/group/Motive invite → registration → destination | No real sign-in, registration or invite route; active Worker denies all such APIs | Blocked by logging/identity gate; do not fabricate provider support |
| Expired/invalid/revoked invitations; feasible expiry/revocation | Historical foundation codes only, not active prototype link mechanism | Missing/blocked |
| Short onboarding, actual supported auth, no carousel | Explicit synthetic-session entry only | Partial synthetic onboarding; no verified real provider |
| Neutral zero bars; closed results | Zero-safe bars only | Partial |
| Cancellation preserved; empty Motives/Groups/Notifications | No cancellations; seeded lists, calendar empty message | Missing major empty/cancel states |
| Pending/unknown availability, loading/error/retry/permission failures | Synchronous adapter and generic form error | Missing async and permission states |
| Confirm destructive actions | Reset sample data executes immediately | Missing confirmation |
| Server-side organizer/group/Motive/poll permissions; authorized availability privacy | Production denies ALL API operations, synthetic adapter has no actor/role model | Safe denial boundary preserved; required multi-user functionality absent/blocked |
| Responsive mobile, accessibility and regression acceptance | Source has safe-area padding, 44px controls, dialog, focus/pressed semantics | Partial; source inspection is not browser, VoiceOver or iPhone acceptance |

## Reused evidence and checks

Unchanged baseline evidence in `verification/prototype-review.md`: typecheck/lint/build/local package checks passed; full suite 47 passed and 1 intentional production-build skip; separate emitted-Worker integration passed. These results were reviewed, not rerun. They cover the old prototype, not Issue #3's missing features. Dependencies are not installed in this checkout. `git diff --check` passed for this audit; no new app verification is claimed.

No screenshots were captured. No supported browser/NodeREPL tool was found, and `cua_repl.js`, `site-workflow.mjs`, `build-site.mjs` were not found in the inspected workspace/installed /opt trees. Prior prototype documentation reports the same missing helpers. No alternative browser path or invented packaging control was substituted. Browser visual/functional/mobile/accessibility gates remain unpassed; physical iPhone acceptance remains pending.

## Read-only Sites evidence

Native `get_site` confirms MOTIVE project `appgprj_6aed48a714408191879b5c36ca346b9d`, title MOTIVE — Foundation, owner role, custom policy revision 1, exactly one owner, no allowed groups/editors and zero external visitors. Live URL is https://motive-foundation.margielii.chatgpt.site . No access setting changed.

Native version listing records latest saved v2:

- Version ID: `appgprj_6aed48a714408191879b5c36ca346b9d~appgver_637a0cb5253481918074e28c2baf06a5`
- Source SHA: `eaf3a95b5ec5029fa4bc5b3219784bac233f0ee3`
- Stored tar hash: `e75c3ec13aa8ef902c8fa1407c0a2290891f14b8a349c045f53645264c32873f`
- Stored size/count: 1,474,560 bytes / 71 files.
- Associated deployment: `appgdep_6aedfc8f77c081919151db3fe7b1b287`.

This is existing saved-version metadata, not a new release artifact, an independently recomputed checksum, or proof of current production asset bytes. The newer native record supersedes the old prototype report's assertion that no native artifact was saved. Do not use saved v1 foundation as an automatic rollback: it includes the credential-bearing foundation surface with unresolved security gates. Before a new release, verify and retain the safe v2 archive and supported redeployment path. Native save/private-deploy controls are listed as available; absence of native controls is NOT the blocker in this audit.

## Stop gates and required continuation

1. **Real-account security gate:** BOOTSTRAP_REPAIR.md and FOUNDATION_OPERATIONS.md explicitly record unverified platform request/response protection for passwords, invitation/recovery codes and session cookies. Firebase is preferred but neither integrated nor validated. Historical bootstrap 503 remains undiagnosed on hosted infrastructure. Obtain supported platform protection evidence for these fields and the outer access path; then validate the actual provider and authorized server contract. Do not enable dormant foundation routes, send real credentials, rearm the retired permit or present synthetic invitations as real.
2. **Visual/functional release gate:** provision the supported browser/screenshot surface and supply the approved visual references if they are not otherwise available. Run actual mobile screen/flow/accessibility comparison and the iPhone checklist. No source-only review can mark this passed.
3. **Native artifact gate:** restore/install the documented Sites source/build helper workflow, then package the verified merged source through it. Verify source commit, manifest, Worker entry, all assets, migration inventory and checksums. Retain a verified safe rollback artifact. The existing saved-v2 record does not verify a future artifact.
4. Implement every matrix gap within the explicitly synthetic owner-only contract until the real-user gate is independently cleared. Preserve universal server denial and unchanged storage/migrations/secrets. Add meaningful model/integration tests for poll edit invalidation/notification targeting, attendance states, group-authorized availability, drafts/cancellation, notification ordering, and invitations. Real multi-user permission tests must exercise a verified active server implementation, not merely fictional UI roles.
5. Re-run typecheck, lint, tests, build, production boundary and package checks after implementation. Review the focused diff; open a PR to `prototype/usable-sites` with actual screenshot/test evidence; merge only after applicable verification passes. Then package the merge SHA and publish only to this owner-only MOTIVE project using supported native controls, preserving runtime configuration. Verify deployment identity/assets and API denial.

The user's Issue #3 and execution rules require stopping at failed security/release gates. No additional approval is being requested. No new PR URL, merged commit, release artifact SHA-256 or deployed revision exists for this task. No tools mutated MOTIVE hosting, Orbit, or any other Site.
