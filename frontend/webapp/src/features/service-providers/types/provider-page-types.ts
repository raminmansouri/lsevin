export interface Certification {
  name: string;
  verified: boolean;
}

export interface ProviderAttribute {
  id: string;
  name: string;
  value: string;
  description?: string | null;
}

export interface ProviderPolicy {
  id: string;
  type: string;
  description: string;
}

export interface ServiceAttribute {
  name: string;
  value: string;
}

export interface Provider {
  id: string;
  name: string;
  providerType?: string | null;
  tagline: string;
  description?: string | null;
  about?: string;
  location: string;
  city?: string;
  country: string;
  street?: string | null;
  email?: string | null;
  phone?: string | null;
  rating: number;
  reviews: number;
  verified: boolean;
  accredited: boolean;
  responseTime: string;
  image?: string;
  images: string[];
  certifications: Certification[];
  languages: string[];
  attributes: ProviderAttribute[];
  policies: ProviderPolicy[];
  established: number;
  totalPatients: string;
  successRate: string;
  displayCurrencyCode?: string;
  isFavorite?: boolean;
}

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  sourcePrice?: number;
  sourceCurrency?: string;
  exchangeRate?: number;
  exchangeRateIds?: string[];
  duration: string;
  recovery: string;
  rating: number;
  reviews: number;
  popular?: boolean;
  image: string;
  images?: string[];
  attributes?: ServiceAttribute[];
  bookingUiMode?: string;
}

export interface Specialist {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  patients: string;
  rating: number;
  image: string;
  verified: boolean;
}

export interface Review {
  id: string;
  name: string;
  country: string;
  date: string;
  rating: number;
  treatment: string;
  review: string;
  verified: boolean;
  helpful: number;
  images?: string[];
}

export interface ReviewsPage {
  reviews: Review[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
}

export interface Recommendation {
  id: string;
  image: string;
  title: string;
  rating: number;
  reviewCount: number;
  city: string;
  country: string;
  verified: boolean;
  link: string;
  priceFrom?: number | null;
  currency?: string | null;
  sourcePrice?: number | null;
  sourceCurrency?: string | null;
}

export interface ProviderPageDataResponse {
  provider: Provider;
  services: Service[];
  specialists: Specialist[];
  recentReviews: Review[];
  reviewsTotal: number;
  reviewsHasMore: boolean;
  localRecommendations: Recommendation[];
  internationalRecommendations: Recommendation[];
}
