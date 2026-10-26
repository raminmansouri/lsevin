/** Route base of the Tours administration panel (plain module: safe in server and client components). */
export const TOURS_PLATFORM_BASE = "/admin/tours-platform";

export const TOUR_EDITOR_TABS = ["overview", "content", "media", "itinerary", "pricing", "policy", "schedule", "history"] as const;
export type TourEditorTab = (typeof TOUR_EDITOR_TABS)[number];
