# Rewards & Loyalty page package

## What is wired to real schema now
- Live active offer-based coupons from `marketing.offers`
- Derived total spending from `booking.bookings` joined to `category.provider_services`
- Tier progress computed from derived spend -> points rule in `rewards.data.ts`

## What the current database does NOT contain
- Loyalty account / points balance tables
- Referral program tables
- Customer coupon assignment / redemption ledger
- Membership tier persistence

Because of that, the page is built in a production-ready structure but runs in **hybrid mode**:
- real offers and spending
- designed loyalty UI
- clear empty states where persistence is not yet possible

## Files
- `page.tsx` server entry
- `RewardsClient.tsx` preserved UI as client component
- `rewards.data.ts` live + derived data adapter
- `loading.tsx` route skeleton
- `rewards.schema.sql` proposed schema additions

## Needed integration
- Replace `resolveCurrentUserId()` with your real auth/session identity lookup.
- If your customer id differs from identity user id, add a user -> customer mapping before spending/referral queries.
