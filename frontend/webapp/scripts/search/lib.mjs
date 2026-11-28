import { createHash } from "node:crypto";

/**
 * Text folding for search. MUST stay identical to src/features/search/lib/fold.ts
 * (a unit test compares both on the same inputs): the index is built with this and
 * queries are folded with the TypeScript copy.
 */
export function fold(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[يى]/g, "ی") // Arabic yeh / alef maqsura -> Persian yeh
    .replace(/ك/g, "ک") // Arabic kaf -> Persian kaf
    .replace(/[ً-ٰٟـ]/g, "") // harakat, dagger alif, tatweel
    .replace(/[‎‏]/g, "")
    .replace(/‌/g, " ") // ZWNJ -> space
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .toLowerCase()
    .replace(/[-_/+.,،؛;:!?؟()"'«»[\]{}|\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");

/** Rich-text fields may hold Lexical JSON; keep only the readable text. */
export function plainText(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  let text = raw;
  if (raw.startsWith("{") || raw.startsWith("[")) {
    text = [...raw.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g)]
      .map((match) => {
        try {
          return JSON.parse(`"${match[1]}"`);
        } catch {
          return match[1];
        }
      })
      .join(" ");
  }
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** {"fa-IR": "..", "en-US": ".."} -> cleaned object with only non-empty plain strings. */
export function cleanTranslations(value) {
  const out = {};
  if (!value || typeof value !== "object") return out;
  for (const [locale, text] of Object.entries(value)) {
    const clean = plainText(text);
    if (clean) out[locale] = clean;
  }
  return out;
}

export const allValues = (translations) =>
  Object.values(translations ?? {}).filter(Boolean);

export function num(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function coords(lat, lng) {
  const a = num(lat);
  const b = num(lng);
  if (
    a === null ||
    b === null ||
    Math.abs(a) > 90 ||
    Math.abs(b) > 180 ||
    (a === 0 && b === 0)
  ) {
    return { lat: null, lng: null };
  }
  return { lat: a, lng: b };
}

/**
 * 0..1 tie-breaker: rating (up to 0.5), number of reviews (0.2), featured (0.2),
 * sponsored (0.1). Reviews are log-scaled so 5 and 500 reviews are not 100x apart.
 */
export function quality({ rating, reviews, featured, sponsored }) {
  const r = Math.max(0, Math.min(5, num(rating) ?? 0)) / 5;
  const n = Math.max(0, num(reviews) ?? 0);
  const reviewScore = Math.min(1, Math.log1p(n) / Math.log1p(200));
  return Number(
    (
      0.5 * r +
      0.2 * reviewScore +
      (featured ? 0.2 : 0) +
      (sponsored ? 0.1 : 0)
    ).toFixed(3)
  );
}

/** Short text sent to the embedding model (kept small: titles + the start of the description). */
export function embeddingText(doc) {
  const titles = [...new Set(allValues(doc.title))].join(" / ");
  const subtitles = [...new Set(allValues(doc.subtitle))].join(" / ");
  const extra = (doc.embedExtra ?? []).filter(Boolean).join(". ");
  return [titles, subtitles, extra].filter(Boolean).join("\n").slice(0, 1200);
}

export const chunk = (items, size) => {
  const out = [];
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size));
  return out;
};
