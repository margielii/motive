# MOTIVE visual implementation preflight — 2026-11-06

Historical preflight: resumed by [visual-fidelity-implementation.md](visual-fidelity-implementation.md) under the later owner instruction. Attachment JPEGs were subsequently located; the original asset/browser/packaging findings below describe the initial search, not the current implementation state.

Status at preflight: blocked before application edits. This document is a reference/source discrepancy register, not screenshot acceptance or an implementation-complete report.

## Verified source and hosting

- Fetched GitHub `prototype/usable-sites`; `git ls-remote` confirms HEAD `723b7633db08cbe63e91facbf7b70bc91621f711`. The supplied historical checkpoint happens to remain current. No revert was performed. Local implementation branch starts at that HEAD.
- Native Sites `get_site`: existing project `appgprj_6aed48a714408191879b5c36ca346b9d` is active at `https://motive-foundation.margielii.chatgpt.site`; latest saved version is 3. Version listing associates v3 with the same source SHA and deployment `appgdep_6aee4705d7f48191a90046393ec634e8`. Runtime bytes were not fetched or independently verified.
- Access policy revision 1: current user is owner, exactly one allowed owner, no groups/editors, zero external visitors. No access changes made. No secrets or runtime settings were changed or enumerated.
- Safe synthetic rollback candidates remain saved v2 and v3. V3 archive metadata: SHA-256 `a73f4e0d4d0d48f0626a9eb6a53f425dcda9400873a18c4b3502d22acdb32b35`, 2,416,640 bytes, 73 files. This is existing platform metadata, not a new artifact or independently recomputed checksum. No archive recovery investigation was restarted.

## Available references and precedence

The nine attached reference boards are visible in this conversation: brand/core screens; core screens/components; Profile/Friends; four Motive sections; poll creation/voting; Calendar/creation/categories; group calendar/availability; groups; Hybrid C Home/contextual participation. They were visually inspected as conversation images. They are not supplied as locally addressable image files or standalone brand assets in this checkout.

The current written instructions supersede depicted older alternatives: four bottom tabs Home/Motives/Groups/Calendar with Spark for Motives; Profile through avatar; four Motive sections Overview/Polls/Attendance/Details; Going and Can't Go response controls with No Response tracked separately; no Maybe, Message Group, biography, EVENT classification pills, or Polls directory. Creation still includes the explicitly approved Motive/Event choice. Retain private synthetic interactions and defer real authentication/delivery.

## Discrepancy register

These findings compare visible references with corresponding source, except the existing PNG icon which was also opened directly. Dimensions below are source values, not rendered browser measurements.

| Area | Existing component/evidence | Required correction |
| --- | --- | --- |
| Wordmark | `app/page.tsx` entry/header constructs M + O + text star + TIVE; `.wordmark` uses normal font | Exact approved slanted wordmark asset; preserve O/star geometry. No standalone approved asset found. Do not trace or improvise. |
| App icon | Opened `public/icons/motive-512.png`: cream angular M on green; `public/favicon.svg` is blue starter artwork | Approved red four-point star on plain white rounded square for manifest, Apple and applicable icons. Obtain approved master asset. |
| Category/group imagery | `Artwork`, `ArtPicker`, `.art-red/.art-violet/.art-green/.art-blue` use gradients and a large text glyph | Approved red seating, basketball sunset, controller, dinner/drink and group artwork; preserve custom uploads. No approved raster masters found. |
| Global density | `.app-shell` max-width 760; h1 up to 38px; panels 18px padding; persistent demo banner | Compact phone composition and restrained typography/cards; reduce synthetic indicator prominence. Requires rendered viewport comparison. |
| Home | `.hero` 260px high; separate Next Up heading; `hero-bottom` title 29px | Compact Hybrid C featured card, in-card Next Up badge, approved artwork/information balance and small avatars. Preserve conditional Needs You, three previews and creation menu. |
| Motives | `row()` orders date before title, displays own response, generic art, bottom border | Approved title/date/location/attendance card composition with status. Preserve useful existing filters/calendar; no EVENT/poll directory pills. |
| Motive header/sections | `.detail-art` 210px; `detailTab` defaults to Details; only Details/Polls/Attendance tabs | Compact category header and four sections Overview/Polls/Attendance/Details with icon labels. Split existing combined information into approved sections. |
| Segments | `.segmented [aria-pressed=true]` graphite with pale red text | White selected surface/dark label and graphite inactive segments. |
| Overview/Details | Existing combined panel lists schedule/notes/organizer | Structured schedule/location/attendance rows, About, outstanding action; separate planning/deadline/reminder/recurrence/group/invitees/creator actions. No Message Group. Reminder is absent from Plan model. |
| Attendance | Three response buttons including No Response; member names in separate panels | Only Going/Can't Go action controls; No Response remains a tracked member grouping. Compact avatar/member presentation. Model already excludes Maybe. |
| Poll creation | `PollEditor` uses select/checkbox form | Compact Date/Time/Location/Choice segments and approved rows/toggles. Results visibility configuration is absent from Poll model. Preserve deadline, suggestions and option integrity. |
| Poll voting | Vote count displayed, percentage absent; bar spans button background; generic page shell | Compact option cards with selection circle, percentage and inset progress track, suggested attribution and approved open/closed treatment. Preserve explicit outcome application and affected-vote invalidation. |
| Group directory/hub | `group-card` lacks member avatar stack; group Motives use a single list | Approved artwork/avatar rows; compact hub with upcoming/past grouping and scoped Create Motive. Preserve membership controls and uploads. |
| Group availability | `breakdown` shows one date/member panels and title Availability | Approved separate Group Availability overview with ranked Best Days/Most Busy, date-by-date counts and individual busy breakdowns. Preserve unknown-versus-reported distinction. |
| Personal Calendar | Existing Month and BusyEditor plus upcoming view | Compare density, selected-day panel, day colours, Motive dots, navigation and edit flows in browser before accepting. Keep personal busy data authoritative. |
| Creation/category | `MotiveEditor` generic dialog and native category select; artwork fieldset | Approved graphite sheet and dedicated category selection with library icons, Drink/beer and custom category. Keep date/time/location/invites visible and distinct draft/create actions. |
| Profile/Friends | Profile embeds edit form/friend panels; avatar is select; no dedicated searchable Friends page | Approved profile portrait/settings rows; custom avatar upload; searchable Friends destination/Add Friend and request states. No bio and no Profile bottom tab. |
| Notifications/nav | Bell/local feed and correct four primary destinations exist | Preserve newest-first local feed/no filters; visually verify compact safe-area nav, active icons and detail header treatment. |

## Release gates and next inputs

1. **Approved assets:** exact wordmark and icon masters are absent. Board previews establish appearance but do not supply a faithful standalone asset. User explicitly prohibits improvising geometry. Obtain SVG or transparent high-resolution PNG masters through supported attachments, plus original artwork files or locally downloadable reference boards suitable for extracting supplied artwork. Do not generate substitutes.
2. **Visual QA:** no browser/NodeREPL tool is exposed in the active tool catalog; filesystem search found no `cua_repl.js`. No browser was installed or alternate automation improvised. No screenshots were captured. All 17 requested screenshot comparisons and mobile interaction checks remain pending; code review is not acceptance.
3. **Supported native packaging:** filesystem search found no `site-workflow.mjs` or `build-site.mjs`. Native Sites controls exist, but the documented opening/packaging workflow cannot currently run. A fresh source credential was requested and kept out of files. No source repository push, archive reconstruction or native save/deploy was attempted. Restore the supported helper installation; require `dist/server/index.js` in the verified release inventory.

Per the current instruction to stop on unestablished required release gates, no application changes, PR, merge or release were attempted. No new artifact checksum or deployed version exists for this attempt. Orbit and other applications were not touched. No additional publication approval is needed once gates pass.

## Checks

Source identity and clean baseline were checked. The only working-tree change is this report. Historical typecheck/lint/build/test evidence under `verification/approved-*` was reviewed as baseline evidence only; it was not rerun and does not prove visual fidelity. No new implementation checks or screenshot evidence are claimed.
