export type AssistantResultType = "service" | "provider" | "specialist";

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
  count: number;
  results: AssistantServiceResult[];
};