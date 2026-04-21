# Explore rewrite with same approved UI

This version keeps the approved prototype layout and card structure, and only changes the internals.

## Files

- `Explore.tsx` — server wrapper that reads search params and fetches data
- `ExploreClient.tsx` — the approved UI, preserved as the interactive client component
- `explore.data.ts` — postgres.js queries and filter parsing
- `explore.actions.ts` — server action for favorites
- `FavoriteButton.tsx` — favorite toggle button

## What stayed the same

- section order
- card layout
- filter sheet layout
- styling approach
- icon usage
- top header/search/filter/category strip
- featured/sponsored/trending/category sections

## What changed underneath

- `react-router` navigation was replaced with `next/navigation`
- static arrays were replaced with postgres.js queries
- filters now drive real SQL conditions
- language filters use `category.provider_languages` and provider language arrays
- favorites use `customer.favorites`
- search uses provider/service `search_vector` plus translated name fallback

## Important integration notes

1. Update `@/lib/postgres` import if your postgres singleton lives elsewhere.
2. Replace `resolveCurrentCustomerId()` in `explore.data.ts` with your real auth/session logic.
3. This package assumes routes like:
   - `/app/explore`
   - `/app/search`
   - `/app/map`
   - `/app/clinic/[id]`
   - `/app/treatment/[id]`
   - `/app/categories`
4. The search button visually stays the same. It routes to `/app/search` while preserving current filter query params.
5. Category tiles were kept visually similar, but because the schema does not provide a guaranteed image per category in the prototype format, they use gradient backgrounds instead of introducing fake assets.
