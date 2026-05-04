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
  }
  
  export interface Certification {
    name: string;
    issuer: string;
    verified: boolean;
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
  
  export interface SpecialistPageResponse {
    specialist: Specialist;
    education: Education[];
    certifications: Certification[];
    specializations: string[];
    achievements: Achievement[];
    recentReviews: Review[];
    beforeAfter: BeforeAfter[];
  }
  

export type SpecialistReview = Review & { id: string; providerId: string; providerName: string; images: string[]; };
