export type ProviderPortalRole =
  | "owner"
  | "admin"
  | "manager"
  | "editor"
  | "viewer"
  | "staff";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export type TranslationMap = Record<string, string>;

export type ProviderPortalApplicationStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "disabled";

export type ProviderSummary = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  providerTypeName: string;
  role: ProviderPortalRole;
  isDefault: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  serviceCount: number;
  staffCount: number;
  bookingCount: number;
};

export type ProviderApplication = {
  id: string;
  applicationNumber: string | null;
  providerTypeId: string;
  providerTypeName: string;
  legalName: string | null;
  displayName: string;
  email: string | null;
  phone: string | null;
  status: ProviderPortalApplicationStatus;
  currentStep: number;
  reviewReason: string | null;
  submittedAt: string | null;
  createdAt: string;
  serviceProviderId: string | null;
};

export type ProviderTypeOption = {
  id: string;
  label: string;
  description: string;
};

export type ProviderWorkspace = {
  provider: {
    id: string;
    name: TranslationMap;
    displayName: string;
    description: TranslationMap;
    detail: TranslationMap;
    street: TranslationMap;
    imageUrl: string | null;
    email: string;
    phoneNumberCountryCode: string;
    phoneNumber: string;
    country: string;
    city: string;
    zipCode: string | null;
    providerTypeName: string;
    isActive: boolean;
    accredited: boolean;
    rating: number;
    reviewCount: number;
    responseTime: string | null;
    establishedYear: number | null;
    totalPatients: string | null;
    successRate: string | null;
    languages: string[];
    specialties: string[];
    timezoneId: string;
  };
  role: ProviderPortalRole;
  permissions: Record<string, boolean>;
  stats: {
    services: number;
    activeServices: number;
    staff: number;
    bookings: number;
    pendingBookings: number;
    reviews: number;
    unreadTickets: number;
    pendingLedgerAmount: number;
    ledgerCurrency: string | null;
  };
};

export type ProviderServiceRow = {
  id: string;
  serviceDefinitionId: string;
  serviceDefinitionName: string;
  displayName: TranslationMap;
  name: string;
  description: TranslationMap;
  isActive: boolean;
  currency: string;
  value: number;
  durationMinutes: number;
  slotIntervalMinutes: number;
  imageUrl: string | null;
  isPopular: boolean;
  tags: string[];
  rating: number;
  reviewCount: number;
};

export type ServiceDefinitionOption = {
  id: string;
  label: string;
  durationMinutes: number;
  currency: string;
  value: number;
};

export type StaffRow = {
  id: string;
  providerStaffId: string;
  name: TranslationMap;
  displayName: string;
  title: TranslationMap;
  biography: TranslationMap;
  profileImageUrl: string | null;
  isActive: boolean;
  specialty: string | null;
  experienceYears: number | null;
  consultationFee: number;
  notes: TranslationMap;
};

export type OperatingHourRow = {
  id: string | null;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
  slotIntervalMinutes: number;
};

export type BlockedHourSlotRow = {
  startsAt: string;
  endsAt: string;
  isBlocked: boolean;
  isLocked: boolean;
  bookedCount: number;
};

export type BlockedHoursDay = {
  date: string;
  dayOfWeek: number;
  isClosed: boolean;
  opensAt: string | null;
  closesAt: string | null;
  slots: BlockedHourSlotRow[];
};

export type BookingRow = {
  id: string;
  bookingSource: "main" | "child";
  serviceName: string;
  specialistName: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  status: string;
  paymentStatus: string | null;
  totalAmount: number;
  currencyCode: string | null;
  customerName: string | null;
  customerEmail: string | null;
  providerNotes: string | null;
  createdAt: string;
};

export type GalleryRow = {
  id: string;
  title: TranslationMap;
  displayTitle: string;
  description: TranslationMap;
  url: string;
  mediaType: string;
  displayOrder: number;
};

export type ReviewRow = {
  id: string;
  customerName: string;
  commentText: string;
  rating: number | null;
  isPublic: boolean;
  isVerified: boolean;
  helpfulCount: number;
  country: string | null;
  treatment: string | null;
  createdAt: string;
};

export type OfferRow = {
  id: number;
  providerServiceId: string;
  serviceName: string;
  title: string;
  subtitle: string | null;
  discountPercent: number;
  validUntil: string;
  code: string | null;
  isActive: boolean;
  isFeatured: boolean;
  usageLimit: number | null;
  usedCount: number;
};

export type LedgerRow = {
  id: string;
  entryType: string;
  amount: number;
  currencyCode: string;
  status: string;
  bookingId: string | null;
  notes: string | null;
  createdAt: string;
};

export type PayoutAccountRow = {
  id: string;
  accountHolderName: string;
  bankName: string | null;
  iban: string | null;
  swiftCode: string | null;
  accountNumberLast4: string | null;
  country: string | null;
  currencyCode: string;
  isDefault: boolean;
};

export type SupportTicketRow = {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
};

export type ProviderCertificationRow = {
  id: string;
  name: string;
  isVerified: boolean;
  imageUrl: string | null;
  secondaryImageUrl: string | null;
};

export type ProviderPolicyTypeOption = {
  id: string;
  code: string;
  label: string;
};

export type ProviderPolicyRow = {
  id: string;
  type: TranslationMap;
  displayType: string;
  description: TranslationMap;
  providerPolicyTypeId: string | null;
};

export type ProviderProfileRelatedRecords = {
  certifications: ProviderCertificationRow[];
  policies: ProviderPolicyRow[];
  policyTypes: ProviderPolicyTypeOption[];
};

export type ServiceGalleryRow = {
  id: string;
  providerServiceId: string;
  serviceName: string;
  title: TranslationMap;
  displayTitle: string;
  description: TranslationMap;
  url: string;
  mediaType: string;
  displayOrder: number;
  isPrimary: boolean;
};

export type ProviderAddonOption = {
  id: string;
  name: string;
  price: number;
  currencyCode: string;
  addonKind: string;
};

export type ServiceAddonSettingRow = {
  providerServiceId: string;
  addonId: string;
  serviceName: string;
  addonName: string;
  defaultPrice: number;
  defaultCurrencyCode: string;
  customPrice: number | null;
  isEnabled: boolean;
};

export type ProviderServiceRelatedRecords = {
  serviceGallery: ServiceGalleryRow[];
  addonSettings: ServiceAddonSettingRow[];
  addonOptions: ProviderAddonOption[];
  included: ServiceIncludedRow[];
  process: ServiceProcessRow[];
  faqs: ServiceFaqRow[];
};

export type StaffCertificationRow = {
  id: string;
  staffId: string;
  staffName: string;
  name: string;
  issuer: string | null;
  isVerified: boolean;
};

export type StaffEducationRow = {
  id: string;
  staffId: string;
  staffName: string;
  degree: string;
  institution: string;
  year: number | null;
};

export type StaffAvailabilityRow = {
  id: string;
  staffId: string;
  staffName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  availabilityStatusId: number;
  specificDate: string | null;
};

export type StaffGalleryRow = {
  id: string;
  staffId: string;
  staffName: string;
  title: TranslationMap;
  displayTitle: string;
  description: TranslationMap;
  url: string;
  mediaType: string;
  displayOrder: number;
  isPrimary: boolean;
};

export type StaffServiceRow = {
  id: string;
  staffId: string;
  staffName: string;
  serviceDefinitionId: string;
  serviceDefinitionName: string;
  isActive: boolean;
  notes: TranslationMap;
};

export type ProviderStaffRelatedRecords = {
  certifications: StaffCertificationRow[];
  education: StaffEducationRow[];
  availability: StaffAvailabilityRow[];
  gallery: StaffGalleryRow[];
  services: StaffServiceRow[];
  serviceDefinitions: ServiceDefinitionOption[];
};

export type ServiceIncludedRow = {
  id: string;
  providerServiceId: string;
  serviceName: string;
  item: string;
};

export type ServiceProcessRow = {
  id: string;
  providerServiceId: string;
  serviceName: string;
  step: number;
  title: string | null;
  description: string | null;
  duration: string | null;
};

export type ServiceFaqRow = {
  id: string;
  providerServiceId: string;
  serviceName: string;
  question: string | null;
  answer: string | null;
};
