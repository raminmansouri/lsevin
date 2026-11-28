import "server-only";

import sql from "@/config/database/db";

import { fold } from "../lib/fold";
import { reciprocalRankFusion, type RankedList } from "../lib/fusion";
import { distanceKm, proximityBoost } from "../lib/geo";
import { parseQuery, serviceText } from "../lib/parse-query";
import {
  DOC_TYPES,
  type DocType,
  type ParsedQuery,
  type SearchParams,
  type SearchResponse,
  type SearchResult,
} from "../types";
import { getSearchContext } from "./context";
import { embedQuery } from "./embedding-client";
import { logQuery } from "./query-log";

const MAX_QUERY_LENGTH = 160;
const CANDIDATES = 60;
/** Matches ranked by the full-text query (best quality first), and the size of the typo-tolerant fallback. */
const LEXICAL_WINDOW = 1000;
const FUZZY_WINDOW = 300;
/** Trigram matching is tried only when exact matching finds fewer rows than this. */
const FUZZY_WHEN_FEWER_THAN = 10;
/** Cosine similarity of e5 vectors is compressed into ~0.75-0.90, so absolute cut-offs are tuned for this model. */
const VECTOR_MIN_SIM = Number(process.env.SEARCH_VECTOR_MIN_SIM ?? 0.78);
const VECTOR_BAND = 0.05; // keep vector hits within this distance of the best one
const VECTOR_CONFIDENT_SIM = Number(
  process.env.SEARCH_VECTOR_CONFIDENT_SIM ?? 0.86
);

const LOCALE_TAGS: Record<string, string> = {
  fa: "fa-IR",
  en: "en-US",
  ar: "ar-SA",
  tr: "tr-TR",
  ru: "ru-RU",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  zh: "zh-CN",
};

type Translations = Record<string, string>;

type DocRow = {
  doc_type: DocType;
  source_id: string;
  title: Translations;
  subtitle: Translations;
  url: string;
  image: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  price_toman: string | null;
  rating: string | null;
  review_count: number;
  quality: number;
};

type Hit = { doc_type: DocType; source_id: string };
type VectorHit = Hit & { sim: number };

const keyOf = (hit: Hit) => `${hit.doc_type}:${hit.source_id}`;

export function pickText(
  values: Translations | null | undefined,
  locale: string
): string {
  if (!values) return "";
  const tag = LOCALE_TAGS[locale] ?? locale;
  return (
    values[tag] ??
    Object.entries(values).find(([key]) =>
      key.toLowerCase().startsWith(locale.toLowerCase())
    )?.[1] ??
    values["fa-IR"] ??
    values["en-US"] ??
    Object.values(values)[0] ??
    ""
  );
}

/** Stored image references are file-server paths, media-library URLs or local assets. */
export function resolveImage(raw: string | null): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (
    value.startsWith("/images/") ||
    value.startsWith("/placeholder-") ||
    value.startsWith("/_next/")
  )
    return value;
  const base = process.env.NEXT_PUBLIC_FILES_URL?.replace(/\/+$/, "");
  const path = value.replace(/\\/g, "/").replace(/^\/+/, "");
  return base ? `${base}/${path}` : `/${path}`;
}

/** Words that are safe inside a to_tsquery: letters and digits only, each with a prefix match. */
function tsQuery(tokens: string[]): string {
  return tokens
    .map((token) => token.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean)
    .map((token) => `${token}:*`)
    .join(" & ");
}

const typeFilter = (types: DocType[] | null) =>
  types ? sql`and d.doc_type = any(${types as string[]})` : sql``;
const cityFilter = (city: string | null) =>
  city ? sql`and d.city = ${city}` : sql``;

async function lexicalHits(
  parsed: ParsedQuery,
  types: DocType[] | null,
  city: string | null
): Promise<Hit[]> {
  const text = serviceText(parsed);
  const resolved = tsQuery(parsed.serviceTokens);
  if (!resolved) return [];
  const typed = tsQuery(parsed.typedTokens) || resolved;

  // 1) Exact words (full text). Ranking every match is O(matches): a common word matches thousands
  //    of rows and ts_rank_cd cost ~30 us each (89 ms at 100k documents). So the best-quality
  //    LEXICAL_WINDOW matches are ranked, which bounds the cost (21 ms) at any catalogue size.
  const exact = await sql<Hit[]>`
    with q as (select to_tsquery('simple', ${resolved}) as a, to_tsquery('simple', ${typed}) as b)
    select c.doc_type, c.source_id from (
      select d.doc_type, d.source_id, d.tsv, d.quality
        from unified_search.documents d, q
       where d.is_public ${typeFilter(types)} ${cityFilter(city)} and (d.tsv @@ q.a or d.tsv @@ q.b)
       order by d.quality desc
       limit ${LEXICAL_WINDOW}
    ) c, q
    order by greatest(ts_rank_cd(c.tsv, q.a, 32), ts_rank_cd(c.tsv, q.b, 32)) desc, c.quality desc
    limit ${CANDIDATES}`;
  if (exact.length >= FUZZY_WHEN_FEWER_THAN || text.length < 4) return exact;

  // 2) Typo tolerance (trigrams) only when exact matching found little. As an OR branch it forced a
  //    bitmap recheck of up to every row (730 ms at 100k documents); as a bounded fallback it is 16 ms.
  const fuzzy = await sql<Hit[]>`
    select c.doc_type, c.source_id from (
      select d.doc_type, d.source_id, d.search_text, d.quality
        from unified_search.documents d
       where d.is_public ${typeFilter(types)} ${cityFilter(city)} and ${text} <% d.search_text
       limit ${FUZZY_WINDOW}
    ) c
    order by word_similarity(${text}, c.search_text) desc, c.quality desc
    limit ${CANDIDATES}`;
  const seen = new Set(exact.map(keyOf));
  return [...exact, ...fuzzy.filter((hit) => !seen.has(keyOf(hit)))].slice(
    0,
    CANDIDATES
  );
}

async function vectorHits(
  vector: string,
  types: DocType[] | null,
  city: string | null
): Promise<VectorHit[]> {
  const filtered = Boolean(types || city);
  const rows = await sql.begin(async (tx) => {
    await tx`set local hnsw.iterative_scan = relaxed_order`;
    await tx`set local hnsw.ef_search = 64`;
    // A selective filter makes the index keep scanning until enough rows qualify (86 ms at 100k
    // documents, unbounded as the catalogue grows). Capping the scan bounds it (37 ms); when the
    // capped scan comes back short, search() widens to an unfiltered pass.
    if (filtered) await tx`set local hnsw.max_scan_tuples = 5000`;
    return tx<(Hit & { sim: number })[]>`
      select d.doc_type, d.source_id, 1 - (d.embedding <=> ${vector}::halfvec) as sim
        from unified_search.documents d
       where d.is_public and d.embedding is not null ${typeFilter(types)} ${cityFilter(city)}
       order by d.embedding <=> ${vector}::halfvec
       limit ${CANDIDATES}`;
  });
  const hits = rows.map((row) => ({ ...row, sim: Number(row.sim) }));
  const best = hits[0]?.sim ?? 0;
  return hits.filter(
    (hit) => hit.sim >= VECTOR_MIN_SIM && hit.sim >= best - VECTOR_BAND
  );
}

async function geoHits(
  point: { lat: number; lng: number },
  types: DocType[] | null,
  city: string | null
): Promise<Hit[]> {
  return sql<Hit[]>`
    select d.doc_type, d.source_id
      from unified_search.documents d
     where d.is_public and d.lat is not null and d.lng is not null ${typeFilter(types)} ${cityFilter(city)}
     order by point(d.lng, d.lat) <-> point(${point.lng}, ${point.lat})
     limit ${CANDIDATES}`;
}

async function loadDocs(hits: Hit[]): Promise<Map<string, DocRow>> {
  if (!hits.length) return new Map();
  const rows = await sql<DocRow[]>`
    select d.doc_type, d.source_id, d.title, d.subtitle, d.url, d.image, d.city, d.lat, d.lng, d.price_toman,
           d.rating, d.review_count, d.quality
      from unified_search.documents d
      join unnest(${hits.map((h) => h.doc_type)}::text[], ${hits.map((h) => h.source_id)}::text[]) as k(t, i)
        on d.doc_type = k.t and d.source_id = k.i`;
  return new Map(rows.map((row) => [keyOf(row), row]));
}

type Retrieved = {
  lexical: Hit[];
  vector: VectorHit[];
  geo: Hit[];
  usedVector: boolean;
};

async function retrieve(
  parsed: ParsedQuery,
  vector: string | null,
  types: DocType[] | null,
  city: string | null,
  point: { lat: number; lng: number } | null
): Promise<Retrieved> {
  const hasService = parsed.serviceTokens.length > 0;
  const [lexical, vectorList, geo] = await Promise.all([
    hasService
      ? lexicalHits(parsed, types, city)
      : Promise.resolve([] as Hit[]),
    hasService && vector
      ? vectorHits(vector, types, city)
      : Promise.resolve([] as VectorHit[]),
    point ? geoHits(point, types, city) : Promise.resolve([] as Hit[]),
  ]);
  return {
    lexical,
    vector: vectorList,
    geo,
    usedVector: Boolean(vector) && hasService,
  };
}

export async function search(params: SearchParams): Promise<SearchResponse> {
  const started = Date.now();
  const query = params.q.trim().slice(0, MAX_QUERY_LENGTH);
  const limit = Math.min(Math.max(params.limit ?? 12, 1), 40);
  const types =
    params.type && params.type !== "all" && DOC_TYPES.includes(params.type)
      ? [params.type]
      : null;

  const context = await getSearchContext();
  const parsed = parseQuery(query, context);
  const point = parsed.neighborhood
    ? { lat: parsed.neighborhood.lat, lng: parsed.neighborhood.lng }
    : (params.near ?? null);
  const hasService = parsed.serviceTokens.length > 0;

  // The embedding is requested first and the keyword/place queries start at the same time.
  const vector = hasService ? await embedQuery(serviceText(parsed)) : null;

  // Prefer results inside the named city; widen to everywhere if that leaves too little.
  let retrieved = await retrieve(parsed, vector, types, parsed.citySlug, point);
  const found = new Set([...retrieved.lexical, ...retrieved.vector].map(keyOf));
  if (parsed.citySlug && hasService && found.size < Math.min(limit, 5)) {
    const widened = await retrieve(parsed, vector, types, null, point);
    retrieved = {
      lexical: [
        ...retrieved.lexical,
        ...widened.lexical.filter((h) => !found.has(keyOf(h))),
      ],
      vector: [
        ...retrieved.vector,
        ...widened.vector.filter((h) => !found.has(keyOf(h))),
      ],
      geo: widened.geo,
      usedVector: widened.usedVector,
    };
  }

  const lists: RankedList[] = [
    { name: "keyword", weight: 1, ids: retrieved.lexical.map(keyOf) },
    { name: "meaning", weight: 1, ids: retrieved.vector.map(keyOf) },
  ];
  // With words to match, place only re-orders what the words found; with no words ("قیطریه") it is the candidate list.
  if (!hasService)
    lists.push({ name: "place", weight: 1, ids: retrieved.geo.map(keyOf) });
  const fused = reciprocalRankFusion(lists);
  const maxFused =
    lists.reduce(
      (sum, list) => sum + (list.ids.length ? list.weight / 61 : 0),
      0
    ) || 1;

  const ranked = [...fused.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, CANDIDATES);
  const docs = await loadDocs(
    ranked.map(([key]) => ({
      doc_type: key.split(":")[0] as DocType,
      source_id: key.slice(key.indexOf(":") + 1),
    }))
  );
  const simByKey = new Map(
    retrieved.vector.map((hit) => [keyOf(hit), hit.sim])
  );
  const phrase = serviceText(parsed);

  const scored = ranked
    .map(([key, entry]) => {
      const doc = docs.get(key);
      if (!doc) return null;
      const point2 =
        point && doc.lat !== null && doc.lng !== null
          ? { lat: Number(doc.lat), lng: Number(doc.lng) }
          : null;
      const km = point && point2 ? distanceKm(point, point2) : null;
      const titles = Object.values(doc.title ?? {}).map(fold);
      const titleHit =
        phrase &&
        parsed.serviceTokens.every((token) =>
          titles.some((title) => title.includes(token))
        )
          ? 1
          : 0;
      const placeBoost =
        km !== null
          ? proximityBoost(km)
          : parsed.citySlug && doc.city === parsed.citySlug
            ? 0.6
            : 0;
      const sim = simByKey.get(key) ?? 0;
      const byKeyword = entry.lists.has("keyword");
      const byMeaning = entry.lists.has("meaning");
      const score =
        0.55 * (entry.score / maxFused) +
        0.15 * Number(doc.quality ?? 0) +
        0.15 * placeBoost +
        0.15 * titleHit;
      const confident = !hasService || byKeyword || sim >= VECTOR_CONFIDENT_SIM;
      return { key, doc, entry, km, score, confident, byKeyword, byMeaning };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort(
      (a, b) => Number(b.confident) - Number(a.confident) || b.score - a.score
    );

  const results: SearchResult[] = scored
    .slice(0, limit)
    .map(({ doc, km, score, confident, byKeyword, byMeaning }) => ({
      type: doc.doc_type,
      id: doc.source_id,
      title: pickText(doc.title, params.locale),
      subtitle: pickText(doc.subtitle, params.locale),
      href: `/${params.locale}${doc.url}`,
      image: resolveImage(doc.image),
      city: doc.city,
      rating: doc.rating === null ? null : Number(doc.rating),
      reviewCount: doc.review_count ?? 0,
      priceToman: doc.price_toman === null ? null : Number(doc.price_toman),
      distanceKm: km === null ? null : Math.round(km * 10) / 10,
      score: Number(score.toFixed(4)),
      matchedBy:
        byKeyword && byMeaning ? "both" : byKeyword ? "keyword" : "meaning",
      confident,
    }));

  const confidentCount = results.filter((result) => result.confident).length;
  const tookMs = Date.now() - started;

  void logQuery({
    query,
    normalized: parsed.folded,
    locale: params.locale,
    results: confidentCount,
    tookMs,
    usedVector: retrieved.usedVector,
    sessionHash: params.sessionHash ?? null,
  });

  const place = parsed.neighborhood ?? parsed.city;
  return {
    query,
    results,
    confidentCount,
    usedVector: retrieved.usedVector,
    place: place ? { name: place.name, kind: place.kind } : null,
    tookMs,
  };
}
