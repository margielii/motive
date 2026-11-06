# MOTIVE operator reference

This is a local review runbook. Hosted database writes, deployment and access-policy changes require explicit user approval. Always verify the target belongs to MOTIVE; never use Orbit bindings or credentials.

## Supported one-time bootstrap

Use [FOUNDATION_INFRASTRUCTURE.md](FOUNDATION_INFRASTRUCTURE.md) for supported deployment/secret configuration, the one-time bootstrap request, diagnostic interpretation and staging isolation gates. Initial bootstrap no longer assumes arbitrary hosted SQL access: the available Sites D1 tools are read-only. A short-lived native runtime permit authorizes one atomic administrator/first-invitation initialization, permanently recorded in D1 and checked against an R2 installation marker. All private app routes require matching configured installation markers.

The offline `scripts/prepare-foundation.mjs` helper prepares the target/permit but performs no network or database operation. No values have been configured and no hosted bootstrap has run. Hosted configuration, provisioning, deployment and initialization each need the explicit approval described in that runbook. The older `prepare-invitation.mjs` SQL generator remains for local/operator reference only; it is not the supported hosted initialization mechanism.

## Recovery / restriction

Verify the account owner through an established independent channel before issuing recovery. Knowledge of an email address or membership in a group is insufficient. An administrator requests `POST /api/admin/recovery` with the verified email and shares the returned one-hour code privately. Earlier recovery codes are invalidated. The recipient uses the recovery form with email, code and a new password, then signs in again. Password reset invalidates all account sessions and recovery codes. If all admins are locked out, stop and establish a separately reviewed supported operator recovery mechanism. The available Sites D1 tools are read-only; do not assume arbitrary hosted SQL access, add a public bypass/default password, or reset the installation ledger.

`POST /api/admin/restrict` with `{ "id": "account-id", "status": "disabled" }` disables the account and deletes its sessions. `active` reenables it without restoring old sessions. Administrators cannot restrict their own account through this route. Restricted accounts cannot log in or redeem recovery codes.

Guest capabilities are separate from account identity. Disabling an account does not revoke guest links it previously received; revoke the relevant plan grants separately. Share guest codes only with intended recipients. Redemption is single-use, but the resulting guest session remains reusable for authorized reads until logout, expiry or grant revocation. A copied session cookie remains a bearer credential until invalidated.

## Permission and file API

| Route | Permission / behavior |
| --- | --- |
| `GET/POST /api/groups` | Active account; list own memberships or create owned group |
| `POST/DELETE /api/groups/:id/members` | Group owner, `{ "accountId": "..." }`; removal drops target plan memberships in that group |
| `GET/POST /api/plans` | Active account; list explicit memberships; creation requires group owner and `{ "groupId": "...", "title": "..." }` |
| `GET /api/plans/:id` | Explicit plan membership or valid scoped guest session |
| `POST /api/plans/:id/members` | Plan owner; active group member target; `{ "accountId": "...", "role": "viewer" }` or `editor` |
| `POST /api/plans/:id/guests` | Plan owner; returns code, hash and expiry; share code and plan ID privately |
| `DELETE /api/plans/:id/guests` | Plan owner; `{ "hash": "..." }` revokes grant and all derived access immediately on next request |
| `POST /api/guest/redeem` | Same-origin request with `{ "token": "..." }`, single-use code → guest cookie |
| `GET/POST /api/plans/:id/images` | Read permission for list; editor/owner for raw image upload with image/png or image/jpeg Content-Type |
| `GET/DELETE /api/images/:id` | Scoped read; deletion requires current write permission plus creator or plan-owner authority |
| `POST /api/auth/logout` | Deletes supplied account and guest sessions, clears both cookies |

The foundation shell exposes account, group/plan creation, uploads/downloads and admin code issuance. Membership changes, restrictions and guest administration also have the server APIs above; a full administration UI is outside this foundation. Use a same-origin authenticated client and avoid putting secrets in command-line arguments.

## Local verification

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:production`, then `npm run check:package`. Production tests require a fresh build. Tests use isolated temporary Miniflare D1/R2 directories and delete them on completion. All tests are local and do not deploy or read/write hosted resources. See FOUNDATION_STATUS.md for hosted/iPhone release gates and the cost assessment.
