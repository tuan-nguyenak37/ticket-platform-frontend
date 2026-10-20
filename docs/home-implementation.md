# Home implementation

- Entry: app/page.tsx. Home-specific components and public API helpers live in app/_components and app/_lib.
- Promotional carousel uses three local Unsplash photographs. Sources are recorded in public/images/banners/CREDITS.md; banners do not represent bookable events.
- Categories and event discovery call the real /v1/events API, using the configured API base URL. No synthetic event cards or sales rankings.
- Search, category selection and pagination use /events URL parameters.
- Card links use the eventId returned by the backend. The existing [slug] route segment is used as an ID, not an unsupported slug lookup.
- Event detail reads public showings and ticket types; it does not implement checkout. Dates are displayed in Asia/Ho_Chi_Minh and prices are validated as safe integers before formatting.
- Loading, empty, error and poster-failure states are separate. Public queries do not attach a bearer token or import management services.
- Banner images can be replaced independently from event data.
