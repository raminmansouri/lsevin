const locales: Record<string, string> = {
  fa: "fa-IR",
  en: "en-US",
  tr: "tr-TR",
  es: "es-ES",
  ar: "ar-SA",
  ku: "ku-KU",
  de: "de-DE",
  fr: "fr-FR",
  ru: "ru-RU",
  tg: "tg-TJ",
  zh: "zh-CN",
};

export const catalogDataLocale = (locale: string) =>
  locales[locale.split("-")[0]] || "en-US";
