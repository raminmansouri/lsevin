/** A service returned by the assistant's search_services tool. */
export type AssistantServiceResult = {
  id: string;
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