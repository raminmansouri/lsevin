import type { DocType } from "../types";

/**
 * UI text for the search page. Kept next to the feature (Persian, English, Arabic, Turkish;
 * every other locale falls back to English) instead of the 11 global message files, so the
 * page ships without touching them.
 */
type Strings = {
  title: string;
  placeholder: string;
  submit: string;
  all: string;
  types: Record<DocType, string>;
  resultsFor: (count: number, q: string) => string;
  nearPlace: (place: string) => string;
  noExact: string;
  closest: string;
  empty: string;
  emptyHint: string;
  unavailable: string;
  tryAgain: string;
  distance: (km: number) => string;
  toman: string;
  reviews: (count: number) => string;
  suggestions: string;
  intro: string;
};

const fa: Strings = {
  title: "جستجو",
  placeholder: "مثلاً: کاشت مو قیطریه تهران",
  submit: "جستجو",
  all: "همه",
  types: {
    provider: "کلینیک و مرکز",
    offer: "خدمات",
    tour: "تور",
    stay: "اقامت",
    article: "مقاله",
  },
  resultsFor: (count, q) =>
    `${count.toLocaleString("fa-IR")} نتیجه برای «${q}»`,
  nearPlace: (place) => `مرتب‌شده بر اساس نزدیکی به ${place}`,
  noExact: "نتیجه‌ی دقیقی پیدا نشد.",
  closest: "نزدیک‌ترین گزینه‌هایی که داریم",
  empty: "چیزی پیدا نشد",
  emptyHint: "املای عبارت را بررسی کنید یا شهر یا محله را حذف کنید.",
  unavailable: "جستجو موقتاً در دسترس نیست.",
  tryAgain: "چند لحظه دیگر دوباره تلاش کنید.",
  distance: (km) => `${km.toLocaleString("fa-IR")} کیلومتر`,
  toman: "تومان",
  reviews: (count) => `${count.toLocaleString("fa-IR")} نظر`,
  suggestions: "پیشنهادها",
  intro: "نام خدمت، شهر یا محله را بنویسید.",
};

const en: Strings = {
  title: "Search",
  placeholder: "e.g. hair transplant Gheytarieh Tehran",
  submit: "Search",
  all: "All",
  types: {
    provider: "Clinics",
    offer: "Services",
    tour: "Tours",
    stay: "Stays",
    article: "Articles",
  },
  resultsFor: (count, q) =>
    `${count} result${count === 1 ? "" : "s"} for “${q}”`,
  nearPlace: (place) => `Sorted by distance to ${place}`,
  noExact: "No exact match.",
  closest: "The closest options we have",
  empty: "Nothing found",
  emptyHint: "Check the spelling, or remove the city or neighborhood.",
  unavailable: "Search is temporarily unavailable.",
  tryAgain: "Please try again in a moment.",
  distance: (km) => `${km} km`,
  toman: "Toman",
  reviews: (count) => `${count} review${count === 1 ? "" : "s"}`,
  suggestions: "Suggestions",
  intro: "Type a service, a city or a neighborhood.",
};

const ar: Strings = {
  ...en,
  title: "بحث",
  placeholder: "مثال: زراعة الشعر قيطرية طهران",
  submit: "بحث",
  all: "الكل",
  types: {
    provider: "عيادات",
    offer: "خدمات",
    tour: "جولات",
    stay: "إقامة",
    article: "مقالات",
  },
  resultsFor: (count, q) => `${count} نتيجة لـ «${q}»`,
  nearPlace: (place) => `مرتبة حسب القرب من ${place}`,
  noExact: "لا توجد نتيجة مطابقة.",
  closest: "أقرب الخيارات المتاحة",
  empty: "لم يتم العثور على شيء",
  emptyHint: "تحقق من الإملاء أو احذف المدينة أو الحي.",
  unavailable: "البحث غير متاح مؤقتاً.",
  tryAgain: "حاول مرة أخرى بعد قليل.",
  distance: (km) => `${km} كم`,
  toman: "تومان",
  reviews: (count) => `${count} تقييم`,
  suggestions: "اقتراحات",
  intro: "اكتب خدمة أو مدينة أو حياً.",
};

const tr: Strings = {
  ...en,
  title: "Ara",
  placeholder: "örn. saç ekimi Gheytarieh Tahran",
  submit: "Ara",
  all: "Tümü",
  types: {
    provider: "Klinikler",
    offer: "Hizmetler",
    tour: "Turlar",
    stay: "Konaklama",
    article: "Makaleler",
  },
  resultsFor: (count, q) => `“${q}” için ${count} sonuç`,
  nearPlace: (place) => `${place} yakınlığına göre sıralandı`,
  noExact: "Tam eşleşme yok.",
  closest: "Sahip olduğumuz en yakın seçenekler",
  empty: "Hiçbir şey bulunamadı",
  emptyHint: "Yazımı kontrol edin veya şehri ya da mahalleyi kaldırın.",
  unavailable: "Arama geçici olarak kullanılamıyor.",
  tryAgain: "Lütfen biraz sonra tekrar deneyin.",
  reviews: (count) => `${count} yorum`,
  suggestions: "Öneriler",
  intro: "Bir hizmet, şehir veya mahalle yazın.",
};

const BY_LOCALE: Record<string, Strings> = { fa, en, ar, tr };

export const stringsFor = (locale: string): Strings => BY_LOCALE[locale] ?? en;
export const isRtl = (locale: string) => ["fa", "ar", "ku"].includes(locale);
