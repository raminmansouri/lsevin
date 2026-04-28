import type {
  LocalizedContent,
  LocalizedContentResponse,
} from "@/features/shared/types/localization";

export type StaffSortKey = "name" | "title" | "rating" | "createDate" | "lastModifiedDate";

export enum DayOfWeek {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday",
}

export interface Staff {
  id: string;
  name: string;
  biography: string;
  title: string;
  profileImageUrl?: string | null;
  isActive: boolean;
  createDate: string;
  lastModifiedDate?: string | null;
  experience?: string | null;
  patients?: string | null;
  rating: number;
  specialty?: string | null;
  consultationFee: number;
  nextAvailableLabel?: string | null;
  reviewCount: number;
  experienceYears?: number | null;
  successRate?: string | null;
  serviceCount: number;
  providerCount: number;
  bookingCount: number;
}

export interface StaffProviderAssignment {
  id?: string;
  serviceProviderId: string;
  serviceProviderName?: string;
  providerTypeName?: string;
  notes: LocalizedContentResponse;
  isActive: boolean;
  createDate?: string;
  lastModifiedDate?: string | null;
}

export interface StaffAvailabilityResponse {
  id: string;
  availabilityId: string;
  dayOfWeek: DayOfWeek;
  dayOfWeekNumber: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate?: string | null;
  availabilityStatusId: number;
  availabilityStatusName: string;
  createDate: string;
  lastModifiedDate?: string | null;
}

export interface StaffServiceResponse {
  id: string;
  serviceDefinitionId: string;
  serviceName: string;
  serviceDescription?: string;
  price: number;
  currency: string;
  durationInMinutes: number;
  isActive: boolean;
  notes: LocalizedContentResponse;
  createDate: string;
  lastModifiedDate?: string | null;
}

export interface StaffEducationResponse {
  id?: string;
  degree: string;
  institution: string;
  year?: number | null;
  imageUrl?: string | null;
  createDate?: string;
  lastModifiedDate?: string | null;
}

export interface StaffCertificationResponse {
  id?: string;
  name: string;
  issuer?: string | null;
  isVerified: boolean;
  imageUrl?: string | null;
  createDate?: string;
  lastModifiedDate?: string | null;
}

export interface StaffCredentialResponse {
  id?: string;
  credential: string;
  isVerified: boolean;
  imageUrl?: string | null;
}

export interface StaffAchievementResponse {
  id?: string;
  icon?: string | null;
  title: string;
  organization?: string | null;
  displayOrder: number;
  createDate?: string;
  lastModifiedDate?: string | null;
}

export interface StaffGalleryItemResponse {
  id?: string;
  title: LocalizedContentResponse;
  description: LocalizedContentResponse;
  url: string;
  mediaType: string;
  displayOrder: number;
  isPrimary: boolean;
  createDate?: string;
  lastModifiedDate?: string | null;
}

export interface StaffBeforeAfterResponse {
  id?: string;
  beforeImage: string;
  afterImage: string;
  procedure?: string | null;
  months?: number | null;
  displayOrder: number;
  createDate?: string;
  lastModifiedDate?: string | null;
}

export interface StaffDetails {
  id: string;
  name: LocalizedContentResponse;
  biography: LocalizedContentResponse;
  title: LocalizedContentResponse;
  profileImageUrl?: string | null;
  isActive: boolean;
  createDate: string;
  lastModifiedDate?: string | null;
  experience?: string | null;
  patients?: string | null;
  rating: number;
  specialty?: string | null;
  consultationFee: number;
  nextAvailableLabel?: string | null;
  reviewCount: number;
  specialtyTranslations?: LocalizedContentResponse | null;
  experienceYears?: number | null;
  successRate?: string | null;
  services: StaffServiceResponse[];
  availabilities: StaffAvailabilityResponse[];
  providerAssignments: StaffProviderAssignment[];
  languages: string[];
  specializations: string[];
  education: StaffEducationResponse[];
  certifications: StaffCertificationResponse[];
  credentials: StaffCredentialResponse[];
  achievements: StaffAchievementResponse[];
  galleryItems: StaffGalleryItemResponse[];
  beforeAfterItems: StaffBeforeAfterResponse[];
  stats: {
    bookingCount: number;
    draftBookingCount: number;
    providerCount: number;
    activeProviderCount: number;
    serviceCount: number;
    activeServiceCount: number;
    galleryCount: number;
    beforeAfterCount: number;
  };
}

export interface ServiceDefinitionOption {
  id: string;
  name: string;
  categoryName?: string;
  currency: string;
  value: number;
  durationMinutes: number;
  isActive: boolean;
}

export interface ServiceProviderOption {
  id: string;
  name: string;
  providerTypeName?: string;
  country?: string;
  city?: string;
  isActive: boolean;
}

export interface AvailabilityStatusOption {
  id: number;
  name: string;
}

export interface StaffFormOptions {
  serviceDefinitions: ServiceDefinitionOption[];
  serviceProviders: ServiceProviderOption[];
  availabilityStatuses: AvailabilityStatusOption[];
}

export interface StaffMutationInput {
  staffId?: string;
  name: LocalizedContent;
  biography: LocalizedContent;
  title: LocalizedContent;
  profileImageUrl?: string;
  isActive: boolean;
  experience?: string;
  patients?: string;
  rating?: number;
  specialty?: string;
  consultationFee?: number;
  nextAvailableLabel?: string;
  reviewCount?: number;
  specialtyTranslations?: LocalizedContent;
  experienceYears?: number;
  successRate?: string;
  providerAssignments: Array<{
    id?: string;
    serviceProviderId: string;
    notes: LocalizedContent;
    isActive: boolean;
  }>;
  services: Array<{
    id?: string;
    serviceDefinitionId: string;
    isActive: boolean;
    notes: LocalizedContent;
  }>;
  availabilities: Array<{
    id?: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    specificDate?: string;
    availabilityStatusId: number;
  }>;
  languages: string[];
  specializations: string[];
  education: StaffEducationResponse[];
  certifications: StaffCertificationResponse[];
  credentials: StaffCredentialResponse[];
  achievements: StaffAchievementResponse[];
  galleryItems: Array<{
    id?: string;
    title: LocalizedContent;
    description: LocalizedContent;
    url: string;
    mediaType: string;
    displayOrder: number;
    isPrimary: boolean;
  }>;
  galleryBulkMediaIds?: string;
  beforeAfterItems: StaffBeforeAfterResponse[];
}
