# Approved MOTIVE specification snapshot

Source: https://github.com/margielii/motive/issues/3
Retrieved: 2026-11-06. Issue updated: 2026-11-06T20:33:12Z.
This is a specification snapshot, not a statement of implementation or release acceptance.

# MOTIVE approved design implementation — Codex handoff

## Authorization
Owner authorizes implementation, verification, PR merge, and publication to the **existing owner-only MOTIVE Site** after gates pass. No Orbit changes. Do not expand audience, introduce live personal data into synthetic prototype, weaken security, or bypass unresolved platform gates. Stop and report blockers rather than guessing.

## Source and environment
Repository `margielii/motive`. Prototype source branch `prototype/usable-sites` at `eaf3a95b5ec5029fa4bc5b3219784bac233f0ee3`; foundation branch `foundation/poc` at `faf7e92cd752cb0854ec68418a32014276aa472c`; `main` currently contains only a README and must NOT be assumed to be the deployable app. Inspect `PROTOTYPE.md`, `IPHONE_ACCEPTANCE.md`, `BOOTSTRAP_REPAIR.md`, foundation docs, actual source, existing PRs, CI, deployment configuration and Site before deciding branch strategy. Preserve existing runtime bindings/secrets and owner-only isolation. Do not conflate prototype UX release with blocked real-account bootstrap.

## Visual design
MOTIVE-specific design, not Orbit: Night #141516, Graphite #2A2A2D, Canvas #F4F4F4, red #FF3B30, Inter, compact dark cards, restrained red accents, user-custom artwork and graphic participation/voting motifs. Wordmark O with red star. No generic promotional copy, no candid stock imagery. Home question-mark dot white; header bell + profile avatar, no Activity icon. No "hang out. Plan together", "Message group", or redundant "Next Up" inside Motive Details.

## Navigation
Bottom Home (house) → Motives (Spark/sparkles) → Groups (people) → Calendar (calendar). Outlined inactive and red active. Profile via top-right avatar; Notifications via bell. Replace residual "Plans" with "Motives" in user-facing text; singular "Motive". Poll is NOT bottom tab.

## Screens and behaviours
- **Home** approved compact image-led Next Up; action-focused Needs You (polls and attendance open full-page context); Coming Up maximum 3; floating red + opens Motive/Event selection then creation form; preserve scroll returning from detail. Hide Needs You when empty.
- **Motives** List/Calendar switch; All/Confirmed/Planning/Recurring filters; This Week/Next Week/Later groupings; compact cards with artwork, date/time/group/attendance and independent Planning vs Confirmed status. Cancelled Motives remain visible with prominent Cancelled status.
- **Motive detail** image-led header; Details/Polls/Attendance tabs; date/time/location may be undecided and clearly labelled; compact poll summaries deep-link to full-page voting; no Message Group and no repeated Next Up; organizer actions behind overflow.
- **Creation** floating + → Motive/Event choice → form → detail; title/category/date/time/location/invite friends or group; date/time/location/invites all visible and optional, not hidden in More; notes/artwork optional; advanced recurrence collapsible; Save Draft private vs Create & Invite. Category presets include Movie, Soccer, Dinner, FIFA, Gym, Drinks (beer-mug icon), Other and custom; broader approved sports/entertainment/social options. Creating does not automatically mean Confirmed.
- **Polls** Date/Time/Location/General Choice; single or multiple choice; always-visible counts and proportional bars, before and after voting; distinguish votes from unique voters; vote changes while open; suggestions only if creator enables; conflicts with busy dates shown contextually, never prevent voting; optional deadline automatically closes, otherwise manual close; creator finalizes and explicitly applies outcome to Motive. Ties displayed without auto winner. Creator CAN edit/remove options after votes; if meaning substantively changes or option removed, invalidate only affected votes, notify voters to revote, retain unaffected votes. Prevent misleading results.
- **Attendance** Going / Can't Go / No Response ONLY; no Maybe anywhere. Editable while applicable; can respond to Planning Motive before details finalized. Busy date does NOT imply Can't Go.
- **Groups** user-created friend groups only, independent artwork, members, Motives/Calendar/Members; organizer-managed permissions. Group Calendar month with subtle green open dates, muted red busy dates, separate Motive dots; selected-day compact summary; Best Days/Most Busy cards open full-page read-only availability breakdown. Unknown busy data means open *based on reported availability*, not guaranteed free.
- **Personal Calendar** sole place to edit own busy dates: select date → Mark Busy defaults full day, optional hours/ranges/recurrence, edit/remove; updates all relevant group calendars. No group member may edit another's availability.
- **Notifications** ONE chronological newest-first feed, NO filters or section headers, no Activity surface. Invitations, polls, attendance, schedule/detail changes, cancellation, conflicts, reminders; unread bell red dot, read state, relevant deep links, consolidate redundant updates, contextual notification permission.
- **Profile/Friends** profile avatar + display name ONLY, no bio/subtitle; friends, requests, settings; private profiles, unique usernames, no public directory/feed, no separate Invitations inbox. Anyone with a valid invitation link can register; link may point to group/Motive/general; handle expired/invalid; link expiry/revocation follows feasible platform implementation.
- **Onboarding** short invite-link → account → destination flow; authentication methods only those actually supported by deployed architecture; no invented Apple/Google support; no mandatory carousel.
- **States** zero votes neutral bars, closed polls show results, cancellations preserved, empty Motives/Groups/Notifications, invalid invite errors, pending/unknown availability, loading/error/retry and permission failures. Destructive actions require confirmation.

## Permissions and integrity
Organizer-managed Motives and Groups; invitees can respond, vote, suggest if enabled; creators control poll edits/finalization; no cross-group availability leaks beyond authorized group-level information; enforce access server-side, not only UI. Keep prototype synthetic/owner-only unless existing verified platform architecture and explicit scope support real users. Review prior hosted security gates before changing authentication or exposing routes.

## Execution sequence
1. Inventory repository branches, app architecture, current Site deployment, known security blockers, tests, and approved screenshot references; produce gap matrix.
2. Write durable consolidated design spec in repository and implement incrementally on feature branch from correct deployable source.
3. Run typecheck, lint, build, unit/integration and permission tests; cover polling vote invalidation, availability, notifications, cancellations, invite links, empty states, navigation, mobile layout and regressions. Inspect generated artifacts and migration integrity.
4. Open PR with screenshots, checks and risk assessment; merge only when verification passes and correct target branch established. Owner's merge authorization applies to this scoped work.
5. Build reproducible Sites artifact; verify checksum, source SHA, asset inventory, runtime compatibility, rollback feasibility, owner-only audience and Site identity. Publish to **existing MOTIVE Site only** if native supported publishing controls are available and gates pass. Verify live version/assets/denied unauthenticated API behaviour. Never publish to Orbit.
6. Report actual commits, PR, merge SHA, Site revision, verification results, outstanding blockers. Do not claim Codex, merge or publication completed without evidence.

## Critical stop conditions
No working Codex/Sites execution surface; unclear target branch; failing tests; unresolved authentication/security requirements; unknown Site audience; artifact mismatch; no reliable rollback or identity verification; deployment requiring broadened access. Record blocker and stop that stage; do not substitute speculative workarounds.

