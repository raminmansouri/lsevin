# Explore Nearby / Map Discovery package

Files:
- `page.tsx` server entry
- `nearby.data.ts` postgres.js queries + filters
- `NearbyClient.tsx` accepted UI pattern wired to real data
- `NearbyMap.tsx` live Mapbox map using `react-map-gl`
- `loading.tsx` route skeleton

## Required setup

1. Set `NEXT_PUBLIC_MAPBOX_TOKEN`
2. Copy `FavoriteButton.tsx` from your Explore package into the same folder or update the import path.
3. Replace `resolveCurrentCustomerId()` with your real auth lookup.
4. Route path in this package is built for `/n/app/mobile/map-discovery`.

## Notes

- Providers with null latitude/longitude are excluded from map results.
- Distance filtering uses a Haversine formula because the schema shown does not include PostGIS.
- Browser location is optional. Without `lat/lng`, the page still works and falls back to provider city/country labels.

## Country/city map filters

This package now adds country-first, city-second filtering for the map discovery page.

- `countryCode` and `cityCode` are parsed from URL query params and preserved in route navigation.
- Country and city selectors are lazy-loaded and searchable through the existing `AsyncSearchableSingleSelect` component from `@/components/admin/forms/extensions/async-searchable-single-select`.
- `location-options.actions.ts` loads only countries/cities that currently have active providers with map coordinates.
- City selection is disabled until a country is selected and is cleared automatically when the country changes.
