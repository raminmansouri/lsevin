/**
 * Search normalization (C-023) and bidi isolation (C-119, S-069, AT-44).
 */
import { normalizeDigits } from "./calendar";

/** Folds Arabic/Persian letter variants, strips diacritics and tatweel, lowercases. */
export function normalizeSearchText(input: string): string {
  return normalizeDigits(String(input ?? ""))
    .normalize("NFKC")
    .replace(/[يى]/g, "ی") // Arabic yeh / alef maksura → Persian yeh
    .replace(/ك/g, "ک") // Arabic kaf → Persian keheh
    .replace(/[أإآٱ]/g, "ا") // alef variants → bare alef
    .replace(/ة/g, "ه") // teh marbuta → heh
    .replace(/ؤ/g, "و") // waw with hamza → waw
    .replace(/[ً-ٰٟـ]/g, "") // harakat, superscript alef, tatweel
    .replace(/[‌‍‎‏]/g, " ") // ZWNJ/ZWJ/marks → space
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function searchTokens(input: string): string[] {
  return normalizeSearchText(input).split(" ").filter((t) => t.length > 0).slice(0, 8);
}

const FSI = "⁨";
const PDI = "⁩";
/** Wraps a run (name, booking id, phone, amount) so it renders in its own direction. */
export function isolate(value: string | number | null | undefined): string {
  if (value == null || value === "") return "";
  return `${FSI}${String(value)}${PDI}`;
}

/** Masks a phone/email for third-party views (C-109, S-038). */
export function maskContact(value: string | null | undefined): string {
  const v = String(value ?? "");
  if (!v) return "";
  if (v.includes("@")) {
    const [user, host] = v.split("@");
    return `${user.slice(0, 1)}***@${host}`;
  }
  return v.length <= 4 ? "****" : `${"*".repeat(Math.max(v.length - 4, 0))}${v.slice(-4)}`;
}
