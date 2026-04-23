export type BookingUiMode = 'default_slot' | 'date_range' | 'custom_form';

export interface ProviderCardItem {
  id: string;
  providerTypeId?: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  city?: string | null;
  country?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  featuredScore?: number | null;
  isSponsored?: boolean | null;
  specialties?: string[] | null;
  responseTime?: string | null;
  successRate?: string | null;
  totalPatients?: string | null;
  languages?: string[] | null;
}

export interface ServiceCardItem {
  id: string;
  serviceDefinitionId: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  currency: string;
  value: number;
  durationMinutes?: number | null;
  slotIntervalMinutes?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  recovery?: string | null;
  successRate?: string | null;
  satisfaction?: string | null;
  growth?: string | null;
  isPopular?: boolean | null;
  bookingUiMode?: BookingUiMode;
  requiresSpecialist?: boolean;
}

export interface SpecialistCardItem {
  id: string;
  name: string;
  title?: string;
  specialty?: string | null;
  imageUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  experience?: string | null;
  patients?: string | null;
  nextAvailableLabel?: string | null;
  successRate?: string | null;
}

export interface UploadRequirementItem {
  id: string;
  title: string;
  description?: string;
  isRequired: boolean;
  maxFiles: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  maxFileSizeBytes: number;
  exampleFileUrl?: string | null;
}

export interface ProviderTypeAddonItem {
  providerTypeId: string;
  label: string;
  description?: string;
  icon?: string | null;
  isRequired: boolean;
  metadata?: Record<string, unknown>;
}

export interface ChildBookingDraft {
  id?: string;
  providerTypeId: string;
  providerId?: string;
  serviceId?: string;
  serviceDefinitionId?: string;
  specialistId?: string;
  bookingUiMode: BookingUiMode;
  requiresSpecialist: boolean;
  selectedDate?: string;
  selectedDateFrom?: string;
  selectedDateTo?: string;
  selectedTime?: string;
  selectedTimeFrom?: string;
  selectedTimeTo?: string;
  adults?: number;
  children?: number;
  infants?: number;
  rooms?: number;
  formSubmissionId?: string;
  subtotalAmount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  status?: string;
}

export interface BookingDraftState {
  id?: string;
  userId?: string;
  providerId?: string;
  serviceId?: string;
  serviceDefinitionId?: string;
  specialistId?: string;
  requiresSpecialist?: boolean;
  bookingUiMode?: BookingUiMode;
  selectedDate?: string;
  selectedDateFrom?: string;
  selectedDateTo?: string;
  selectedTime?: string;
  selectedTimeFrom?: string;
  selectedTimeTo?: string;
  adults?: number;
  children?: number;
  infants?: number;
  rooms?: number;
  currentStep: number;
  paymentMethod?: string;
  currency?: string;
  subtotalAmount?: number;
  addonsAmount?: number;
  totalAmount?: number;
  useLsevin?: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;
  formSubmissionId?: string;
  childBookings: ChildBookingDraft[];
  uploadFiles: Array<{ requirementId?: string; mediaIds?: string; fileUrl?: string; title?: string }>;
}
