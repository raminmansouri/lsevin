import type { GuideLocale } from "./types";

/** Interface strings for the guide pages (only the three guide languages). */
export const GUIDE_LABELS: Record<
  GuideLocale,
  {
    brand: string;
    home: string;
    section: string;
    reviewed: string;
    onThisPage: string;
    faq: string;
    sources: string;
    related: string;
    explore: string;
    categories: string;
    search: string;
    tours: string;
    consult: string;
    disclaimer: string;
  }
> = {
  fa: {
    brand: "السوین",
    home: "خانه",
    section: "گردشگری سلامت",
    reviewed: "آخرین بازبینی",
    onThisPage: "در این صفحه",
    faq: "پرسش‌های متداول",
    sources: "منابع",
    related: "راهنماهای مرتبط",
    explore: "در السوین ببینید",
    categories: "دسته‌بندی خدمات درمانی",
    search: "جستجوی پزشک و مرکز درمانی",
    tours: "تورهای سلامت و گردشگری",
    consult: "مشاوره رایگان",
    disclaimer:
      "این محتوا جنبهٔ اطلاع‌رسانی دارد و جایگزین نظر پزشک نیست. مناسب بودن هر درمان را پزشک معالج تعیین می‌کند.",
  },
  ar: {
    brand: "LSevin",
    home: "الرئيسية",
    section: "السياحة العلاجية",
    reviewed: "آخر مراجعة",
    onThisPage: "في هذه الصفحة",
    faq: "الأسئلة الشائعة",
    sources: "المصادر",
    related: "أدلة ذات صلة",
    explore: "استكشف على LSevin",
    categories: "فئات الخدمات العلاجية",
    search: "ابحث عن طبيب أو مركز علاجي",
    tours: "الجولات السياحية والصحية",
    consult: "استشارة مجانية",
    disclaimer:
      "هذا المحتوى لأغراض المعلومات فقط ولا يغني عن رأي الطبيب. يحدد الطبيب المعالج مدى ملاءمة أي علاج.",
  },
  en: {
    brand: "LSevin",
    home: "Home",
    section: "Medical tourism",
    reviewed: "Last reviewed",
    onThisPage: "On this page",
    faq: "Frequently asked questions",
    sources: "Sources",
    related: "Related guides",
    explore: "Explore on LSevin",
    categories: "Treatment categories",
    search: "Find a doctor or clinic",
    tours: "Health and leisure tours",
    consult: "Free consultation",
    disclaimer:
      "This content is for information only and does not replace medical advice. The treating physician decides whether a treatment is suitable.",
  },
};
