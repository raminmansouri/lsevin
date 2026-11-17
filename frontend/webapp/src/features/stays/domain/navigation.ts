/** Sections of the stays app; any other first segment is a stay's own page (/stays/<slug>). */
export const STAY_SECTIONS = new Set(["explore", "city", "wishlist", "bookings", "intro"]);

/**
 * Where the header's back arrow goes: one level up inside stays, never out of the
 * app by surprise. From a stay it returns to the exact search the guest came
 * from (filters and place included), remembered by the explore page. Null on
 * the stays home, where the arrow leads back to Lsevin.
 */
export function parentPathOf(pathname: string, lastExplore: string | null): string | null {
  if (pathname === "/stays") return null;
  const [, , section, sub] = pathname.split("/");
  if (section === "bookings" && sub) return "/stays/bookings";
  if (section && STAY_SECTIONS.has(section)) return "/stays";
  return lastExplore && lastExplore.startsWith("/stays/") && !lastExplore.startsWith("//") ? lastExplore : "/stays/explore";
}
