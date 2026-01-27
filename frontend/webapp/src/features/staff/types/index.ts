import {
  LocalizedContent,
  LocalizedContentResponse,
} from "@/features/shared/types/localization";

// List view - localized fields are plain strings (extracted by backend)
export interface Staff {
  id: string;
  name: string;
  biography: string;
  title: string;
  profileImageUrl?: string;
  isActive: boolean;
  createDate: string;
  lastModifiedDate?: string;
}

export interface StaffAvailability {
  availabilityId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  availabilityStatusId: number;
  specificDate?: string;
}

export interface StaffService {
  id: string;
  serviceDefinitionId: string;
  isActive: boolean;
  notes: string;
}

export interface CreateStaffRequest {
  name: LocalizedContent;
  biography: LocalizedContent;
  title: LocalizedContent;
  profileImageUrl?: string;
  isActive?: boolean;
}

export interface UpdateStaffRequest {
  name: LocalizedContent;
  biography: LocalizedContent;
  title: LocalizedContent;
  profileImageUrl?: string;
  isActive: boolean;
}

export interface ChangeStaffActivationRequest {
  isActive: boolean;
}

export interface AddStaffAvailabilityRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  availabilityStatusId: number;
  specificDate?: string;
}

export interface UpdateStaffAvailabilityRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  availabilityStatusId: number;
  specificDate?: string;
}

export interface AddStaffServiceRequest {
  serviceDefinitionId: string;
  notes: LocalizedContent;
}

// Additional types needed for Staff Details functionality
export enum DayOfWeek {
  Sunday = "Sunday",
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
}

export interface StaffAvailabilityResponse {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate?: string;
  availabilityStatusId: number;
  availabilityStatusName: string;
  createDate: string;
  lastModifiedDate?: string;
}

// Service with localized notes
export interface StaffServiceResponse {
  id: string;
  serviceDefinitionId: string;
  serviceName: string;
  serviceDescription?: string;
  price: number;
  durationInMinutes: number;
  isActive: boolean;
  notes: LocalizedContentResponse;
  createDate: string;
  lastModifiedDate?: string;
}

export interface StaffDetails {
  id: string;
  name: LocalizedContentResponse;
  biography: LocalizedContentResponse;
  title: LocalizedContentResponse;
  profileImageUrl?: string;
  isActive: boolean;
  createDate: string;
  lastModifiedDate?: string;
  services: StaffServiceResponse[];
  availabilities: StaffAvailabilityResponse[];
}
