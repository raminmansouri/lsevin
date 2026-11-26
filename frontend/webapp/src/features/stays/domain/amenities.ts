/**
 * Amenity sections (stay.amenities.grp) in display order, and the rules shared by the admin
 * editors and the guest pages. Dependency-free: imported by server and client code.
 */
export const AMENITY_GROUPS = ["general", "room", "bathroom", "food", "wellness", "family", "accessibility", "medical", "business", "outdoor"] as const;
export type AmenityGroup = (typeof AMENITY_GROUPS)[number];

/** Sections a room type can have; hotel-wide ones (lobby, pool, restaurant...) belong to the hotel. */
export const ROOM_AMENITY_GROUPS: readonly AmenityGroup[] = ["room", "bathroom", "accessibility"];

export function isAmenityGroup(value: unknown): value is AmenityGroup {
  return typeof value === "string" && (AMENITY_GROUPS as readonly string[]).includes(value);
}

/**
 * An amenity with options (e.g. "Cooling system" → "Split AC") is stored as the parent plus the
 * chosen option. Guests see the option alone: its label already says what it is, and showing the
 * parent next to it would repeat it.
 */
export function withoutChosenParents<T extends { code: string; parentCode?: string | null }>(items: T[]): T[] {
  const chosen = new Set(items.map((i) => i.parentCode).filter((p): p is string => !!p));
  return items.filter((i) => !chosen.has(i.code));
}

/** A readable, unique-enough catalogue code from a label ("Rooftop pool" → "rooftop_pool"). */
export function amenityCodeFrom(label: string): string {
  const base = label
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
  // A label with no Latin letters (Persian only) or starting with a digit gets a neutral prefix;
  // the server adds a suffix when the code is taken.
  if (/^[a-z][a-z0-9_]{1,31}$/.test(base)) return base;
  const tail = base.replace(/^[^a-z]+/, "");
  return tail.length >= 2 ? `amenity_${tail}`.slice(0, 32) : "amenity";
}
