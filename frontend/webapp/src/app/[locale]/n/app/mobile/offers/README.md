# Special Offers production package

Files:
- `page.tsx`
- `OffersClient.tsx`
- `offers.data.ts`
- `loading.tsx`

Notes:
- Keeps the approved prototype UI and replaces mock data with `marketing.offers` joined to provider services/providers/categories.
- Search and filters are URL-driven and server-backed.
- Card click goes to `/app/treatment/[providerServiceId]`.
- Book Now goes to `/app/booking/[providerServiceId]`.
- Requires your existing `@/config/database/db` postgres.js setup.
