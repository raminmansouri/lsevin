export type FavoriteEntityType = 'provider' | 'service' | 'specialist';

export type FavoriteToggleResult = {
  ok: boolean;
  isFavorite: boolean;
  requiresAuth?: boolean;
  message?: string;
};
