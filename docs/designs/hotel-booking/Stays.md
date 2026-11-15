# Stays: hotels and اقامتگاه

Implementation guide for the stays platform (`/[locale]/stays`, admin `/[locale]/admin/stays`). Requirements and competitor research: `README.md`, `01`–`05` in this folder (kept in the main checkout). Requirement ids (H01–H17, A01–A13) refer to `03-customer-requirements.md` and `04-admin-pages.md`.

## Decisions taken (defaults; change them here if the business decides otherwise)

| Open decision (05-delivery-plan.md) | Default implemented |
|---|---|
| Supply model | Directly contracted properties owned by an existing service provider. No external supplier feed yet. |
| Hotels vs entire places | Both. `inventory_model = rooms` (room types with N units) or `entire_place` (exactly one unit). |
| Instant vs request | Per property. Request: nothing is charged until the host accepts; then a payment window (4× the normal window) opens. Unanswered requests expire after `request_timeout_hours`. |
| Currency | Property currency, IRR by default, numeric(18,2). Display converts per visitor as an approximation only; the charge currency is always shown. |
| Taxes / fees | `tax_percent` per property (mandatory taxes and fees) and `service_fee_percent` in settings, both included in every total shown with dates. |
| Address privacy | `location_privacy = approximate`: coordinates snapped to ~1 km, address and phone hidden until the booking is confirmed. |
| Guest documents | Only the main guest name per room and contact details. No identity documents are stored. |
| Seed data | Real cities only (8, four with licensed photos). No invented hotels: admins create stays or import existing accommodation providers as drafts. |

## Architecture

Same pattern as tours (`docs/designs/tours`):

- Each property owns an **inactive** `category.provider_services` row (the booking anchor), so `booking.bookings`, `booking.payments`, `/api/booking-pro/payments/*`, gateway callbacks, refunds and accounting are reused unchanged. Anchors are inactive, so the generic catalog and the booking-pro wizard never sell them.
- Everything stay-specific is in schema `stay` (migration `0108_stays_platform.sql`); FAQ seed in `0109_stays_faq_seed.sql`.
- Inventory: `stay.inventory` holds one row per room type and night (created lazily). A stay occupies nights `[check_in, check_out)`. `stay.place_hold` locks every night in date order (no deadlocks), checks stop-sell, closed-to-arrival, minimum nights and free units, then increments `held` for all nights or fails for all. `convert_hold`, `release_hold`, `expire_holds`, `close_booking` and `set_inventory` keep `sold`/`held` exact. Rate plans of a room type share its units.
- Legacy hotels sold through booking-pro (`provider_portal.hotel_date_availability`) block an imported entire-place property for those nights.
- Quotes: `src/features/stays/domain/pricing.ts`, in minor units: nightly price (or dated override) × rooms, extra adults/children beyond the included guests (infants free; children under the property's free age free), long-stay discount, tax, service fee. Search cards and the checkout use the same function.
- Checkout: `server/booking.ts`. Hold → details → consent → confirm (idempotency key; re-quotes and refuses a changed price or policy) → payment through the platform engine → `reconcileStayBooking` on every visit of the booking page. `server/sweeper.ts` (every 60 s, advisory lock, `STAYS_SWEEPER=off` disables) expires holds, unpaid bookings and unanswered requests, and marks finished stays completed (which enables reviews).
- Errors: database-raised codes map to validation/conflict/not_found; outages map to `infrastructure` (`server/errors.ts`). A database outage is never shown as invalid input.

## Customer pages

| Route | Purpose | Index |
|---|---|---|
| `/stays/intro` | First-visit introduction; crawlable content + destination links + FAQ | yes (fa, en) |
| `/stays` | Home: search, recently viewed, destinations, featured, medical travel | yes; first visit redirects to the intro |
| `/stays/city/[slug]` | Destination landing page ("hotels in Shiraz") with ItemList JSON-LD | yes when it has published stays; dated/filtered variants noindex |
| `/stays/explore?…` | Search results; the URL is the state | noindex, follow |
| `/stays/p/[slug]` | Stay page with rooms priced for the dates/party in the URL; Hotel / LodgingBusiness JSON-LD | yes, in the languages its name exists in |
| `/stays/p/[slug]/book` | Checkout | noindex |
| `/stays/bookings`, `/stays/bookings/[id]` | Trips, voucher, payment, cancellation with refund preview, review | noindex; owner only (others get 404) |
| `/stays/wishlist` | Saved stays | noindex |

Languages: Persian and English strings are complete (`messages/stays/app`), and Arabic falls back to English for the UI. Content (names, descriptions) is stored per language (`fa-IR`, `en-US`, `ar-SA`).

## Admin guide (short)

Admin → **Hotels and stays** (`/fa/admin/stays`). Work in this order:

1. **Settings**: hold minutes, payment window, default host answer time, service fee, longest stay, rooms per booking, booking window.
2. **Destinations**: slug, name per language, introduction (shown on the city page, good for SEO), cover photo with description and credit. A destination appears to customers only once it has a published stay. A destination with stays cannot be deleted.
3. **Hotels and stays**:
   - **New stay**: pick the provider (owner), destination, address (slug), type and sales model.
   - **Import an existing hotel**: creates a draft from a provider already on Lsevin (name, description, address, photos, nightly rooms). Review it before publishing.
   - **Editor tabs**:
     - *Details*: texts per language, location and privacy, check-in/out, rules, amenities, accessibility (mark it checked only after verifying), confirmation mode, tax, phone.
     - *Rooms and rates*: room types with units and capacity; rates with meals, refundable or not, prices, minimum/maximum nights and long-stay discount.
     - *Availability and prices*: grid per room type; bulk change of units, stop-sell, no-arrival and minimum nights for a date range; dated prices, optionally on chosen weekdays.
     - *Photos*: add, cover, reorder, remove. A published stay keeps at least one photo.
     - *Cancellation policy*: saving creates a new version, and existing bookings keep theirs.
     - *History*: the audit log.
   - **Publish** is enabled only when "Before publishing" is empty. **Pause** hides the stay with a reason; **Archive** is permanent. Existing bookings stay valid in both cases.
4. **Bookings**:
   - Answer requests (accept / decline with a reason).
   - Cancel with or without operator fault (fault = full refund).
   - Reveal contact details only with a written reason. Every reveal is logged.
   - Refund requests go to finance through the platform refunds workflow.
5. **Reviews**: publish, hide or reject. A guest's words and score are never edited. Only published reviews count in the rating.

Rows that bookings reference are never hard-deleted. Use the inactive / pause options.

## Tests

| Layer | Where | Command |
|---|---|---|
| Unit | `src/features/stays/domain/domain.test.ts` | `npx vitest run src/features/stays/domain` |
| Integration (real Postgres) | `src/features/stays/server/stays.integration.test.ts` | `STAYS_TEST_DATABASE_URL=… ACCOUNTING_TEST_DATABASE_URL=… npx vitest run src/features/stays` |
| E2E (Playwright) | `e2e/stays/*.spec.ts`, config `playwright.stays.config.ts` | `STAYS_E2E_BASE_URL=http://127.0.0.2:3045 STAYS_E2E_DATABASE_URL=… npx playwright test --config playwright.stays.config.ts` |

The test databases must be migrated with `scripts/migrate.mjs` from a production-like state (not a fresh database). Migration files must have LF line endings, or the checksums will not match production's.

## Deployment

- Migrations `0108_stays_platform.sql` and `0109_stays_faq_seed.sql` run with the normal deploy. Run them on **both sites**: `stay.*` is not registered in SymmetricDS, so each site holds its own stays data. Replicated `category.*` rows (the booking anchors) are created per site. The sequence alignment (0088) covers `stay.audit_log`.
- No new environment variables. Set `STAYS_SWEEPER=off` only on instances that must not run background work.
- Entry point: nothing in the main app links to `/stays` yet. Once real stays are published, link it from the home/categories (or route the accommodation category to `/stays`, as tourism routes to `/tours`). Doing that earlier would hide today's bookable hotels behind an empty catalog.

## Not built yet (next iterations)

- Provider self-service (the provider-portal pages in `04-admin-pages.md`). Today admins manage stays on providers' behalf.
- Booking messages between guest and host; promotions/coupons beyond the long-stay discount; installments; external supplier sync; map clustering on the results page.
- SymmetricDS registration of `stay.*`, if the two sites should share one stays catalog.
