# Admin phase one

- Routes: `/admin` overview, `/admin/users`, `/admin/events`, `/admin/events/:eventId`, `/admin/history` (event reviews only). Purple TicketVerse shell; shared light moderation panels. No SUPER_ADMIN role.
- All admin pages share an ADMIN-only gate. API guards remain authoritative; ADMIN and MODERATOR may review events, but organizer owners cannot review their own events. These roles can inspect private event showings/ticket types without receiving organizer write privileges.
- Overview calls `GET /api/users/admin-summary`. Counts are decimal strings, system-wide at request time, not daily statistics or revenue. REVIEW payments remain visible as aggregate counts only.
- User search/pagination filter the full loaded list locally. New accounts are USER. `PATCH /api/users/:id/role` accepts only USER/MODERATOR with `expectedRole` and a mandatory trimmed reason (1–1000 characters). Self changes, ADMIN targets and suspended accounts are forbidden; stale roles return 409.
- Role updates lock/recheck the actual administrator and target, revoke target sessions, and write `user_role_changes` within the database transaction. Redis failures abort the role update. Access guards read current database roles on each request. Existing accounts are not automatically promoted.
- Apply the additive backend migration `AdminRoleChanges1792454403000` using the existing `npm run db:migrate` workflow. Never enable TypeORM synchronize.
- Private caches clear on auth revision changes; the gate remounts protected content. New role/review actions ignore responses from previous sessions and refresh affected summaries.
- Suggested frontend checks: `node --test tests/admin-experience.test.cjs tests/admin-statistics.test.cjs`. Backend acceptance follows its current `docs/release-checklist.md`; the historical local `scripts/test-admin.cjs` is not included in the curated backend repository.
- Deferred: refunds/manual financial resolution of unresolved REVIEW payments, organizer administration, banners and a general audit-history screen. Check-in and staff invitations are not expanded.

## Statistics

- `/admin` includes date/month trend charts for paid order counts and values, separate original/resale totals, top ten events by original ticket quantities plus resale transfers, and VNPay transaction status distributions split by order kind. Native SVG/CSS charts include exact-value tables and text equivalents; no chart dependency.
- `GET /api/users/admin-statistics` is ADMIN-only. Optional `dateFrom`/`dateTo` are inclusive Vietnam calendar dates, defaulting to the last 30 days. `groupBy=day|month`; maximum interval 366 days. Month buckets include only payments inside the selected dates, not the entire boundary months.
- Paid sales use unique successful payment records with PAID orders, bucketed by `processed_at` in `Asia/Ho_Chi_Minh`. Values include applied discounts and zero-value original orders. Failed/unconfirmed orders do not contribute. **Tổng thu** adds original and resale payment amounts in the selected period using BigInt, before fees, refunds or payouts. It is gross payment volume, not profit, platform fee income or bank settlement. A resold ticket generates another receipt, not a newly issued ticket.
- Missing periods are zero-filled. Totals, series and rankings share a repeatable-read database snapshot. VNPay status charts use transaction creation dates and current statuses, count each attempt, exclude free orders, and do not treat expired PENDING attempts as failures. Status percentages use all attempts of each kind as denominator.
- Filters offer 7/30-day shortcuts or an inclusive custom range and daily/monthly grouping. Requests are scoped to the administrator and session revision; aborted/old queries cannot populate another session.
- The dashboard prioritizes a purple gross-receipts card with separate original/resale breakdowns, paid-order counters and a full-width gross-receipts trend with three series and an accessible exact-value table. Order trends, top events and payment-status distributions follow. All-time system counts and review tasks are separate from date-filtered receipts; no fabricated growth comparisons or profit calculations.

## Payment handling

- The /admin/payments screen, navigation item, frontend API client methods and all backend routes under /api/admin/payments/vnpay have been removed.
- VNPay payment creation, IPN verification, return redirects and owner-only payment recovery are unchanged. REVIEW counts/status charts remain informative; there is no manual mark-paid or refund action.
- Existing payment/audit data and the reconciliation migration remain intact because buyer recovery still needs durable query history and cooldown.
- Suggested frontend checks: `node --test tests/admin-experience.test.cjs tests/admin-statistics.test.cjs tests/vnpay-checkout.test.cjs`. Use the current backend VNPay documentation and release checklist for payment recovery acceptance; historical scripts and `test:purchase` are not included in its current package scripts.
