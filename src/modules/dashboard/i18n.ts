import type { PortalLocale } from "@core/i18n/config";

export type DashboardCopy = {
  common: {
    services: string;
    staff: string;
    bookings: string;
    ready: string;
    missing: string;
  };
  provider: {
    fallbackTitle: string;
    description: string;
    profileStatus: string;
  };
};

const en: DashboardCopy = {
  common: { services: "Services", staff: "Staff", bookings: "Bookings", ready: "Ready", missing: "Missing" },
  provider: { fallbackTitle: "Provider dashboard", description: "Provider-specific operations overview.", profileStatus: "Profile status" },
};

const fa: DashboardCopy = {
  common: { services: "خدمات", staff: "پرسنل", bookings: "رزروها", ready: "آماده", missing: "ناقص" },
  provider: { fallbackTitle: "داشبورد ارائه‌دهنده", description: "نمای کلی عملیات اختصاصی ارائه‌دهنده.", profileStatus: "وضعیت پروفایل" },
};

const ar: DashboardCopy = {
  common: { services: "الخدمات", staff: "الموظفون", bookings: "الحجوزات", ready: "جاهز", missing: "ناقص" },
  provider: { fallbackTitle: "لوحة تحكم المزود", description: "نظرة عامة على عمليات المزود.", profileStatus: "حالة الملف الشخصي" },
};

const tr: DashboardCopy = {
  common: { services: "Hizmetler", staff: "Personel", bookings: "Rezervasyonlar", ready: "Hazır", missing: "Eksik" },
  provider: { fallbackTitle: "Sağlayıcı paneli", description: "Sağlayıcıya özel operasyonların genel görünümü.", profileStatus: "Profil durumu" },
};

const es: DashboardCopy = {
  common: { services: "Servicios", staff: "Personal", bookings: "Reservas", ready: "Listo", missing: "Incompleto" },
  provider: { fallbackTitle: "Panel del proveedor", description: "Resumen de operaciones específicas del proveedor.", profileStatus: "Estado del perfil" },
};

const ku: DashboardCopy = {
  common: { services: "خزمەتگوزارییەکان", staff: "ستاف", bookings: "حجزەکان", ready: "ئامادە", missing: "کەمە" },
  provider: { fallbackTitle: "داشبۆردی دابینکەر", description: "پوختەی کارە تایبەتەکانی دابینکەر.", profileStatus: "دۆخی پڕۆفایل" },
};

const de: DashboardCopy = {
  common: { services: "Services", staff: "Personal", bookings: "Buchungen", ready: "Bereit", missing: "Fehlt" },
  provider: { fallbackTitle: "Anbieter-Dashboard", description: "Übersicht der anbieterspezifischen Abläufe.", profileStatus: "Profilstatus" },
};

const fr: DashboardCopy = {
  common: { services: "Services", staff: "Personnel", bookings: "Réservations", ready: "Prêt", missing: "Manquant" },
  provider: { fallbackTitle: "Tableau de bord fournisseur", description: "Vue d’ensemble des opérations propres au fournisseur.", profileStatus: "État du profil" },
};

const dictionary: Record<PortalLocale, DashboardCopy> = { fa, en, ar, tr, es, ku, de, fr };

export function dashboardCopy(locale: PortalLocale): DashboardCopy {
  return dictionary[locale] ?? en;
}
