# Explore rewrite with same approved UI

This version keeps the approved prototype layout and card structure, and only changes the internals.

## Files

- `page.tsx` — server wrapper that reads search params and fetches data
- `ExploreClient.tsx` — the approved UI, preserved as the interactive client component
- `explore.data.ts` — postgres.js queries and filter parsing
- `explore.actions.ts` — server action for favorites
- `explore-location.actions.ts` — server actions for lazy country/city selector options
- `LazySearchableSelect.tsx` — reusable lazy loaded searchable single-select UI
- `FavoriteButton.tsx` — favorite toggle button

## What stayed the same

- section order
- card layout
- filter sheet layout
- styling approach
- icon usage
- top header/search/filter/category strip
- featured/sponsored/trending sections

## What changed underneath

- `react-router` navigation was replaced with `next/navigation`
- static arrays were replaced with postgres.js queries
- filters now drive real SQL conditions
- country/city filters use lazy searchable selectors and provider location codes from `category.service_providers`
- language filters use `category.provider_languages` and provider language arrays
- favorites use `customer.favorites`
- search uses provider/service `search_vector` plus translated name fallback
- the bottom browse grid now shows provider types from `category.provider_types`
- the previous bottom category grid is still kept in `ExploreClient.tsx` as a JSX comment for rollback

## Fixes in this build

- Bottom provider-type `View All` now expands/collapses the provider-type grid instead of clearing the selected provider type filter.
- Provider type query no longer limits the data to 8 rows, so `View All` can reveal all active provider types.
- Featured, trending, and sponsored rows are deduped by `id` before rendering.
- Location joins now use `left join lateral ... limit 1` to prevent duplicated provider rows when `category.locations` has repeated codes.
- React keys are namespaced to avoid collisions between sections.

## Additions in this build

- Added country then city selection inside Advanced Filters.
- Country selector is lazy loaded and searchable; it only fetches options when opened or searched.
- City selector is lazy loaded and searchable; it stays disabled until a country is selected and clears itself when country changes.
- Added `explore-location.actions.ts` for location option lookups without coupling the UI to the main explore query.
- Added `LazySearchableSelect.tsx` as a small reusable selector for this page.
- Existing category/provider-type filtering and old commented category grid were preserved.

## Important integration notes

1. Update `@/config/database/db` import if your postgres singleton lives elsewhere.
2. Replace `resolveCurrentCustomerId()` in `explore.data.ts` with your real auth/session logic.
3. This package assumes routes like:
   - `/app/mobile/explore` or your localized equivalent
   - `/app/search`
   - `/app/map`
   - `/app/clinic/[id]`
   - `/app/treatment/[id]`
   - `/app/clinics`
4. The search button visually stays the same. It routes to `/app/search` while preserving current filter query params.
5. Provider type images use `image_url`, then media library `file_url` when `image_url` stores a media id, then `icon_url`, then `/placeholder.svg`.
