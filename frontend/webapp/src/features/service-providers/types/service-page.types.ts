
export interface GetServicePageByIdResponse {
  service:                      Service;
  included:                     string[];
  process:                      Process[];
  faqs:                         FAQ[];
  topReviews:                   TopReview[];
  localRecommendations:         AlRecommendation[];
  internationalRecommendations: AlRecommendation[];
}

export interface FAQ {
  q: string;
  a: string;
}

export interface AlRecommendation {
  id:          string;
  image:       string;
  title:       string;
  provider:    string;
  rating:      number;
  reviewCount: number;
  city:        string;
  country:     string;
  price:       number;
  currency:    string;
  verified:    boolean;
  link:        string;
}

export interface Process {
  step:        number;
  title:       string;
  description: string;
  duration:    string;
}

export interface Service {
  id:              string;
  name:            string;
  subtitle:        string;
  clinic:          string;
  clinicId:        string;
  location:        string;
  price:           number;
  originalPrice:   number;
  currency:        string;
  otherCurrencies: OtherCurrency[];
  rating:          number;
  reviews:         number;
  images:          string[];
  duration:        string;
  recovery:        string;
  anesthesia:      string;
  stayRequired:    string;
  verified:        boolean;
  popular:         boolean;
  successRate:     string;
  satisfaction:    string;
}

export interface OtherCurrency {
  code:   string;
  amount: number;
}

export interface TopReview {
  id:       number;
  name:     string;
  country:  string;
  date:     string;
  rating:   number;
  review:   string;
  verified: boolean;
  helpful:  number;
  images?:  string[];
}

    


  
  
  /* ----------------------------------------------------
   * Helper for the hook/query key
   * ---------------------------------------------------- */
  
  export type GetServicePageQueryKey = ['service-page', string, string]; // [tag, serviceId, locale]
  export interface GetServicePageByIdParams {
    serviceId: string;
  }


