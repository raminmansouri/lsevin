export type FavoriteEntityType = "provider" | "service" | "specialist";
export type FavoritesTabId = "all" | "clinic" | "doctor" | "salon" | "gym";

export interface FavoriteCard {
  favoriteId: string;
  entityId: string;
  favoriteType: FavoriteEntityType;
  tabId: Exclude<FavoritesTabId, "all">;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  image: string;
  specialty?: string | null;
  providerTypeLabel?: string | null;
  createdAt: string;
}

export interface FavoriteTab {
  id: FavoritesTabId;
  label: string;
  count: number;
}

export interface FavoritesPageData {
  favorites: FavoriteCard[];
  tabs: FavoriteTab[];
}

export type RemoveFavoriteResult =
  | {
      ok: true;
      favoriteId: string;
      message?: string;
    }
  | {
      ok: false;
      favoriteId: string;
      message: string;
    };
