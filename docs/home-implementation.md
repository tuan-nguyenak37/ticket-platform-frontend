# Home implementation

- Entry: app/page.tsx. Home-specific components and public API helpers live in app/_components and app/_lib.
- Promotional carousel uses three local Unsplash photographs. Sources are recorded in public/images/banners/CREDITS.md; banners do not represent bookable events.
- Categories and event discovery call the real /v1/events API, using the configured API base URL. No synthetic event cards or sales rankings.
- Search, category selection and pagination use /events URL parameters.
- Card links use the eventId returned by the backend. The existing [slug] route segment is used as an ID, not an unsupported slug lookup.
- Event detail reads public showings and ticket types; each ticket purchase creates an order and navigates to VNPay Sandbox checkout. Dates use Asia/Ho_Chi_Minh; amounts come from the backend.
- Loading, empty, error and poster-failure states are separate. Public queries do not attach a bearer token or import management services.
- Banner images can be replaced independently from event data.

## Customer UI refresh (2026-10-20)

- Ticketbox-inspired layout, not a branded clone: TicketVerse purple header, dark surfaces, shared controls and typography across home, event detail, checkout and account. No new dependencies.
- Home uses two manual promotional banners on desktop, one on mobile, and real event cards. Up to two category collections reuse the public list API; empty collections are hidden. Banner controls do not auto-rotate.
- Public event lists include `nextShowingAt` (earliest future showing) and `minPrice` (lowest ACTIVE ticket-type price across future showings). One grouped query enriches each page without per-card requests. Price is a bigint string, zero means free and null means not announced. This is the published starting price, not a guarantee of stock or an open sale window; availability is checked on the event page and purchase API.
- Detail uses a split event ticket/poster header, introduction/ticket anchors, native exclusive showing disclosures and expandable ticket forms. Registration, discount validation, authentication and purchase idempotency stay in the existing purchase flow.
- Checkout has one page heading, a three-step indicator, recipient and VNPay panels, and a sticky desktop order summary (above the form on mobile). It intentionally omits the account-management tab strip.
- Resale catalogue (`/pass`) and listing detail reuse the public shell without account-management tabs. Ticket-style cards show real dates, venues, original prices and resale prices. A native GET form preserves search, event, date range and price range in the URL, including pagination; filtering and totals run on the API before pagination. Event options come from eligible listings (`/v1/resale/events`), not the first page of events. Dates are inclusive Vietnam calendar dates; bigint price bounds and reversed ranges are validated. Listing detail keeps its sticky purchase panel, authenticated reservation, seller restrictions and cancellation confirmation. VNPay is Sandbox, not a live payout service.
- Account profile, tickets, original orders and resale history share a responsive sidebar (horizontal navigation on mobile), purple panels and actual server data. Profile reuses the site header/footer and one page heading, with a summary, personal-information form and password section. Email stays read-only; name/phone validation, undo, unsaved-change warning and reauthentication after password change are preserved. Private queries remain user-scoped and auth revision changes remount content. QR, checkout and listing-management actions keep their existing routes and authorization.
- Totals, discounts, expiry and payment status remain server-authoritative. Customer-facing VNPay copy uses neutral payment instructions without environment badges; this is a copy change only, not a switch to live payment processing. The configured Sandbox gateway, approved payment-host checks, free orders, pending confirmation, review and expired/closed states are preserved. No card or bank OTP fields are collected on TicketVerse. Resale transfer status still does not confirm a seller payout. The inactive legacy checkout keeps its own simulated-payment warnings.
- Check: `node --test tests/customer-experience.test.cjs tests/event-purchase.test.cjs tests/vnpay-checkout.test.cjs tests/purchase-auth.test.cjs`.
- Resale/account checks: `node --test tests/resale-experience.test.cjs tests/account-experience.test.cjs tests/profile-experience.test.cjs`.
- Backend integration acceptance follows its current `docs/release-checklist.md`. The historical local `scripts/test-event-operations.cjs` is not part of the curated backend repository; do not depend on it from a clean checkout.
