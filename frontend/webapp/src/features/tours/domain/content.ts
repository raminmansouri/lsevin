/**
 * Localized content resolution (C-046, C-117, S-072, AT-33, AT-39).
 *
 * One fallback order for every provider-authored field: requested locale →
 * same base language (e.g. "fa" for "fa-AF") → tour source locale → platform
 * fallback chain. The result says which locale was actually used so the UI can
 * label it; a field is never silently blanked and an internal key is never shown.
 */
export type ContentRow = {
  fieldKey: string;
  locale: string;
  publishedValue: string | null;
  draftValue?: string | null;
  status?: string;
};

export type Resolved = { value: string; locale: string; isFallback: boolean } | null;

export const REQUIRED_TOUR_FIELDS = ["title", "summary", "description", "meeting_instructions", "cancellation_policy", "safety_notes"] as const;
export const TOUR_TEXT_FIELDS = [
  "title", "summary", "description", "highlights", "inclusions", "exclusions", "what_to_bring",
  "accessibility_notes", "meeting_instructions", "pickup_instructions", "cancellation_policy",
  "safety_notes", "booking_instructions", "faq", "rules", "documents_notes", "age_conditions",
] as const;
export type TourTextField = (typeof TOUR_TEXT_FIELDS)[number];

export const RTL_LANGUAGES = new Set(["fa", "ar", "ku", "he", "ur", "ps", "ckb"]);
export function directionOf(locale: string): "rtl" | "ltr" {
  return RTL_LANGUAGES.has(String(locale || "").toLowerCase().split("-")[0]) ? "rtl" : "ltr";
}

const base = (tag: string) => String(tag || "").toLowerCase().split("-")[0];

export function fallbackChain(requested: string, sourceLocale: string, platformOrder: string[] = ["en-US", "fa-IR"]): string[] {
  const chain: string[] = [];
  const add = (t: string | undefined) => { if (t && !chain.includes(t)) chain.push(t); };
  add(requested);
  add(`*${base(requested)}`); // any locale sharing the base language
  for (const p of platformOrder) add(p === "source" ? sourceLocale : p);
  add(sourceLocale);
  return chain;
}

/** Resolve one field. `published` mode ignores drafts (customer view). */
export function resolveField(
  rows: ContentRow[],
  field: string,
  requested: string,
  sourceLocale: string,
  opts: { mode?: "published" | "preview"; platformOrder?: string[] } = {},
): Resolved {
  const mode = opts.mode ?? "published";
  const valueOf = (r: ContentRow) => {
    const v = mode === "preview" ? (r.draftValue ?? r.publishedValue) : r.publishedValue;
    return v != null && v.trim() !== "" ? v : null;
  };
  const candidates = rows.filter((r) => r.fieldKey === field && valueOf(r) != null);
  for (const step of fallbackChain(requested, sourceLocale, opts.platformOrder)) {
    const hit = step.startsWith("*")
      ? candidates.find((r) => base(r.locale) === step.slice(1))
      : candidates.find((r) => r.locale === step);
    if (hit) return { value: valueOf(hit)!, locale: hit.locale, isFallback: hit.locale !== requested };
  }
  return null;
}

export function resolveFields<T extends string>(
  rows: ContentRow[],
  fields: readonly T[],
  requested: string,
  sourceLocale: string,
  opts?: { mode?: "published" | "preview"; platformOrder?: string[] },
): Record<T, Resolved> {
  const out = {} as Record<T, Resolved>;
  for (const f of fields) out[f] = resolveField(rows, f, requested, sourceLocale, opts);
  return out;
}

/** Picks from a `{ "fa-IR": "...", "en-US": "..." }` JSON translations column. */
export function pickTranslation(translations: Record<string, string> | null | undefined, requested: string, fallbacks: string[] = ["en-US", "fa-IR"]): Resolved {
  if (!translations) return null;
  const entries = Object.entries(translations).filter(([, v]) => typeof v === "string" && v.trim() !== "");
  const exact = entries.find(([k]) => k === requested);
  if (exact) return { value: exact[1], locale: exact[0], isFallback: false };
  const sameBase = entries.find(([k]) => base(k) === base(requested));
  if (sameBase) return { value: sameBase[1], locale: sameBase[0], isFallback: sameBase[0] !== requested };
  for (const f of fallbacks) {
    const hit = entries.find(([k]) => k === f);
    if (hit) return { value: hit[1], locale: hit[0], isFallback: true };
  }
  const first = entries[0];
  return first ? { value: first[1], locale: first[0], isFallback: true } : null;
}

/** Translation completeness per locale for the required fields (M-007, V-064). */
export function coverage(rows: ContentRow[], locales: string[], fields: readonly string[] = REQUIRED_TOUR_FIELDS) {
  return locales.map((locale) => {
    const present = fields.filter((f) => rows.some((r) => r.fieldKey === f && r.locale === locale && ((r.draftValue ?? r.publishedValue ?? "").trim() !== "")));
    const outdated = rows.filter((r) => r.locale === locale && r.status === "outdated").length;
    return { locale, present: present.length, total: fields.length, missing: fields.filter((f) => !present.includes(f)), outdated };
  });
}

/** Platform UI locale ("fa") → content locale tag ("fa-IR"). */
export const UI_TO_CONTENT_LOCALE: Record<string, string> = {
  en: "en-US", fa: "fa-IR", tr: "tr-TR", es: "es-ES", ar: "ar-SA", ku: "ku-KU",
  de: "de-DE", fr: "fr-FR", ru: "ru-RU", tg: "tg-TJ", zh: "zh-CN",
};
export function contentLocaleFor(uiLocale: string): string {
  return UI_TO_CONTENT_LOCALE[base(uiLocale)] ?? "en-US";
}
