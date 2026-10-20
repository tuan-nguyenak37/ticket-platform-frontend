# Organizer OWNER frontend

## Implementation

Entry: `/organizer`. Select an owned organizer, manage its events, then open a showing to manage ticket types. Creation and editing use dialogs rather than redundant standalone form routes. The existing TicketVerse tokens and light management theme are reused.

Only backend v1 APIs are used. Organizer membership, not account role, controls the available UI; the backend remains authoritative for permissions. Event and Showing parent relationships are checked before exposing child actions.

- Organizer: name, description, contactEmail.
- Event: title, category, description, poster URL; submit requires a draft with a description.
- Showing: name, start/end, venue, address, city. Writes are blocked during review. Changes to published/rejected events can reset the event to draft; the UI warns and refetches.
- TicketType: creation uses name, description, integer price and totalQuantity. Backend creates DRAFT with null sale times, maxPerOrder=4 and resaleAllowed=false. Configuration is a subsequent PATCH.
- TicketType writes do not reset Event status in the inspected backend. Reservations/sales allow only quantity increases. Backend inventory is never computed optimistically.
- Times are explicitly Vietnam +07:00, regardless of browser timezone. Prices accept only safe nonnegative integer VND.

Query keys include user ID and session revision. The workspace remounts on session/route changes, GET requests consume cancellation signals, and the existing session provider clears the query cache. Mutations check the session revision and invalidate the account-scoped Organizer queries, including inactive detail/list entries. Existing auth implementation is unchanged.

## Verification status

Implemented, not end-to-end accepted: no authenticated OWNER browser session has been provided or used to verify real API writes and reloads. Do not label these workflows complete until that validation succeeds.

Executed: Organizer ESLint; isolated TypeScript check excluding stale `.next/dev` route types; `node --test tests/organizer.test.cjs` for VND and Vietnam timezone helpers.

The normal typecheck currently encounters stale `.next/dev/types/validator.ts` imports referencing removed root `app` routes. No unrelated files were deleted to hide that issue.

## Acceptance checklist using permitted test data

1. Log in; create Organizer, reload and verify name/email. Change profile and reload.
2. Create Event, change category/description/poster, reload and submit; verify PENDING_REVIEW locks Event/Showing writes.
3. Create/edit/delete Showings; verify published/rejected Event becomes DRAFT after a Showing change, fetching Event from backend.
4. Create TicketType with total quantity 1; edit maxPerOrder to 1 and set future sale window, price, resale policy and status; reload each change.
5. Confirm backend rejects deletion of referenced Showings and configuration changes after reservations/sales; increasing total remains possible.
6. Log out or switch accounts with requests in flight: no previous Organizer data or open form survives. Open foreign or mismatched resource URLs and check access messages.
7. Check mobile, keyboard navigation, dialog focus, error/retry and form preservation on network failures.

No backend files, migrations, dashboards, reports or resale transactions are included.

