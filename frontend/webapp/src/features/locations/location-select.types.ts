export type LazyOption = {
  value: string;
  label: string;
  description?: string | null;
};

export type LazyOptionsResult = {
  items: LazyOption[];
  hasMore: boolean;
};

export type SearchLocationsInput = {
  locationTypeId: 1 | 2;
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