/**
 * Text folding for search. MUST stay identical to scripts/search/lib.mjs (`fold`): the
 * index is built with that one, queries are folded with this one, and a unit test runs
 * both on the same inputs.
 */
export function fold(value: unknown): string {
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
