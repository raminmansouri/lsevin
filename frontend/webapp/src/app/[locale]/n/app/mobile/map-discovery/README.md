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

## Switchable map providers

This package now supports a switchable map provider for Iran-safe deployments.

Environment variables:

```env
# Default provider used on first render. Supported: mapbox | neshan
NEXT_PUBLIC_MAP_PROVIDER=neshan

# Existing Mapbox support
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# Neshan web map SDK support. NEXT_PUBLIC_NESHAN_API_KEY is also accepted as a fallback.
NEXT_PUBLIC_NESHAN_MAP_KEY=your-neshan-web-map-key

# Optional. Supported: neshanVector | neshanVectorNight | neshanRaster | neshanRasterNight
NEXT_PUBLIC_NESHAN_MAP_TYPE=neshanVector
```

Runtime behavior:

- The map-discovery page shows a small `mapbox / neshan` switch in the header filter row.
- Shared `MapComponent`, `MapPicker`, and `MapViewer` use `NEXT_PUBLIC_MAP_PROVIDER` by default and can also receive a `provider` prop.
- Neshan is loaded through its official CDN SDK, so no new npm dependency is required for this patch.
- If the chosen provider is missing its key, the user sees a safe inline configuration message instead of a broken blank map.
