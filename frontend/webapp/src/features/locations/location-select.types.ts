export type LazyOption = {
  value: string;
  label: string;
  description?: string | null;
};

export type LazyOptionsResult = {
  items: LazyOption[];
  hasMore: boolean;
};

/** Mirrors category."LocationType": 1 = Country, 2 = City, 3 = Province. */
export type LocationTypeId = 1 | 2 | 3;

export const LOCATION_TYPE_COUNTRY = 1;
export const LOCATION_TYPE_CITY = 2;
export const LOCATION_TYPE_PROVINCE = 3;

export type SearchLocationsInput = {
  locationTypeId: LocationTypeId;
  parentId?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
  locale?: string;
  fallbackLocale?: string;
};

export type GetLocationByIdInput = {
  id: string;
  locale?: string;
  fallbackLocale?: string;
};