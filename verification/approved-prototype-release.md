# MOTIVE owner-only UI prototype — release verification

## Scope and source

Implements [Issue #3](https://github.com/margielii/motive/issues/3) under the [owner's scope correction](https://github.com/margielii/motive/issues/3#issuecomment-6694986291). Reuses audit commit `6668d04b90e6da4851bf0f5a4cdd7c61d435af5f`; the historical gap matrix records the pre-implementation state and its original stop decision, which the correction supersedes.

Target branch: `prototype/usable-sites`. Foundation PR #1, stacked prototype PR #2, foundation branch and README-only main are not merged or retargeted by this implementation. The release PR contains only the approved prototype and verification documentation.

## Implemented local flows

- MOTIVE Night/Graphite/Canvas/red tokens, self-hosted Inter with OFL license, wordmark star, custom graphic artwork and per-Motive/group fictional image selection (PNG/JPEG/WebP, 2 MiB limit). All image data remains in memory.
- Home/Motives Spark/Groups/Calendar navigation; avatar Profile and bell Notifications; white help dot. Home Next Up, conditional action-focused Needs You, Coming Up capped at three, floating Motive/Event choice, and return-to-list scroll restoration.
- Motives list/calendar, status/recurrence/draft filters and week groupings. Planning and confirmation are separate; cancelled records remain. Details/Polls/Attendance tabs, undecided optional fields, organizer overflow actions, confirmation/cancellation controls.
- Motive/Event form with category presets/custom, optional visible date/time/location/group/friends, notes, artwork and collapsible recurrence. Private drafts are only visible to their organizer; publishing simulates invitations and opens details. Weekly/monthly recurrence appears on calendar dates and shares the parent Motive's polls/attendance; months without the selected day have no occurrence. This is not an independent occurrence-series backend.
- Date/Time/Location/General Choice polls, single/multiple ballots, change/withdraw votes while open, neutral zero bars, always-visible counts and proportional bars using unique voters, optional suggestions, busy-date advisory, automatic deadline closure, manual closure and explicit final outcome application. Ties have no automatic winner.
- Option IDs remain stable. Exact trimmed label changes conservatively invalidate that option's votes; unchanged labels retain votes. Removing options removes only those choices from multi-choice ballots. Affected fictional voters receive consolidated local revote notices. Incoming ballot edits are ignored by the option-edit operation. Choice mode/type cannot change after creation. General outcomes are recorded; date/time/location outcomes explicitly change the relevant field, without automatically confirming the Motive.
- Attendance has only Going / Can't Go / No Response; available before confirmation; no busy-date inference. Cancelled Motives reject attendance and voting.
- Create/manage private fictional groups, organizer-managed membership and artwork; Motives/Calendar/Members. Month dots and reported-busy/open tint; selected-day summary; ranked Best Days/Most Busy cards open read-only member breakdown. No reported busy time is explicitly not a guarantee of availability.
- Personal Calendar is the only busy-time editor: full-day default, optional hours/date ranges, weekly recurrence, edit/remove. Changes are reflected across shared fictional group calendars. Local repository rejects edits of others and unauthorized group aggregation.
- Profile avatar/display name, friends/request acceptance/decline (Alex demonstration), settings and fictional member switch for permissions testing. No bios, public discovery or real accounts. Notices form one newest-first local feed with unread/read state, deep links and consolidation; there is no external delivery or permission prompt.
- Empty lists, zero results, closed/cancelled/undecided/unknown states, form validation, image read errors and confirmation before cancel/reset/option removal. Synchronous local operations have no artificial network/loading claims.

## Explicitly deferred

Real authentication, registration, invitation links/issuance/redemption, onboarding into real destinations, notification delivery/backend, network synchronization and persistence. No Apple/Google/Firebase integration or external invitations are enabled. Synthetic member switching is not authentication. Runtime foundation authentication/logging safety remains future work and is not a prototype development gate.

All prototype state is per component instance and disappears on reload/end/reset. Local role checks are interaction/integrity demonstrations, not production authorization. The active Worker still denies all server operations, including legacy foundation APIs and framework mutations. Only explicitly allowlisted shell/assets, including the self-hosted font/license, are served. No migrations, dependencies/lockfile, hosted runtime values, storage bindings or access policies changed.

## Verification evidence

Final results: TypeScript PASS; ESLint PASS with no warnings; production Vinext/Cloudflare build PASS; full suite **55 passed, 1 intentional build-dependent skip** (56 total); separate emitted-Worker integration **1 passed**; package/migration/binding checks PASS. The intentional skip is exercised by the separate production command. `git diff --check` passed. The first regression run identified a fixture-count assertion left over from the old five-person group; it was corrected to the current three-person fixture and the complete suite rerun successfully.

Read-only final Site inspection: owner role, custom policy revision 1, one owner, no groups/editors and zero external visitors; latest saved version remains v2. No hosted changes were performed.

See `approved-typecheck.txt`, `approved-lint.txt`, `approved-tests.txt`, `approved-build.txt`, `approved-production.txt`, and `approved-package.txt` for final captured command output. Tests cover foundation regressions plus synthetic drafts/publication, option-change/removal invalidation, unaffected ballots, unique-voter totals, deadline/manual closure, suggestions, creator/participant permissions, explicit outcomes, attendance/cancellation, own-only availability/ranges/recurrence, group aggregation/privacy, local notice targeting/read state, and recurring Motive dates. The emitted-Worker integration checks actual shell/PWA/font/script delivery and universal API/mutation denial without D1/R2 initialization.

React/source review: state is per-instance; modal/editor state is isolated in top-level components; timers are cleaned up; controls have labels, pressed/current-state semantics and visible focus; native modal focus/Escape and return focus; skip link, semantic navigation, safe-area padding, responsive minmax grids/short-screen dialog scroll and reduced-motion rules. No new runtime dependency was added. Installer-only pnpm workspace edits were reverted.

### Verification limits

No supported `cua_repl.js` or browser tool is available. No screenshots, browser click/contrast/layout/accessibility pass, VoiceOver test, or physical iPhone/PWA installation acceptance is claimed. Static responsive/source inspection and the actual compiled HTTP integration passed; these are not browser substitutes. Under the scope correction, this does not block the verified development/merge stage. Approved pixel-level visual comparison remains unverified; no alternate visual design or Orbit source was used.

## Publication investigation / handoff

Existing Site: `appgprj_6aed48a714408191879b5c36ca346b9d`. Native save/deploy controls are available. The documented `site-workflow.mjs` and `build-site.mjs` helpers are absent from the inspected installed plugin, /opt and workspace trees. The source credential tool returns a separate Sites source repository on its configured `main`, using `http_extra_header` authentication; this is NOT the GitHub main branch. Automatic publish-on-push was not requested and is false. No credential value is saved in this report or repository.

Native save requires the supplied SHA to match the HEAD of that configured Sites source repository. Without the documented source helper, verified source synchronization and supported archive preparation have not completed. No speculative authentication/header protocol, improvised helper, source-only deployment, or unverified native upload was substituted. A source-only remote-build fallback would not establish the required prepublication artifact identity/integrity gate.

Safe rollback candidate is saved synthetic v2:
`appgprj_6aed48a714408191879b5c36ca346b9d~appgver_637a0cb5253481918074e28c2baf06a5`, source `eaf3a95b5ec5029fa4bc5b3219784bac233f0ee3`, stored tar SHA-256 `e75c3ec13aa8ef902c8fa1407c0a2290891f14b8a349c045f53645264c32873f`, 71 files / 1,474,560 bytes. Native get-version confirms provenance; downloading its stored archive with the supplied file ID failed authorization/resolution. A byte-verified rollback archive was therefore not established. Do not roll back to v1 foundation, which has a different credential-bearing surface.

Continuation: restore the supported Sites source/build helper installation; open the existing Site repository with a fresh credential through hidden stdin; synchronize the exact GitHub merge commit to its configured source branch; build/package that unchanged source through the documented workflow; verify the returned commit, archive/checksum, asset inventory, Worker/ASSETS, unchanged migrations and bindings. Obtain/verify the safe v2 rollback artifact or establish a supported exact saved-version rollback. Recheck owner-only audience, then native-save and private-deploy, polling only nonterminal deployments. Verify returned active source/version, assets and API denial; preserve secrets/storage/access configuration. No additional owner approval is needed for these authorized steps.
