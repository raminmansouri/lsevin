export type AssistantResultType = "service" | "provider" | "specialist" | "hotel" | "product" | "transfer";

/** A result returned by the assistant's search_services tool. */
export type AssistantServiceResult = {
  id: string;
  type: AssistantResultType;
  name: string;
  provider: string;
  location: string;
  rating: number;
  reviews: number;
  price: number;
  currency: string;
  image: string;
  href: string;
};

export type SearchServicesToolOutput = {
  /** How many clinics and doctors match in total; results holds the best of them. */
  clinicCount: number;
  doctorCount: number;
  results: AssistantServiceResult[];
  /** Set when nothing matched in the requested city/country, so results are from other places. */
  noMatchesIn?: string;
};

export type SearchHotelsToolOutput = {
  hotelCount: number;
  /** The stay the hotels were checked for, when the assistant passed one. */
  checkIn: string | null;
  nights: number | null;
  results: AssistantServiceResult[];
};



export type JourneyItemKind = "treatment" | "hotel" | "transfer" | "product";
export type JourneyStopKind = "arrival" | "treatment" | "recovery" | "departure";

export type JourneyItem = {
  kind: JourneyItemKind;
  title: string;
  subtitle: string;
  /** Already converted to the plan currency; 0 = price after consultation. */
  price: number;
  showPrice: boolean;
  nights?: number;
  checkout?: boolean;
  href: string | null;
};

export type JourneyStop = {
  kind: JourneyStopKind;
  dayFrom: number;
  dayTo: number;
  /** YYYY-MM-DD when the user gave an arrival date. */
  date: string | null;
  items: JourneyItem[];
};

export type JourneyPlan = {
  title: string;
  currency: string;
  total: number;
  /** True when some prices are after consultation or could not be converted. */
  totalIsPartial: boolean;
  stops: JourneyStop[];
};
