# MOTIVE visual implementation — review candidate

Resumes `visual-fidelity-preflight.md`; does not restart its audit. Base: `723b7633db08cbe63e91facbf7b70bc91621f711`, target `prototype/usable-sites`. Preflight remains a historical baseline; the current owner instruction permits reference extraction, development without browser QA, and a PR before release acceptance.

## Reference evidence and corrected discrepancies

All nine source boards were located in the session attachment directory after preflight and are now retained in `design/references`, with attachment names and SHA-256 hashes in `inventory.json`. They were inspected in conversation; boards 01 and 08 and the extracted wordmark/icon were also opened directly as local images. This is asset inspection, not rendered application screenshot comparison.

| Baseline discrepancy | Change |
| --- | --- |
| Text-built logo and unrelated M app icons | Reference-derived raster wordmark and approved white-square/red-star icon; obsolete blue starter favicon removed; manifest/Apple icon paths preserved |
| Generic gradient/glyph artwork | Approved artwork crops, including category-specific Movie/FIFA/Dinner; custom uploads retain priority; provenance recorded |
| Oversized Home and broad layout | 480px maximum app shell; 174px featured card; compact title-first rows, avatar stacks, Next Up badge, Needs You count, See all, restrained local-demo indicator |
| Three combined detail tabs | Overview/Polls/Attendance/Details with icons; compact category header; schedule/location/attendance rows, About, poll action, planning/people/actions sections |
| Graphite selected segments | White selected state, dark text; graphite inactive state |
| No Response action button | Only Going/Can't Go response controls; all three tracked states retained in member lists |
| Poll creation/vote presentation | Type segments, existing-type lock, result-visibility setting, option percentages, inset progress bars, selected circles and suggestion attribution |
| Group directory/hub | Compact group art/member stacks; upcoming/past Motives, scoped creation and organizer invitation management |
| Single-day availability page | Separate Group Availability page with monthly best/busy summaries, date-by-date counts, selected-member breakdowns and per-member busy-day counts; unknown explicitly retained |
| Personal Calendar | Month/Upcoming switch, compact calendar, selected date and existing busy editor/actions; reported green/red and Motive dots |
| Creation/category | Compact graphite bottom sheet, dedicated category picker, visible optional primary fields/invitations/notes, recurrence/reminder under More options, distinct draft/create actions |
| Embedded friend directory/profile form | Profile portrait/settings/navigation, custom avatar upload, dedicated Friends search/Add Friend, incoming requests and synthetic outgoing request states |

Preserved the local adapters, explicit outcome application, selective vote invalidation, cancellation, busy-period editing, permissions and private drafts. No real accounts, external invitations, push delivery, messaging, Polls directory, Maybe, biography, Orbit graphics or audience changes. Reminders are stored prototype settings, not external delivery. Source/storage bindings, migrations and lockfile remain unchanged.

## Visual acceptance — PENDING

No browser/NodeREPL tool is exposed, and `cua_repl.js` is absent. No alternative browser was installed. No dev server was started solely to claim a preview. No screenshots were captured, no pixel or rendered-layout comparison passed, and no mobile interaction/accessibility acceptance is claimed.

Owner iPhone acceptance is required for **all 17 requested views**: Home; Motives; Motive Overview, Polls, Attendance, Details; poll creation; voting; Groups; group detail; group calendar; Group Availability; personal Calendar; Create Motive; Category; Profile; Friends. Also check Notifications, the creation choice menu, long titles/options, keyboard-open sheets, short screens, safe-area bottom spacing, custom uploads and 320/390/430px portrait widths. Compare with `design/references` applying the later written corrections. These checks must pass before merge/publication under the current request.

Code-level responsive review covers flexible minmax grids, constrained shell/sheets, dynamic viewport height, safe-area padding, 44px control minimums, wrapped long text, horizontally scrollable filters, image bounds, focus styling and reduced motion. This is not a substitute for the owner checks above.

## Packaging — BLOCKED, separate from development

A bounded search found no supported `site-workflow.mjs` or `build-site.mjs` anywhere in the executor. The Sites skill's documented script resource locations could not be read through the available skill-resource interface either. The repository retains the previously working build scripts, Vite Sites integration and `check:package`; they can validate build output but do not replace the missing native source/archive helper. No packaging convention, archive layout, authentication protocol or historical artifact recovery was improvised.

Release still requires the supported helper installation, exact merged-source packaging, inventory/checksum/source identity, `dist/server/index.js`, saved v2-or-newer rollback verification, current owner-only policy/runtime confirmation and native save/deploy. No archive checksum, merge SHA or new Site version exists for this review candidate.

## Remaining limits

Raster assets are reference-derived and limited by JPEG/thumb resolution. Exact original vector masters, full-resolution artwork and portrait masters remain missing; see `public/brand/README.md`. Synthetic reminders and outgoing requests are local records only; no one is contacted. Browser/iPhone visual and interaction acceptance and native release packaging remain open. The deployed Site has not been changed.

## Checks

Final command results are recorded in `visual-typecheck.txt`, `visual-lint.txt`, `visual-tests.txt`, `visual-build.txt`, `visual-production.txt` and `visual-package.txt` with their completed command output. Production integration includes delivery of every approved reference-derived asset and denial of arbitrary brand files and source provenance.


React best-practices review: top-level component definitions, per-instance repository state, stable option/member keys, isolated editor state and hook order; timer cleanup preserved; native dialog focus/Escape retained; category selection replaces the form content within the existing dialog rather than overlaying focusable controls; uploads remain bounded local data URLs. Local/reference images use the existing framework image component with optimization disabled, avoiding an image-service endpoint. No new application dependency or lockfile change.


Final validation: TypeScript PASS; ESLint PASS with zero warnings; full suite 57 PASS / 1 build-dependent SKIP; final targeted synthetic regression tests 14 PASS; final emitted-Worker integration 1 PASS; production build PASS; local package/binding/migration checks PASS; `git diff --check` PASS. The production command exercises the skipped build-dependent test. Its asset checks compare actual response bytes with the build files, consume response streams and verify the denial JSON, not just HTTP status. The full suite was reused after final presentation refinements; the final targeted tests, typecheck, lint, build and production integration cover the current application code. No dependency inputs, bindings or migrations changed.

Application commit: `248a6487ba42b4ce0857a44a9695347e469218b8`. `visual-build-inventory.txt` records all local build files and checksums against that application source; subsequent review-evidence/test-only changes do not alter the application build. These hashes do not constitute a native archive checksum. This candidate is intentionally unmerged and unpublished pending visual acceptance and release gates.

## Visual acceptance attempt — supported environment unavailable

Resumed PR #5 at head `8579f1783d3112d700ac9767cd2d9c90a79f52ee` without restarting the audit or changing application code. The existing successful checks are reused.

The managed runtime is running and reports a desktop/browser capability, but the active tool catalog exposes no browser-control or NodeREPL tool. Installed runtime files alone do not establish an accessible supported browser session. No alternate browser-control path was used.

Owner iPhone preview fallback was attempted through the supported Sites CLI:

```text
sites-preview status
sites-preview start /workspace/motive
```

Both failed with exit code 1:

```text
sites-preview: preview relay unavailable: No such file or directory (os error 2)
```

The CLI returned no preview URL. Therefore no accessible owner iPhone preview was established; the production Site is not a preview of PR #5. No independent server, public tunnel, alternate host, audience change or application workaround was introduced. The Sites troubleshooting instructions identify a missing preview relay/daemon/browser route as environment infrastructure to restore, not an application defect.

All 17 visual comparisons remain pending. No screenshots or new material visual discrepancies are claimed. To continue, restore the supported browser/NodeREPL control surface for agent acceptance, or restore the Sites preview relay and an iPhone-accessible preview route for owner acceptance. Phase 2 remains unstarted: PR stays draft, no merge, no native packaging/archive recovery, no new Site version or deployment. MOTIVE production access and Orbit are untouched.
