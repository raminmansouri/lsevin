import { IAttribute, IGallery, IPolicy } from "@/features/shared/types/common";
import { Coordinates } from "@/features/shared/types/coordinates";
import {
  LocalizedContent,
  LocalizedContentResponse,
} from "@/features/shared/types/localization";

// ============ Grade Enum & Mappings ============

export enum ServiceProviderGrade {
  GradeA = "GradeA",
  GradeB = "GradeB",
  GradeC = "GradeC",
  GradeD = "GradeD",
  GradeE = "GradeE",
  GradeF = "GradeF",
  GradeG = "GradeG",
  GradeH = "GradeH",
  GradeI = "GradeI",
  GradeJ = "GradeJ",
  GradeK = "GradeK",
  GradeL = "GradeL",
  GradeM = "GradeM",
  GradeN = "GradeN",
  GradeO = "GradeO",
  GradeP = "GradeP",
  GradeQ = "GradeQ",
  GradeR = "GradeR",
  GradeS = "GradeS",
  GradeT = "GradeT",
  GradeU = "GradeU",
  GradeV = "GradeV",
  GradeW = "GradeW",
  GradeX = "GradeX",
  GradeY = "GradeY",
  GradeZ = "GradeZ",
}

export const ServiceProviderGradeDisplayMap = {
  [ServiceProviderGrade.GradeA]: "A",
  [ServiceProviderGrade.GradeB]: "B",
  [ServiceProviderGrade.GradeC]: "C",
  [ServiceProviderGrade.GradeD]: "D",
  [ServiceProviderGrade.GradeE]: "E",
  [ServiceProviderGrade.GradeF]: "F",
  [ServiceProviderGrade.GradeG]: "G",
  [ServiceProviderGrade.GradeH]: "H",
  [ServiceProviderGrade.GradeI]: "I",
  [ServiceProviderGrade.GradeJ]: "J",
  [ServiceProviderGrade.GradeK]: "K",
  [ServiceProviderGrade.GradeL]: "L",
  [ServiceProviderGrade.GradeM]: "M",
  [ServiceProviderGrade.GradeN]: "N",
  [ServiceProviderGrade.GradeO]: "O",
  [ServiceProviderGrade.GradeP]: "P",
  [ServiceProviderGrade.GradeQ]: "Q",
  [ServiceProviderGrade.GradeR]: "R",
  [ServiceProviderGrade.GradeS]: "S",
  [ServiceProviderGrade.GradeT]: "T",
  [ServiceProviderGrade.GradeU]: "U",
  [ServiceProviderGrade.GradeV]: "V",
  [ServiceProviderGrade.GradeW]: "W",
  [ServiceProviderGrade.GradeX]: "X",
  [ServiceProviderGrade.GradeY]: "Y",
  [ServiceProviderGrade.GradeZ]: "Z",
};

export const ServiceProviderGradeValueMap = {
  GradeA: ServiceProviderGrade.GradeA,
  GradeB: ServiceProviderGrade.GradeB,
  GradeC: ServiceProviderGrade.GradeC,
  GradeD: ServiceProviderGrade.GradeD,
  GradeE: ServiceProviderGrade.GradeE,
  GradeF: ServiceProviderGrade.GradeF,
  GradeG: ServiceProviderGrade.GradeG,
  GradeH: ServiceProviderGrade.GradeH,
  GradeI: ServiceProviderGrade.GradeI,
  GradeJ: ServiceProviderGrade.GradeJ,
  GradeK: ServiceProviderGrade.GradeK,
  GradeL: ServiceProviderGrade.GradeL,
  GradeM: ServiceProviderGrade.GradeM,
  GradeN: ServiceProviderGrade.GradeN,
  GradeO: ServiceProviderGrade.GradeO,
  GradeP: ServiceProviderGrade.GradeP,
  GradeQ: ServiceProviderGrade.GradeQ,
  GradeR: ServiceProviderGrade.GradeR,
  GradeS: ServiceProviderGrade.GradeS,
  GradeT: ServiceProviderGrade.GradeT,
  GradeU: ServiceProviderGrade.GradeU,
  GradeV: ServiceProviderGrade.GradeV,
  GradeW: ServiceProviderGrade.GradeW,
  GradeX: ServiceProviderGrade.GradeX,
  GradeY: ServiceProviderGrade.GradeY,
  GradeZ: ServiceProviderGrade.GradeZ,
};

export const gradeToId = (grade?: ServiceProviderGrade): number | undefined => {
  if (!grade) return undefined;
  const gradeMap = {
    [ServiceProviderGrade.GradeA]: 1,
    [ServiceProviderGrade.GradeB]: 2,
    [ServiceProviderGrade.GradeC]: 3,
    [ServiceProviderGrade.GradeD]: 4,
    [ServiceProviderGrade.GradeE]: 5,
    [ServiceProviderGrade.GradeF]: 6,
    [ServiceProviderGrade.GradeG]: 7,
    [ServiceProviderGrade.GradeH]: 8,
    [ServiceProviderGrade.GradeI]: 9,
    [ServiceProviderGrade.GradeJ]: 10,
    [ServiceProviderGrade.GradeK]: 11,
    [ServiceProviderGrade.GradeL]: 12,
    [ServiceProviderGrade.GradeM]: 13,
    [ServiceProviderGrade.GradeN]: 14,
    [ServiceProviderGrade.GradeO]: 15,
    [ServiceProviderGrade.GradeP]: 16,
    [ServiceProviderGrade.GradeQ]: 17,
    [ServiceProviderGrade.GradeR]: 18,
    [ServiceProviderGrade.GradeS]: 19,
    [ServiceProviderGrade.GradeT]: 20,
    [ServiceProviderGrade.GradeU]: 21,
    [ServiceProviderGrade.GradeV]: 22,
    [ServiceProviderGrade.GradeW]: 23,
    [ServiceProviderGrade.GradeX]: 24,
    [ServiceProviderGrade.GradeY]: 25,
    [ServiceProviderGrade.GradeZ]: 26,
  };
  return gradeMap[grade];
};

export const idToGrade = (id?: number): ServiceProviderGrade | undefined => {
  if (id === undefined || id === null) return undefined;
  const idToGradeMap: Record<number, ServiceProviderGrade> = {
    1: ServiceProviderGrade.GradeA,
    2: ServiceProviderGrade.GradeB,
    3: ServiceProviderGrade.GradeC,
    4: ServiceProviderGrade.GradeD,
    5: ServiceProviderGrade.GradeE,
    6: ServiceProviderGrade.GradeF,
    7: ServiceProviderGrade.GradeG,
    8: ServiceProviderGrade.GradeH,
    9: ServiceProviderGrade.GradeI,
    10: ServiceProviderGrade.GradeJ,
    11: ServiceProviderGrade.GradeK,
    12: ServiceProviderGrade.GradeL,
    13: ServiceProviderGrade.GradeM,
    14: ServiceProviderGrade.GradeN,
    15: ServiceProviderGrade.GradeO,
    16: ServiceProviderGrade.GradeP,
    17: ServiceProviderGrade.GradeQ,
    18: ServiceProviderGrade.GradeR,
    19: ServiceProviderGrade.GradeS,
    20: ServiceProviderGrade.GradeT,
    21: ServiceProviderGrade.GradeU,
    22: ServiceProviderGrade.GradeV,
    23: ServiceProviderGrade.GradeW,
    24: ServiceProviderGrade.GradeX,
    25: ServiceProviderGrade.GradeY,
    26: ServiceProviderGrade.GradeZ,
  };
  return idToGradeMap[id];
};

// ============ Admin Interfaces (for admin panel) ============

// Base ServiceProvider interface (for admin list view)
export interface ServiceProvider {
  id: string;
  name: string;
  description: string;
  contactEmail: string;
  phoneNumberCountryCode?: string;
  phoneNumber?: string;
  address: string; // Formatted address string
  isActive: boolean;
  providerTypeId: string;
  providerTypeName: string;
  grade: string;
  serviceCount: number;
  galleryItemCount: number;
  policyCount: number;
  staffCount: number;
  createDate: string;
  lastModifiedDate?: string;
}

// Detailed ServiceProvider interface (for admin edit forms)
export interface ServiceProviderDetails {
  id: string;
  name: LocalizedContentResponse;
  description: LocalizedContentResponse;
  isActive: boolean;
  providerTypeId: string;
  providerTypeName: string;
  gradeId: number;
  // Address components
  city: string;
  country: string;
  detail?: LocalizedContentResponse;
  street?: LocalizedContentResponse;
  zipCode?: string;
  coordinates?: Coordinates;
  // Contact info
  email: string;
  phoneNumber?: string;
  phoneNumberCountryCode?: string;
  createDate: string;
  lastModifiedDate?: string;
  // Collections from backend response
  attributes: ServiceProviderAttribute[];
  galleryItems: ServiceProviderGalleryItem[];
  policies: ServiceProviderPolicy[];
  services: ServiceProviderService[];
  staff: ServiceProviderStaff[];
}

// Request DTOs matching OpenAPI exactly
export interface CreateServiceProviderRequest {
  name: LocalizedContent;
  description: LocalizedContent;
  providerTypeId: string;
  city: string;
  country: string;
  detail?: LocalizedContent;
  street?: LocalizedContent;
  zipCode?: string;
  coordinates?: Coordinates;
  email: string;
  phoneNumber?: string;
  phoneNumberCountryCode?: string;
  grade?: ServiceProviderGrade;
  isActive?: boolean;
}

export interface UpdateServiceProviderRequest {
  name: LocalizedContent;
  description: LocalizedContent;
  providerTypeId: string;
  city: string;
  country: string;
  detail?: LocalizedContent;
  street?: LocalizedContent;
  zipCode?: string;
  coordinates?: Coordinates;
  email: string;
  phoneNumber?: string;
  phoneNumberCountryCode?: string;
  grade?: ServiceProviderGrade;
  isActive: boolean;
}

// ============ Public Interfaces (for public-facing pages) ============

export interface IServiceProvider {
  id: string;
  name: string;
  minimumServicePrice: number;
  currency: string;
  thumbnailUrl: string;
  grade: string;
  attributes: IAttribute[];
}


export interface IFeaturedServiceResponse {
  services: ServiceProviderService[];
}


export interface SearchHistoryTrendingSearchVm {
  query:string;
  trend:string;
}
export interface SearchHistoryPopularCategoryVm {
  label:string;
  icon:string;
}
export interface SearchHistoryResponse {
recentSearches:string[];
popularCategories:SearchHistoryPopularCategoryVm[];
trendingSearches:SearchHistoryTrendingSearchVm[];
}

export interface TrustedProvider {
  rating: number;
  verified: boolean;
  bookings: number;
  growth: number;
  image: string;
  id: string;
  name: string;
  description: string;
  contactEmail: string;
  phoneNumberCountryCode?: string;
  phoneNumber?: string;
  address: string; // Formatted address string
  isActive: boolean;
  providerTypeId: string;
  providerTypeName: string;
  grade: string;
  serviceCount: number;
  galleryItemCount: number;
  policyCount: number;
  staffCount: number;
  createDate: string;
  lastModifiedDate?: string;
}

export interface ITrendingServiceResponse {
  services: TrendingService[];
}


export interface TrendingService {
  growth:number;
  bookings: number;
  reviews: number;
  rating?:number;
  location?: string;
  providerName: string;
  id: string;
  serviceDefinitionId: string;
  durationMinutes: number;
  displayName: LocalizedContentResponse;
  description?: LocalizedContentResponse;
  url?: LocalizedContentResponse;
  isActive: boolean;
  currency: string;
  value: number;
  discount?: number;
  // Additional fields for custom pricing and duration
  customPrice?: number;
  basePrice?: number;
  customDuration?: number;
  baseDuration?: number;
  categoryName?: string;
  notes?: LocalizedContentResponse;
  attributeValues?: ServiceProviderAttributeItem[];
  badges?: ServiceBadge[];
  features?: ServiceFeature[];
}

export interface IServiceProviderDetails {
  id: string;
  name: string;
  description: string;
  contactEmail: string;
  phoneNumberCountryCode?: string;
  phoneNumber?: string;
  address?: string;
  coordinates?: Coordinates;
  providerTypeName: string;
  attributes: IAttribute[];
  policies: IPolicy[];
  gallery: IGallery[];
  services: (Omit<ServiceProviderService, "description" | "displayName"> & {
    description: string;
    displayName: string;
  })[];
  staff: IServiceProviderStaff[];
}

export interface IServiceProviderStaff {
  id: string;
  staffId: string;
  staffName: string;
  staffTitle?: string;
  staffBiography?: string;
  profileImageUrl?: string;
  notes?: string;
  isActive: boolean;
}

export interface IServiceProviderGroup {
  providerTypeId: string;
  providerTypeName: string;
  totalCount: number;
  serviceProviders: IServiceProvider[];
}

export type IServiceProvidersGroupedResponse = IServiceProviderGroup[];

// ============ Service Provider Requests ============

export interface IServiceProviderRequest {
  id: string;
  serviceProviderId: string;
  customerId: string;
  customerEmail: string;
  customerFullName: string;
  message: string;
  status: string;
  createDate: string;
  lastModifiedDate?: string;
}

export type IServiceProviderRequestStatus = "Pending" | "Approved" | "Rejected";
export interface IServiceProviderRequestAdmin {
  id: string;
  serviceProviderId: string;
  serviceProviderName: string;
  customerId: string;
  customerFullName: string;
  customerEmail: string;
  message: string;
  status: IServiceProviderRequestStatus;
  createDate: string;
}

// ============ Location interfaces for dropdowns ============

export interface AvailableCountry {
  id: string;
  code: string;
  value: string;
}

export interface AvailableCity {
  id: string;
  code: string;
  value: string;
  parentId: string;
}

// Legacy aliases for backward compatibility
export interface IAvailableCountry extends AvailableCountry {}
export interface IAvailableCity extends AvailableCity {}

// ============ Sub-Entity Interfaces (for details management) ============

// Staff interfaces
export interface ServiceProviderStaff {
  id: string;
  staffId: string;
  staffName: string;
  staffTitle?: string;
  notes?: LocalizedContentResponse;
  isActive: boolean;
}

// Service interfaces
export interface ServiceBadge {
  name:string;
}

export interface ServiceFeature {
  name:string;
}

export interface ServiceProviderService {
  reviews: number;
  rating?:number;
  location?: string;
  providerName: string;
  id: string;
  serviceDefinitionId: string;
  durationMinutes: number;
  displayName: LocalizedContentResponse;
  description?: LocalizedContentResponse;
  url?: LocalizedContentResponse;
  isActive: boolean;
  currency: string;
  value: number;
  discount?: number;
  // Additional fields for custom pricing and duration
  customPrice?: number;
  basePrice?: number;
  customDuration?: number;
  baseDuration?: number;
  categoryName?: string;
  notes?: LocalizedContentResponse;
  attributeValues?: ServiceProviderAttributeItem[];
  badges?: ServiceBadge[];
  features?: ServiceFeature[];
}

export interface ServiceProviderService {
  providerName: string;
  id: string;
  serviceDefinitionId: string;
  durationMinutes: number;
  displayName: LocalizedContentResponse;
  description?: LocalizedContentResponse;
  url?: LocalizedContentResponse;
  isActive: boolean;
  currency: string;
  value: number;
  discount?: number;
  // Additional fields for custom pricing and duration
  customPrice?: number;
  basePrice?: number;
  customDuration?: number;
  baseDuration?: number;
  categoryName?: string;
  notes?: LocalizedContentResponse;
  attributeValues?: ServiceProviderAttributeItem[];
  badges?: ServiceBadge[];
  features?: ServiceFeature[];
}

export interface ServiceProviderAttributeItem {
  id: string;
  attributeName: string;
  value: LocalizedContentResponse;
}
// Policy interfaces
export interface ServiceProviderPolicy {
  id: string;
  type: LocalizedContentResponse;
  description: LocalizedContentResponse;
  displayOrder?: number;
  isActive?: boolean;
}

// Gallery interfaces
export interface ServiceProviderGalleryItem {
  id: string;
  title: LocalizedContentResponse;
  description: LocalizedContentResponse;
  url: string;
  mediaType: string;
  displayOrder: number;
}

// Attribute interfaces
export interface ServiceProviderAttribute {
  id: string;
  attributeDefinitionId: string;
  attributeName: string;
  value: LocalizedContentResponse;
}

// Enhanced ServiceProviderDetails with additional display names
export interface ServiceProviderDetailsWithRelations
  extends ServiceProviderDetails {
  // Admin display names for relationships
  countryName: string;
  cityName: string;
}

// ============ Service Provider Comments ============

export interface IServiceProviderComment {
  id: string;
  serviceProviderId: string;
  customerId: string;
  customerName: string;
  commentText: string;
  rating?: number; // Optional 1-5 rating
  isMine: boolean; // CRITICAL: For delete button visibility
  createDate: string;
}
