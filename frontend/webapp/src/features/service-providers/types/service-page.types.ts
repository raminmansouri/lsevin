import type { ConvertedMoney } from '@/features/finance/types';

export interface GetServicePageByIdResponse {
  service: Service;
  included: string[];
  process: Process[];
  faqs: FAQ[];
  topReviews: TopReview[];
  providers: ServiceProviderOffering[];
  localRecommendations: AlRecommendation[];
  internationalRecommendations: AlRecommendation[];
  serviceAttributes: ServiceAttribute[];
  providerAttributes: ProviderAttribute[];
  uploadRequirements: ServiceUploadRequirement[];
  domainRequirements: ServiceDomainRequirement[];
  addOns: ServiceAddon[];
  offers: ServiceOffer[];
  specialists: ServiceSpecialist[];
  policies: ProviderPolicy[];
  providerGalleryItems: ServiceGalleryItem[];
}

export interface FAQ {
  q: string;
  a: string;
}

export interface AlRecommendation {
  id: string;
  image: string;
  title: string;
  provider: string;
  rating: number;
  reviewCount: number;
  city: string;
  country: string;
  price: number;
  currency: string;
  verified: boolean;
  link: string;
}

export interface ServiceProviderOffering {
  id: string;
  providerServiceId: string;
  serviceDefinitionId: string;
  providerTypeName: string;
  image: string;
  title: string;
  provider: string;
  description: string;
  rating: number;
  reviewCount: number;
  city: string;
  country: string;
  responseTime: string;
  price: number;
  currency: string;
  currencySymbol: string;
  displayPrice: OtherCurrency;
  priceOptions: ConvertedMoney[];
  verified: boolean;
  popular: boolean;
  sponsored: boolean;
  durationMinutes: number;
  isFavorite: boolean;
  link: string;
}

export interface Process {
  step: number;
  title: string;
  description: string;
  duration: string;
}

export interface ServiceGalleryItem {
  id: string;
  title: string;
  description: string;
  url: string;
  mediaType: string;
  displayOrder: number;
  isPrimary: boolean;
  source: 'provider_service_gallery' | 'provider_gallery' | 'staff_gallery' | 'media_library' | 'fallback';
}

export interface ProviderProfileSummary {
  id: string;
  name: string;
  description: string;
  image: string;
  providerTypeName: string;
  gradeName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  street: string;
  detail: string;
  zipCode: string;
  latitude: number | null;
  longitude: number | null;
  timezoneId: string;
  rating: number;
  reviewCount: number;
  accredited: boolean;
  responseTime: string;
  establishedYear: number | null;
  totalPatients: string;
  successRate: string;
  languages: string[];
  specialties: string[];
  isSponsored: boolean;
  sponsoredTag: string;
}

export interface Service {
  id: string;
  providerServiceId: string;
  serviceDefinitionId: string;
  categoryId: string | null;
  categoryName: string;
  name: string;
  subtitle: string;
  definitionName: string;
  definitionDescription: string;
  clinic: string;
  clinicId: string;
  providerDescription: string;
  providerProfile: ProviderProfileSummary;
  location: string;
  city: string;
  country: string;
  price: number;
  originalPrice: number;
  currency: string;
  currencySymbol: string;
  displayCurrencyCode: string;
  displayPrice: OtherCurrency;
  displayOriginalPrice: OtherCurrency;
  priceOptions: ConvertedMoney[];
  originalPriceOptions: ConvertedMoney[];
  otherCurrencies: OtherCurrency[];
  rating: number;
  reviews: number;
  images: string[];
  galleryItems: ServiceGalleryItem[];
  duration: string;
  durationMinutes: number;
  recovery: string;
  anesthesia: string;
  stayRequired: string;
  verified: boolean;
  popular: boolean;
  successRate: string;
  satisfaction: string;
  bookingUiMode: string;
  requiresSpecialist: boolean;
  providerCount: number;
  isFavorite: boolean;
  tags: string[];
  slotIntervalMinutes: number;
}

export interface OtherCurrency {
  code: string;
  amount: number;
  symbol?: string;
}

export interface ServiceAttribute {
  id: string;
  name: string;
  description: string;
  value: string;
  isRequired: boolean;
  affectsPricing: boolean;
  displayOrder: number;
  attributeType: string;
  availableOptions: ServiceAttributeOption[];
}

export interface ServiceAttributeOption {
  id: number;
  name: string;
  value: string;
  additionalPrice: number;
}

export interface ProviderAttribute {
  id: string;
  name: string;
  description: string;
  value: string;
  isRequired: boolean;
  attributeType: string;
}

export interface ServiceUploadRequirement {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
  maxFileSizeBytes: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  maxFiles: number;
  exampleFileUrl: string;
}

export interface ServiceDomainRequirement {
  id: number;
  description: string;
  isMandatory: boolean;
}

export interface ServiceAddon {
  id: string;
  name: string;
  description: string;
  icon: string;
  sourceType: string;
  addonKind: string;
  popular: boolean;
  isRequired: boolean;
  price: number;
  currency: string;
  currencySymbol: string;
  displayPrice: OtherCurrency;
  priceOptions: ConvertedMoney[];
  details: string[];
}

export interface ServiceOffer {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  discountPercent: number;
  validUntil: string;
  code: string;
  isFeatured: boolean;
  usageLimit: number | null;
  usedCount: number;
}

export interface ProviderPolicy {
  id: string;
  code: string;
  type: string;
  description: string;
  displayOrder: number;
}

export interface ServiceSpecialist {
  id: string;
  staffId: string;
  name: string;
  title: string;
  biography: string;
  image: string;
  rating: number;
  reviewCount: number;
  specialty: string;
  experience: string;
  experienceYears: number | null;
  patients: string;
  successRate: string;
  consultationFee: number;
  consultationCurrency: string;
  consultationDisplayPrice: OtherCurrency;
  nextAvailableLabel: string;
  languages: string[];
  specializations: string[];
  certifications: StaffCertification[];
  credentials: string[];
  education: StaffEducation[];
  galleryItems: ServiceGalleryItem[];
  canProvideThisService: boolean;
}

export interface StaffCertification {
  id: string;
  name: string;
  issuer: string;
  isVerified: boolean;
  imageUrl?: string;
}

export interface StaffEducation {
  id: string;
  degree: string;
  institution: string;
  year: number | null;
  imageUrl?: string;
}

export interface ReviewReply {
  id: string;
  name: string;
  role: "admin" | "customer";
  reply: string;
  date: string;
  verified?: boolean;
  createdByAdmin?: boolean;
  replies?: ReviewReply[];
}

export interface TopReview {
  id: string | number;
  name: string;
  country: string;
  date: string;
  rating: number;
  review: string;
  verified: boolean;
  helpful: number;
  notHelpful?: number;
  pros?: string[];
  cons?: string[];
  treatment: string;
  images?: string[];
  createdByAdmin?: boolean;
}

export type GetServicePageQueryKey = ['service-page', string, string];

export interface GetServicePageByIdParams {
  serviceId: string;
}
