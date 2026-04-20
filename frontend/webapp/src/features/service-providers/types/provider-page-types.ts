/* ──────────────────────────────────────────────────────────────────────────────
   1️⃣  Certifications & Provider
   ────────────────────────────────────────────────────────────────────────────── */

   export interface Certification {
    /** e.g. 'ISO 9001' */
    name: string;
    /** is this certification considered verified? */
    verified: boolean;
  }
  
  export interface Provider {
    /** string id (from a variable or hard‑coded '1') */
    id: string;
    name: string;
    tagline: string;
    location: string;
    /** decimal rating (e.g. 4.9) */
    rating: number;
    /** total number of reviews */
    reviews: number;
    verified: boolean;
    accredited: boolean;
    /** e.g. '< 2 hours' */
    responseTime: string;
    /** URLs to image assets */
    images: string[];
    /** array of certifications */
    certifications: Certification[];
    /** spoken languages */
    languages: string[];
    /** year founded */
    established: number;
    /** e.g. '50,000+' */
    totalPatients: string;
    /** e.g. '98.5%' */
    successRate: string;
  }
  
  /* ──────────────────────────────────────────────────────────────────────────────
     2️⃣  Service
     ────────────────────────────────────────────────────────────────────────────── */
  
  export interface Service {
    id: number;
    name: string;
    /** price in the selected currency */
    price: number;
    /** e.g. 'USD' */
    currency: string;
    /** e.g. '30-60 mins' */
    duration: string;
    /** e.g. '30-60 mins' */
    recovery: string;
    rating: number;
    reviews: number;
    /** only some services flag themselves as popular */
    popular?: boolean;
    image: string;
  }
  
  /* ──────────────────────────────────────────────────────────────────────────────
     3️⃣  Specialist
     ────────────────────────────────────────────────────────────────────────────── */
  
  export interface Specialist {
    id: number;
    name: string;
    specialty: string;
    /** raw string such as '18 years' */
    experience: string;
    /** raw string such as '2000+' */
    patients: string;
    rating: number;
    image: string;
    verified: boolean;
  }
  
  /* ──────────────────────────────────────────────────────────────────────────────
     4️⃣  Review
     ────────────────────────────────────────────────────────────────────────────── */
  
  export interface Review {
    id: number;
    name: string;
    country: string;
    /** e.g. '3 days ago' */
    date: string;
    rating: number;
    treatment: string;
    review: string;
    verified: boolean;
    helpful: number;
    /** not every review has images */
    images?: string[];
  }
  
  /* ──────────────────────────────────────────────────────────────────────────────
     5️⃣  Recommendation (used by both local & international arrays)
     ────────────────────────────────────────────────────────────────────────────── */
  
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
  }
  
  /* ──────────────────────────────────────────────────────────────────────────────
     6️⃣  Full data bundle (optional helper)
     ────────────────────────────────────────────────────────────────────────────── */
  
  export interface ProviderPageDataResponse {
    provider: Provider;
    services: Service[];
    specialists: Specialist[];
    recentReviews: Review[];
    localRecommendations: Recommendation[];
    internationalRecommendations: Recommendation[];
  }
  
  
  
