# iPhone acceptance — synthetic owner staging only

Status: pending physical iPhone and approved staging deployment. Record device, iOS/Safari version, exact commit, Site version, date and pass/fail per item. Use fictional data only. No real account/password/token tests.

- [ ] Confirm Site owner-only policy before opening. A signed-out/non-owner browser cannot load it. Never change the audience to test.
- [ ] Open in Safari at 375/390/430px widths and landscape; no horizontal overflow or clipped text. Check larger text and Display Zoom.
- [ ] Entry clearly says synthetic and tab-only. No email/password/register/guest entry. Start synthetic session.
- [ ] Home shows Next Up, two actions and upcoming plans; red accents/graphite surfaces; activity icon beside profile avatar.
- [ ] Open Next Up; back returns to originating tab. Attendance options update one selection. Repeat poll vote and switch choices: totals stay consistent without duplicate votes.
- [ ] Create a sample plan with name/private group/date/time/location/details. Check required fields, cancel without saving, keyboard and date/time pickers. Save then open from Plans and the matching group.
- [ ] Edit the plan; title/date/location update in Plans, group and Calendar, preserving attendance/vote. No claimed invitation/notification/shared save.
- [ ] Groups show fictional members and only matching plans; return to all groups. No public discovery or guest link.
- [ ] Calendar: previous/next month, month lengths/year transition, event dots, selected-day plans and empty days. Creating from a selected day preselects that date.
- [ ] Home avatar opens Profile. Save fictional name/avatar/bio; Home reflects name/avatar. Reset restores sample state. End session returns to entry.
- [ ] Reload and new tab reset data and synthetic session; nothing is shared with another device.
- [ ] Modal keeps focus inside; close button and Escape with external keyboard work; focus returns. VoiceOver reads headings, nav selection, labeled controls, vote/attendance state and update status.
- [ ] Tap targets work with one hand; keyboard doesn't cover Save; modal scrolls on short screens; bottom nav clears home indicator/notch.
- [ ] Safari Share → Add to Home Screen. Correct name/icon; standalone launch; safe areas/top status bar; navigation and all flows work after relaunch. Owner hosting authentication may affect standalone launch: record actual behavior.
- [ ] Offline launch honestly fails or shows browser offline state; no private/offline cache promised. Reconnect and reload restores sample data.
- [ ] Capture entry, Home, Plans/detail/editor, Groups, Calendar and Profile screenshots with fictional data. Attach to draft PR before declaring visual acceptance.

PWA is deliberately online-only. No service-worker fetch handler, private-response caching, push or offline editing. Automated local asset checks do not establish installation or standalone hosting-auth compatibility.
