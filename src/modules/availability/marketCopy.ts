import { normalizePortalLocale } from "@core/i18n/config";

const copy = {
  fa: {
    title: "نبض تبدیل دسترسی به رزرو", description: "سرویس‌هایی را پیدا کنید که تقاضای واقعی دارند اما پوشش زمان‌بندی آن‌ها نیاز به بررسی دارد.",
    activeServices: "سرویس فعال", coverage: "پوشش زمان‌بندی", demandGaps: "شکاف تقاضا", upcomingRisk: "رزرو آتی نیازمند بررسی",
    queueTitle: "سرویس‌های اولویت‌دار برای بررسی", queueDescription: "ابتدا سرویس‌هایی نمایش داده می‌شوند که رزرو آتی یا تقاضای ۳۰ روز اخیر دارند ولی پوشش مثبت صریح یا ساعات کاری باز ندارند.",
    emptyQueue: "برای سرویس‌های فعال با تقاضا، شکاف زمان‌بندی پرریسکی دیده نشد.", service: "سرویس", recentDemand: "رزرو ۳۰ روز", upcoming: "رزرو آتی", coverageMode: "پوشش", blockingRules: "قاعده مسدودکننده",
    serviceRule: "قاعده سرویس", providerRule: "قاعده ارائه‌دهنده", operatingHours: "ساعات کاری", none: "بدون پوشش صریح", review: "نیازمند بررسی",
    notice: "این شاخص تنظیمات را بررسی می‌کند و جایگزین موتور واقعی محاسبه اسلات مشتری نیست. قواعد مسدودکننده ممکن است عمدی باشند.", days: "روز",
  },
  en: {
    title: "Availability conversion pulse", description: "Find active services with real booking demand whose scheduling coverage needs attention.",
    activeServices: "Active services", coverage: "Scheduling coverage", demandGaps: "Demand gaps", upcomingRisk: "Upcoming bookings to review",
    queueTitle: "Priority services to review", queueDescription: "Services with upcoming or recent 30-day bookings are ranked first when they have no explicit positive availability rule and no open operating hours.",
    emptyQueue: "No high-signal scheduling gaps were found for active services with demand.", service: "Service", recentDemand: "30-day bookings", upcoming: "Upcoming bookings", coverageMode: "Coverage", blockingRules: "Blocking rules",
    serviceRule: "Service rule", providerRule: "Provider rule", operatingHours: "Operating hours", none: "No explicit coverage", review: "Review", notice: "This is a configuration signal, not the customer slot resolver. Blocking rules may be intentional.", days: "days",
  },
  ar: {
    title: "مؤشر تحويل التوفر إلى حجوزات", description: "اعثر على الخدمات النشطة ذات الطلب الحقيقي والتي تحتاج تغطية جدولها إلى مراجعة.",
    activeServices: "الخدمات النشطة", coverage: "تغطية الجدولة", demandGaps: "فجوات الطلب", upcomingRisk: "حجوزات قادمة للمراجعة",
    queueTitle: "الخدمات ذات الأولوية للمراجعة", queueDescription: "تظهر أولاً الخدمات التي لديها حجوزات قادمة أو خلال 30 يوماً ولا تملك قاعدة توفر إيجابية صريحة ولا ساعات عمل مفتوحة.",
    emptyQueue: "لم يتم العثور على فجوات جدولة عالية الإشارة للخدمات النشطة ذات الطلب.", service: "الخدمة", recentDemand: "حجوزات 30 يوماً", upcoming: "الحجوزات القادمة", coverageMode: "التغطية", blockingRules: "قواعد الحظر",
    serviceRule: "قاعدة الخدمة", providerRule: "قاعدة المزود", operatingHours: "ساعات العمل", none: "لا توجد تغطية صريحة", review: "مراجعة", notice: "هذا مؤشر إعدادات وليس محرك حساب المواعيد الفعلي للعميل. قد تكون قواعد الحظر مقصودة.", days: "يوم",
  },
  tr: {
    title: "Uygunluk dönüşüm göstergesi", description: "Gerçek rezervasyon talebi olan ancak takvim kapsamı gözden geçirilmesi gereken aktif hizmetleri bulun.",
    activeServices: "Aktif hizmetler", coverage: "Takvim kapsamı", demandGaps: "Talep boşlukları", upcomingRisk: "İncelenecek yaklaşan rezervasyonlar",
    queueTitle: "Öncelikli incelenecek hizmetler", queueDescription: "Yaklaşan veya son 30 günde rezervasyonu olan ve açık çalışma saati ya da pozitif uygunluk kuralı bulunmayan hizmetler önce gösterilir.",
    emptyQueue: "Talebi olan aktif hizmetlerde yüksek sinyalli takvim boşluğu bulunmadı.", service: "Hizmet", recentDemand: "30 günlük rezervasyon", upcoming: "Yaklaşan rezervasyon", coverageMode: "Kapsam", blockingRules: "Engelleme kuralları",
    serviceRule: "Hizmet kuralı", providerRule: "Sağlayıcı kuralı", operatingHours: "Çalışma saatleri", none: "Açık kapsam yok", review: "İncele", notice: "Bu bir yapılandırma sinyalidir; müşteri slot çözümleyicisinin yerine geçmez. Engelleme kuralları bilinçli olabilir.", days: "gün",
  },
  es: {
    title: "Pulso de conversión de disponibilidad", description: "Detecta servicios activos con demanda real cuya cobertura de agenda necesita revisión.",
    activeServices: "Servicios activos", coverage: "Cobertura de agenda", demandGaps: "Brechas de demanda", upcomingRisk: "Reservas próximas a revisar",
    queueTitle: "Servicios prioritarios para revisar", queueDescription: "Se priorizan servicios con reservas próximas o de los últimos 30 días sin regla positiva explícita de disponibilidad ni horario abierto.",
    emptyQueue: "No se detectaron brechas de agenda de alta señal en servicios activos con demanda.", service: "Servicio", recentDemand: "Reservas 30 días", upcoming: "Reservas próximas", coverageMode: "Cobertura", blockingRules: "Reglas de bloqueo",
    serviceRule: "Regla de servicio", providerRule: "Regla del proveedor", operatingHours: "Horario", none: "Sin cobertura explícita", review: "Revisar", notice: "Es una señal de configuración, no el resolvedor real de horarios del cliente. Las reglas de bloqueo pueden ser intencionales.", days: "días",
  },
  ku: {
    title: "نیشاندەری گۆڕینی بەردەستبوون بۆ حجز", description: "خزمەتگوزارییە چالاکەکان بدۆزەوە کە داواکاری ڕاستەقینەیان هەیە بەڵام داپۆشینی کاتژمێریان پێویستی بە پشکنین هەیە.",
    activeServices: "خزمەتگوزاری چالاک", coverage: "داپۆشینی کاتژمێر", demandGaps: "کەلێنی داواکاری", upcomingRisk: "حجزی داهاتوو بۆ پشکنین",
    queueTitle: "خزمەتگوزارییە پێشەنگەکان بۆ پشکنین", queueDescription: "خزمەتگوزارییەکانی دارای حجزی داهاتوو یان 30 ڕۆژی ڕابردوو کە یاسای بەردەستبوونی پۆزەتیڤ یان کاتی کاری کراوەیان نییە لە پێشەوە نیشان دەدرێن.",
    emptyQueue: "هیچ کەلێنی کاتژمێری بەرچاوی بۆ خزمەتگوزاری چالاک و دارای داواکاری نەدۆزرایەوە.", service: "خزمەتگوزاری", recentDemand: "حجزی 30 ڕۆژ", upcoming: "حجزی داهاتوو", coverageMode: "داپۆشین", blockingRules: "یاسای بلۆک",
    serviceRule: "یاسای خزمەتگوزاری", providerRule: "یاسای پێشکەشکەر", operatingHours: "کاتی کار", none: "بێ داپۆشینی ڕوون", review: "پشکنین", notice: "ئەمە نیشاندەری ڕێکخستنە، نە موتورە ڕاستەقینەکەی حسابی کاتی بەردەست بۆ کڕیار. یاساکانی بلۆک ڕەنگە بە ئەنقەست بن.", days: "ڕۆژ",
  },
  de: {
    title: "Verfügbarkeits-Conversion-Puls", description: "Finden Sie aktive Leistungen mit echter Buchungsnachfrage, deren Terminabdeckung geprüft werden sollte.",
    activeServices: "Aktive Leistungen", coverage: "Terminabdeckung", demandGaps: "Nachfragelücken", upcomingRisk: "Kommende Buchungen prüfen",
    queueTitle: "Priorisierte Leistungen zur Prüfung", queueDescription: "Leistungen mit kommenden oder 30-Tage-Buchungen werden priorisiert, wenn weder eine positive Verfügbarkeitsregel noch offene Betriebszeiten vorhanden sind.",
    emptyQueue: "Für aktive Leistungen mit Nachfrage wurden keine eindeutigen Terminlücken gefunden.", service: "Leistung", recentDemand: "30-Tage-Buchungen", upcoming: "Kommende Buchungen", coverageMode: "Abdeckung", blockingRules: "Sperrregeln",
    serviceRule: "Leistungsregel", providerRule: "Anbieterregel", operatingHours: "Betriebszeiten", none: "Keine explizite Abdeckung", review: "Prüfen", notice: "Dies ist ein Konfigurationssignal und nicht der echte Kundenslot-Resolver. Sperrregeln können beabsichtigt sein.", days: "Tage",
  },
  fr: {
    title: "Indicateur disponibilité → réservation", description: "Repérez les services actifs avec une demande réelle dont la couverture de planning doit être vérifiée.",
    activeServices: "Services actifs", coverage: "Couverture planning", demandGaps: "Écarts de demande", upcomingRisk: "Réservations à venir à vérifier",
    queueTitle: "Services prioritaires à vérifier", queueDescription: "Les services avec des réservations à venir ou sur 30 jours sont prioritaires lorsqu'ils n'ont ni règle positive explicite de disponibilité ni horaires ouverts.",
    emptyQueue: "Aucun écart de planning à signal fort n'a été trouvé pour les services actifs avec demande.", service: "Service", recentDemand: "Réservations 30 jours", upcoming: "Réservations à venir", coverageMode: "Couverture", blockingRules: "Règles de blocage",
    serviceRule: "Règle du service", providerRule: "Règle du prestataire", operatingHours: "Horaires", none: "Aucune couverture explicite", review: "Vérifier", notice: "Il s'agit d'un signal de configuration, pas du moteur réel de créneaux client. Les règles de blocage peuvent être intentionnelles.", days: "jours",
  },
} as const;

export function availabilityMarketCopy(locale?: string | null) {
  return copy[normalizePortalLocale(locale).locale];
}
