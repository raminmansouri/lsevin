// src/features/specialist-page/types.ts

export interface Specialist {
    id: string;
    name: string;
    title: string;
    specialty: string;
    image: string;
    rating: number;
    reviews: number;
    experience: number;
    patients: string;
    successRate: string;
    verified: boolean;
    languages: string[];
    clinic: string;
    clinicId: string;
    location: string;
    responseTime: string;
    consultationFee: number;
  }
  
  export interface Education {
    degree: string;
    institution: string;
    year: string;
    imageUrl?: string;
  }
  
  export interface Certification {
    name: string;
    issuer: string;
    verified: boolean;
    imageUrl?: string;
  }
  
  export interface Achievement {
    // icon is a React component – serialisable form is just a string key
    icon?: string | null;
    title: string;
    organization: string;
  }
  
  export interface ReviewReply {
    id: string;
    name: string;
    role: "admin" | "customer";
    reply: string;
    date: string;
    verified?: boolean;
    createdByAdmin?: boolean;
  }

  export interface Review {
    id: string | number;
    name: string;
    country: string;
    date: string;
    rating: number;
    treatment: string;
    review: string;
    verified: boolean;
    helpful: number;
    notHelpful?: number;
    pros?: string[];
    cons?: string[];
    images?: string[];
    createdByAdmin?: boolean;
    providerId?: string;
    providerName?: string;
    replies?: ReviewReply[];
  }
  
  export interface BeforeAfter {
    before: string;
    after: string;
    procedure: string;
    months: string;
  }
  
export type SpecialistReview = Review & { id: string; providerId: string; providerName: string; images: string[]; };


export interface SpecialistMoney {
  sourceAmount: number;
  sourceCurrencyCode: string;
  displayAmount: number;
  displayCurrencyCode: string;
  baseRate: number;
  appliedRate: number;
  marginPercent: number;
  exchangeRateIds: string[];
  ratePath: string[];
  asOf: string;
  expiresAt: string | null;
  converted: boolean;
}

export interface SpecialistProvider {
  id: string;
  providerStaffId: string;
  name: string;
  description: string;
  image: string | null;
  providerTypeName: string;
  city: string;
  country: string;
  location: string;
  rating: number;
  reviewCount: number;
  accredited: boolean;
  responseTime: string;
  notes: string;
}

export interface SpecialistService {
  id: string;
  providerServiceId: string;
  serviceDefinitionId: string;
  providerId: string;
  providerName: string;
  name: string;
  description: string;
  image: string | null;
  city: string;
  country: string;
  durationMinutes: number;
  rating: number;
  reviewCount: number;
  isPopular: boolean;
  recovery: string;
  anesthesia: string;
  stayRequired: string;
  successRate: string;
  satisfaction: string;
  bookingUiMode: string;
  requiresSpecialist: boolean;
  tags: string[];
  price: SpecialistMoney;
}

export interface SpecialistEducation {
  id: string;
  degree: string;
  institution: string;
  year: number | null;
  imageUrl?: string;
}

export interface SpecialistCertification {
  id: string;
  name: string;
  issuer: string;
  verified: boolean;
  imageUrl?: string;
}

export interface SpecialistCredential {
  id: string;
  credential: string;
  verified: boolean;
  imageUrl?: string;
}

export interface SpecialistAchievement {
  id: string;
  icon?: string | null;
  title: string;
  organization: string;
  displayOrder: number;
}

export interface SpecialistGalleryItem {
  id: string;
  title: string;
  description: string;
  url: string;
  mediaType: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface SpecialistBeforeAfter {
  id: string;
  before: string;
  after: string;
  procedure: string;
  months: number | null;
  displayOrder: number;
}

export interface SpecialistAvailability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  status: string;
}

export interface SpecialistPageResponse {
  specialist: Specialist & {
    biography: string;
    experienceYears: number | null;
    specializations: string[];
    nextAvailableLabel: string;
    consultationPrice: SpecialistMoney;
  };
  providers: SpecialistProvider[];
  services: SpecialistService[];
  education: SpecialistEducation[];
  certifications: SpecialistCertification[];
  credentials: SpecialistCredential[];
  specializations: string[];
  achievements: SpecialistAchievement[];
  gallery: SpecialistGalleryItem[];
  recentReviews: SpecialistReview[];
  beforeAfter: SpecialistBeforeAfter[];
  availability: SpecialistAvailability[];
  priceContext?: {
    displayCurrencyCode: string;
    selectedCountryCode: string | null;
    browserCountryCode: string | null;
  };
}
