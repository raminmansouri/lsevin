export const DOC_TYPES = ["provider", "offer", "tour", "stay", "article"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export type Place = {
  kind: "city" | "neighborhood";
  /** Folded name. */
  name: string;
  /** Folded alternative spellings. */
  aliases: string[];
  citySlug: string;
  lat: number;
  lng: number;
  radiusM: number;
};

export type SearchContext = {
  places: Place[];
  /** folded term -> folded canonical term */
  synonyms: Map<string, string>;
};

export type ParsedQuery = {
  raw: string;
  folded: string;
  /** What the visitor is looking for, without place words, stop words; synonyms resolved. */
  serviceTokens: string[];
  /** The same words before synonym resolution (what was literally typed). */
  typedTokens: string[];
  neighborhood: Place | null;
  city: Place | null;
  /** City slug from the query: an explicit city, or the city of the neighborhood. */
  citySlug: string | null;
};

export type SearchParams = {
  q: string;
  locale: string;
  type?: DocType | "all";
  limit?: number;
  /** Visitor position for "near me" ranking. */
  near?: { lat: number; lng: number };
  sessionHash?: string | null;
};

export type SearchResult = {
  type: DocType;
  id: string;
  title: string;
  subtitle: string;
  /** Locale-prefixed path, e.g. /fa/providers/dr-ali */
  href: string;
  image: string | null;
  city: string | null;
  rating: number | null;
  reviewCount: number;
  priceToman: number | null;
  distanceKm: number | null;
  score: number;
  /** keyword = words matched, meaning = only the embedding found it, both = either agreed. */
  matchedBy: "keyword" | "meaning" | "both";
  /** False for "closest we have" results shown when nothing matched well. */
  confident: boolean;
};

export type SearchResponse = {
  query: string;
  results: SearchResult[];
  /** Results that really match; the rest are only the closest alternatives. */
  confidentCount: number;
  usedVector: boolean;
  place: { name: string; kind: Place["kind"] } | null;
  tookMs: number;
};
