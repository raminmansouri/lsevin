/** Shared by the map / list screen and its filter panel. */

// Distance filter bounds (km). The slider runs from MIN to MAX; the far end (MAX)
// means "unlimited" — see UNLIMITED_DISTANCE_KM on the server, which drops the
// radius cap at that value. Keep these aligned with nearby.data.ts.
export const MIN_DISTANCE_KM = 1;
export const MAX_DISTANCE_KM = 100;
export const DEFAULT_DISTANCE_KM = 20;
export const isUnlimitedDistance = (km: number) => km >= MAX_DISTANCE_KM;

export function languageLabel(value: string, locale: string): string {
  const normalized = value.trim();
  if (!normalized) return value;

  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "language" });
    return (
      displayNames.of(normalized.split("-")[0].toLowerCase()) ||
      normalized.toUpperCase()
    );
  } catch {
    return normalized.toUpperCase();
  }
}
