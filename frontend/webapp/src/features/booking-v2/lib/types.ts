export type AddonKind =
  | "simple"
  | "hotel"
  | "airport_pickup"
  | "transport"
  | "insurance"
  | "other";

export type AddonSourceType = "provider" | "lsevin";

export type PaymentMethod =
  | "manual_transfer"
  | "online_gateway"
  | "pay_on_arrival";

export interface BookingCatalogProvider {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  imageUrl: string | null;
}

export interface BookingCatalogService {
  id: string;
  providerId: string;
  serviceDefinitionId: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  durationMinutes: number;
  imageUrl: string | null;
  slotIntervalMinutes: number;
}

export interface BookingCatalogSpecialist {
  id: string;
  name: string;
  title: string | null;
  imageUrl: string | null;
}

export interface BookingAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  sourceType: AddonSourceType;
  addonKind: AddonKind;
  details: string[];
  popular: boolean;
}

export interface SelectedAddon {
  addonId: string;
  sourceType: AddonSourceType;
  addonKind: AddonKind;
  quantity: number;
  unitPrice: number;
  config: Record<string, unknown>;
}

export interface UploadedDraftDocument {
  id?: string;
  requirementId?: string | null;
  title: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
}

export interface BookingDraftPayload {
  draftId?: string;
  providerId?: string | null;
  serviceId?: string | null;
  specialistId?: string | null;
  selectedDate?: string | null;
  selectedTime?: string | null;
  selectedTimeFrom?: string | null;
  selectedTimeTo?: string | null;
  useLsevin?: boolean;
  currentStep?: number;
  paymentMethod?: PaymentMethod | null;
  currency?: string;
  selectedAddons?: SelectedAddon[];
  documents?: UploadedDraftDocument[];
  notes?: string | null;
}

export interface BookingDraftRecord {
  id: string;
  providerId: string | null;
  serviceId: string | null;
  specialistId: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  selectedTimeFrom: string | null;
  selectedTimeTo: string | null;
  useLsevin: boolean;
  currentStep: number;
  paymentMethod: PaymentMethod | null;
  currency: string;
  subtotalAmount: number;
  addonsAmount: number;
  totalAmount: number;
  status: string;
  notes: string | null;
  selectedAddons: SelectedAddon[];
  documents: UploadedDraftDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityDate {
  date: string;
  dayLabel: string;
  available: boolean;
}

export interface AvailabilityTime {
  time: string;
  timeFrom: string;
  timeTo: string;
  available: boolean;
}

export interface CheckoutResponse {
  bookingId: string;
  paymentId: string;
  paymentStatus: string;
  bookingStatus: string;
}
