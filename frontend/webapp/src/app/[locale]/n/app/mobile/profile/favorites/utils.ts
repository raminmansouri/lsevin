import type { FavoriteCard, FavoriteEntityType, FavoritesPageData, FavoritesTabId } from "./types";

export function buildFavoriteTabs(favorites: FavoriteCard[]): FavoritesPageData["tabs"] {
  const counts: Record<FavoritesTabId, number> = {
    all: favorites.length,
    clinic: 0,
    doctor: 0,
    salon: 0,
    gym: 0,
  };

  for (const favorite of favorites) {
    counts[favorite.tabId] += 1;
  }

  return [
    { id: "all", label: "All", count: counts.all },
    { id: "clinic", label: "Clinics", count: counts.clinic },
    { id: "doctor", label: "Doctors", count: counts.doctor },
    { id: "salon", label: "Salons", count: counts.salon },
    { id: "gym", label: "Gyms", count: counts.gym },
  ];
}

export function resolveFavoriteHref(favoriteType: FavoriteEntityType, entityId: string) {
  switch (favoriteType) {
    case "service":
      return `/n/app/mobile/service/${entityId}`;
    case "specialist":
      return `/n/app/mobile/specialist/${entityId}`;
    case "provider":
    default:
      return `/n/app/mobile/provider/${entityId}`;
  }
}

export function clampRating(rating: number) {
  if (!Number.isFinite(rating)) return 0;
  return Math.max(0, Math.min(5, rating));
}

export function normalizeImageUrl(image: string | null | undefined) {
  const trimmed = image?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "/images/placeholders/provider.png";
}
