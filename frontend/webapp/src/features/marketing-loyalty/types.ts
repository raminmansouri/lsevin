export type MarketingLoyaltyEntityKey =
  | "marketing-offers"
  | "loyalty-tiers"
  | "loyalty-accounts"
  | "loyalty-coupons"
  | "loyalty-customer-coupons"
  | "loyalty-ledger"
  | "loyalty-referrals";

export type FieldKind =
  | "text"
  | "textarea"
  | "richtext"
  | "localized-text"
  | "localized-rich-text"
  | "number"
  | "integer"
  | "datetime"
  | "select"
  | "boolean"
  | "json"
  | "color"
  | "media-single"
  | "media-multi"
  | "readonly";

export type SelectOptionKey =
  | "customers"
  | "tiers"
  | "providerServices"
  | "loyaltyCoupons"
  | "bookings";

export type LazyAdminLookupType =
  | "customers"
  | "loyaltyTiers"
  | "providerServices"
  | "loyaltyCoupons"
  | "bookings";

export interface SelectOption {
  value: string;
  label: string;
  helper?: string;
}

export interface AdminFieldConfig {
  name: string;
  column: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  readOnly?: boolean;
  hiddenOnCreate?: boolean;
  hiddenOnUpdate?: boolean;
  optionsKey?: SelectOptionKey;
  lookupType?: LazyAdminLookupType;
  staticOptions?: SelectOption[];
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: unknown;
  mediaType?: "image" | "video" | "all";
}

export interface AdminListColumnConfig {
  key: string;
  label: string;
  type?: "text" | "number" | "boolean" | "datetime" | "currency" | "percent" | "badge" | "richtext" | "localized-richtext";
  className?: string;
}

export interface AdminEntityConfig {
  key: MarketingLoyaltyEntityKey;
  title: string;
  description: string;
  routeBase: string;
  schemaName: "marketing" | "loyalty";
  tableName: string;
  primaryKey: string;
  primaryKeyKind: "uuid" | "integer";
  createTitle: string;
  updateTitle: string;
  listColumns: AdminListColumnConfig[];
  fields: AdminFieldConfig[];
  searchableColumns: string[];
  creatable?: boolean;
  editable?: boolean;
  deletable?: boolean;
  appendOnly?: boolean;
  updateTimestampColumn?: string;
}

export interface AdminListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  locale?: string;
}

export interface AdminListResult<T = Record<string, unknown>> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface AdminFormData {
  entityKey: MarketingLoyaltyEntityKey;
  id?: string;
  record?: Record<string, unknown>;
  options: Partial<Record<SelectOptionKey, SelectOption[]>>;
}

export interface AdminDashboardStats {
  activeOffers: number;
  featuredOffers: number;
  activeCoupons: number;
  availableCustomerCoupons: number;
  totalAccounts: number;
  totalPoints: number;
  pendingReferrals: number;
  ledgerEntries: number;
}
