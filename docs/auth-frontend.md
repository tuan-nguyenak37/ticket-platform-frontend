# Browser JWT authentication

## Credentials and API flow

- Login uses same-origin `POST /api/backend/auth/browser/login`. The backend returns `{user, accessToken, accessTokenExpiresAt}` and sets `ticketverse_refresh`: HttpOnly, SameSite=Lax, Path=/, Secure in production.
- Access JWTs live only in the non-persisted Zustand store. They are never written to localStorage/sessionStorage or included in SSR snapshots. Refresh JWTs remain inaccessible to JavaScript and are never returned in JSON, broadcasts or URLs.
- Private Axios requests use `/api/backend/*` with the current `Authorization: Bearer` access JWT. The Next.js proxy forwards refresh cookies only to the browser-auth allowlist, not to business APIs. It retains Origin checks, body limits, no-store, redirect rejection and VNPay callback blocking.
- `BACKEND_API_URL` optionally overrides the fixed server-only upstream; the default is `http://localhost:7000/api`. Public catalogue requests continue using `NEXT_PUBLIC_API_URL`. Next.js needs no Redis credentials or additional dependencies.

## Single-use refresh

- Access defaults to 15 minutes. The original login fixes the absolute session deadline using `JWT_REFRESH_EXPIRES`, default seven days. Rotation does not prolong it.
- A visible tab checks expiry every 30 seconds and on visibility/network recovery. Requests also check expiry before dispatch. Refresh occurs within 60 seconds of expiry, not on every poll.
- A shared promise coalesces refresh inside a tab. Web Locks serialize cookie changes across tabs where supported. BroadcastChannel carries login/logout events only; each tab obtains its own access JWT without broadcasting credentials.
- Backend Lua atomically replaces the refresh digest. Only one request using a given token can receive new tokens. A stale token for a live session receives `409 AUTH_REFRESH_CONFLICT`, never replacement tokens or cookie deletion.
- Conflicts retry using the browser's current cookie after 100, 300 and 1,000 ms; this also handles browsers without Web Locks. Exhaustion is a temporary error, not logout. There is no grace-period reuse or replay cache containing replacement tokens. If the successful response and replacement cookie are lost, reauthentication may be necessary.
- Only `401 AUTH_ACCESS_EXPIRED` triggers one refresh and one retry of the original API request, preserving Idempotency-Key. Requests already sent with an older access JWT reuse a replacement already obtained by their tab. Unknown 401, 403, network errors, timeouts and 5xx never trigger automatic business-request replay.
- Transient refresh/Redis/rate-limit failures preserve authenticated UI and entered form state. A definitive refresh 401 clears auth/private caches. Token replacement alone does not change the login revision or discard query state. Late results from another login/logout revision are rejected.

## SSR, reload and VNPay

- Root layout reads the refresh cookie and calls read-only `GET /auth/browser/session` with no-store. Backend validates its signature, latest digest and current ACTIVE account; the result contains only public user information and auth status. Cookie presence is not proof of identity.
- SSR never rotates cookies. On hydration, the client silently refreshes to obtain its in-memory access JWT while retaining the verified account UI. Private API calls wait for this bootstrap. An SSR digest conflict selects restoring state, rather than falsely declaring logout.
- SameSite=Lax carries the cookie on a normal top-level GET back from VNPay. Reload restores the profile and obtains a new access JWT, then existing owner-scoped APIs reload the transaction. IPN and verified recovery remain authoritative; return parameters never mark orders paid.
- Logout waits for this tab's cookie-changing work, then revokes the refresh session even when access has expired. Redis failures are surfaced, not reported as successful server logout. Login with an existing browser refresh cookie revokes that previous session so delayed credentials cannot authenticate the previous account.

## Upgrade and operation

- Old `ticketverse_session` opaque cookies no longer authorize requests. Users need one fresh login; no user, order, ticket or payment data is migrated. Login/logout clears the old root cookie. Legacy backend JWT routes remain available to API clients, but are blocked through the browser proxy.
- Production requires HTTPS and an exact allowed frontend Origin in `FRONTEND_URL`. Use consistent development hostnames. Redis is required for authorization and revocation; outages fail closed with 503.
- Refresh rotation is authoritative in Redis, not process memory, so application restarts do not discard valid sessions. Losing Redis session data requires reauthentication.
- Without Web Locks, refresh conflicts are safely bounded, but a delayed cookie response racing a new login can require reauthentication. Revocation and revision checks prevent using the previous account; no guarantee of seamless recovery is made for a lost replacement cookie.
- Configure trusted ingress and per-client rate limiting before production. The application proxy drops untrusted forwarding headers; backend IP limits see the Next.js server as one client. Do not blindly forward browser-supplied X-Forwarded-For.

## Checks

- `npm test` covers SSR/proxy isolation, in-memory JWTs, expiry, one-shot retries, concurrent refresh, conflict fallback without Web Locks, cross-tab locking, logout/account races and unchanged VNPay recovery behavior.
- Run `npx next typegen` before `npm run typecheck` to generate route types from a clean checkout. Backend acceptance follows its current `docs/release-checklist.md`; legacy local scripts are not part of the curated backend repository.
- Browser acceptance: fresh login, F5 on checkout/account, keep multiple tabs open, lose/recover network, expire access and return from VNPay. Automated fixtures are not a substitute for an actual provider payment test.
