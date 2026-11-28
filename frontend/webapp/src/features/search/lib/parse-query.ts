import type { ParsedQuery, Place, SearchContext } from "../types";
import { fold } from "./fold";

const MAX_QUERY_LENGTH = 160;
const MAX_TOKENS = 12;

/**
 * Words that describe where, who or how rather than the thing itself. They are dropped from
 * the keyword part so "بهترین کلینیک کاشت مو" still matches the treatment by name.
 */
const STOP_WORDS = new Set(
  [
    // English
    "a", "an", "the", "in", "at", "for", "of", "and", "or", "with", "near", "me", "best", "top", "good", "cheap",
    "clinic", "clinics", "doctor", "doctors", "dr", "center", "centre", "centers", "hospital", "hospitals",
    "service", "services", "price", "cost", "how", "much", "to", "is", "are", "where", "find",
    // Persian
    "در", "برای", "و", "با", "از", "به", "کلینیک", "کلینیک ها", "کلینیکهای", "مرکز", "مراکز", "دکتر", "پزشک",
    "متخصص", "بیمارستان", "بهترین", "خوب", "ارزان", "خدمات", "نزدیک", "اطراف", "منطقه", "محله", "خیابان",
    "قیمت", "هزینه", "چقدر", "کجاست", "کجا",
    // Conversational filler: "ریزش مو دارم چیکار کنم" is about ریزش مو
    "دارم", "داریم", "چیکار", "چکار", "کنم", "کنیم", "بکنم", "چی", "چه", "چرا", "چطور", "چگونه", "میخوام", "میخواهم",
    "میخوایم", "خواهم", "هست", "هستش", "باید", "میشه", "می شود", "میتونم", "لطفا", "سلام", "ممنون", "یه", "یک", "این", "اون",
    "من", "ما", "شما", "تو",
    // Arabic, Turkish, Russian
    "في", "عيادة", "طبيب", "مركز", "klinik", "doktor", "merkez", "клиника", "врач", "центр", "в",
  ].map((word) => fold(word)),
);

type PlaceIndex = Map<string, Place[]>;

const indexCache = new WeakMap<SearchContext, { places: PlaceIndex }>();

function placeIndex(context: SearchContext): PlaceIndex {
  const cached = indexCache.get(context);
  if (cached) return cached.places;
  const index: PlaceIndex = new Map();
  for (const place of context.places) {
    for (const phrase of new Set([fold(place.name), ...place.aliases.map(fold)])) {
      if (phrase.length < 3) continue; // "قم" is a real city but also a verb; require context below
      const list = index.get(phrase) ?? [];
      list.push(place);
      index.set(phrase, list);
    }
  }
  // Two-letter city names (قم) are matched only exactly and only as a whole query word.
  for (const place of context.places) {
    const name = fold(place.name);
    if (name.length === 2) index.set(name, [place]);
  }
  indexCache.set(context, { places: index });
  return index;
}

/**
 * Turns "کاشت مو قیطریه تهران" into { service: [کاشت, مو], neighborhood: قیطریه, city: تهران }.
 * Pure: the places and synonyms come in through `context`.
 */
export function parseQuery(raw: string, context: SearchContext): ParsedQuery {
  const folded = fold(raw.slice(0, MAX_QUERY_LENGTH));
  const tokens = folded.split(" ").filter(Boolean).slice(0, MAX_TOKENS);
  const consumed = new Array<boolean>(tokens.length).fill(false);
  const index = placeIndex(context);

  let neighborhood: Place | null = null;
  let city: Place | null = null;

  // Longest phrase first, so "شهرک غرب" wins over a place called "غرب".
  for (let size = Math.min(3, tokens.length); size >= 1; size -= 1) {
    for (let start = 0; start + size <= tokens.length; start += 1) {
      if (consumed.slice(start, start + size).some(Boolean)) continue;
      const matches = index.get(tokens.slice(start, start + size).join(" "));
      if (!matches) continue;
      const candidate = matches.find((place) => place.kind === "neighborhood") ?? matches[0];
      if (candidate.kind === "neighborhood" && !neighborhood) neighborhood = candidate;
      else if (candidate.kind === "city" && !city) city = candidate;
      else continue;
      for (let i = start; i < start + size; i += 1) consumed[i] = true;
    }
  }

  const remaining = tokens.filter((_, i) => !consumed[i]);

  // Synonyms: the longest typed phrase that has a canonical form is replaced by it.
  const typedTokens = remaining.filter((token) => !STOP_WORDS.has(token));
  const resolved: string[] = [];
  for (let i = 0; i < remaining.length; ) {
    let replaced = false;
    for (let size = Math.min(4, remaining.length - i); size >= 1; size -= 1) {
      const canonical = context.synonyms.get(remaining.slice(i, i + size).join(" "));
      if (canonical) {
        resolved.push(...canonical.split(" "));
        i += size;
        replaced = true;
        break;
      }
    }
    if (!replaced) {
      resolved.push(remaining[i]);
      i += 1;
    }
  }
  const serviceTokens = [...new Set(resolved.filter((token) => !STOP_WORDS.has(token)))];

  const citySlug = city?.citySlug ?? neighborhood?.citySlug ?? null;
  const cityPlace =
    city ?? (neighborhood ? (context.places.find((p) => p.kind === "city" && p.citySlug === neighborhood!.citySlug) ?? null) : null);

  return { raw, folded, serviceTokens, typedTokens, neighborhood, city: cityPlace, citySlug };
}

/** The text that describes the thing wanted, for the keyword and embedding queries. */
export function serviceText(parsed: ParsedQuery): string {
  if (parsed.serviceTokens.length) return parsed.serviceTokens.join(" ");
  // Place-only query ("قیطریه"): nothing to match by words.
  return "";
}
