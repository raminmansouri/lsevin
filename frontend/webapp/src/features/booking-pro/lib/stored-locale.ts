// Translation jsonb in the DB is keyed by full locale (fa-IR, en-US, ...), but the
// app sends the short route locale (fa, en, ...). Map short -> stored key.
const STORED_LOCALE_KEYS: Record<string, string> = {
  fa: "fa-IR",
  en: "en-US",
  ar: "ar-SA",
  tr: "tr-TR",
  ru: "ru-RU",
  de: "de-DE",
  es: "es-ES",
  fr: "fr-FR",
  ku: "ku-KU",
  tg: "tg-TJ",
  zh: "zh-CN",
};

export function toStoredLocale(locale: string | null | undefined): string {
  const value = (locale || "").trim();
  if (!value) return "fa-IR";
  if (value.includes("-")) return value;
  return STORED_LOCALE_KEYS[value.toLowerCase()] ?? "fa-IR";
}
