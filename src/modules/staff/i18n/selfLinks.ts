import type { PortalLocale } from "@core/i18n/config";

const copy: Record<PortalLocale, { availability: string; bookings: string }> = {
  fa: { availability: "زمان‌های در دسترس من", bookings: "رزروهای من" },
  en: { availability: "My availability", bookings: "My bookings" },
  ar: { availability: "أوقات توفري", bookings: "حجوزاتي" },
  tr: { availability: "Uygunluğum", bookings: "Rezervasyonlarım" },
  es: { availability: "Mi disponibilidad", bookings: "Mis reservas" },
  ku: { availability: "کاتە بەردەستەکانی من", bookings: "رزەرڤەکانی من" },
  de: { availability: "Meine Verfügbarkeit", bookings: "Meine Buchungen" },
  fr: { availability: "Mes disponibilités", bookings: "Mes réservations" },
};

export function staffSelfLinksCopy(locale: PortalLocale) {
  return copy[locale] ?? copy.fa;
}
