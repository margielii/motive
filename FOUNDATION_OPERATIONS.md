# MOTIVE operator reference

This is a local review runbook. Hosted database writes, deployment and access-policy changes require explicit user approval. Always verify the target belongs to MOTIVE; never use Orbit bindings or credentials.

## Bootstrap without a public bypass

1. Apply the tracked schema migrations to the intended local emulator. No data seed or administrator password is included in migrations.
2. In a private terminal, run `node scripts/prepare-invitation.mjs verified-recipient@example.com`. This offline helper prints a random code and SQL containing only its digest, verified email and 24-hour expiry. It does not connect to a database. Review and execute the SQL only against the intended MOTIVE database. Keep the raw code out of shell history, logs, screenshots, Git and PR comments; share over an existing trusted private channel.
3. Have the recipient register through the invitation form. The invitation grants an account only, with no group/plan membership or administrator privilege.
4. For the first verified operator only, use trusted database access to set `admin=1` on that exact account after verifying its ID/email. There is no HTTP route to promote an administrator. Hosted promotion is a consequential action requiring separate approval. Operators should keep a second verified administrator available before relying on the service.
5. Administrators issue subsequent invitations in the app or through `POST /api/admin/invitations` with JSON `{ "email": "verified-recipient@example.com" }`. The session cookie and exact same-origin Origin header are required for all mutations. Codes are returned once and stored only as hashes. Revoke an unused invitation through trusted operator SQL (`used=1` for its hash).

## Recovery / restriction

Verify the account owner through an established independent channel before issuing recovery. Knowledge of an email address or membership in a group is insufficient. An administrator requests `POST /api/admin/recovery` with the verified email and shares the returned one-hour code privately. Earlier recovery codes are invalidated. The recipient uses the recovery form with email, code and a new password, then signs in again. Password reset invalidates all account sessions and recovery codes. If all admins are locked out, use the trusted operator database path to insert an expiring hashed recovery code for the verified active account; never add a public bypass or default password.

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
