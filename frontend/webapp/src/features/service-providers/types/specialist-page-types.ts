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
  
  export interface Review {
    id: number;
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
  