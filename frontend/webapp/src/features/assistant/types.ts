export type AssistantResultType = "service" | "provider" | "specialist" | "hotel";

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
