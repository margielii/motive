# MOTIVE foundation — work in progress

Verdict: BLOCKED. This is the unmodified Sites starter plus isolated guest-grant primitives, not a functional MOTIVE app or deployable security solution.

Completed locally: Sites Vinext/React/TypeScript starter installed and built; two Node tests pass for 256-bit random tokens, hashing, plan/action scope, expiry and revocation predicates. The build proves only that the starter compiles. The isolated functions are not connected to any route, storage, session or PWA and establish no end-to-end security.

The separate MOTIVE Site has been created, remains unpublished, and its ID is in the local manifest. A separate GitHub repository has not been created: the available GitHub connector does not expose repository creation, and the shell lacks gh and GitHub credentials. No PR exists. No hosted storage, uploads, accounts, guest links, iPhone installation, access-control boundary, archive compatibility or deployment persistence has been verified.

Local storage: DB and BUCKET declared. Drizzle generated a synthetic test migration; build passed. Wrangler local D1 applied that migration and a synthetic row was inserted and read in separate processes. Local R2 stored and retrieved a synthetic object byte-for-byte. These are emulator checks, not hosted persistence or upload authorization tests.

Next work: obtain a separate private GitHub repository; implement and test D1, R2, identity, invitation, sessions, guest grants and fail-closed route authorization; create PR. A public deployment requires separate explicit publication approval and is necessary to verify guest access and persistence across deployments. Physical iPhone installation requires a real iPhone test.

Security acceptance: verified invite redemption and no bypass; secure password/session and recovery lifecycle; rate limiting and enumeration resistance; CSRF protection where applicable; default-deny API routes including alternate HTTP methods; tenant/object authorization; grant expiration/revocation and cross-plan denial; 2 MiB limit enforced on actual bytes, image signatures and safe content types; authenticated image reads; no token leakage in referrers or logs; cache isolation; hosted negative tests. Use test data, never Orbit resources.

Costs: Sites hosting is currently included with the existing Plus subscription subject to shared quotas; exact account capacity, external identity costs and any email delivery limits remain unverified. No C$0 end-to-end claim yet.
