import { normalizePortalLocale } from "@core/i18n/config";

const copy = {
  fa: {
    title: "نبض قدرت ارائه سرویس", description: "سرویس‌های قابل رزرو را پیدا کنید که برای تبدیل بهتر به تصویر، محتوای محلی، پیشنهاد یا اعتبار اجتماعی قوی‌تری نیاز دارند.",
    bookable: "سرویس قابل رزرو", strength: "قدرت ارائه", strengthen: "نیازمند تقویت", demand: "تقاضای ۳۰ روز برای تقویت",
    queueTitle: "سرویس‌های اولویت‌دار برای تقویت", queueDescription: "سرویس‌های قابل رزرو با امتیاز ارائه ضعیف‌تر، با اولویت تقاضای واقعی ۳۰ روز اخیر نمایش داده می‌شوند.",
    empty: "سرویس قابل رزرو با شکاف واضح در ارائه تجاری پیدا نشد.", score: "امتیاز ارائه", bookings: "رزرو ۳۰ روز", reviews: "نظر تاییدشده", offers: "پیشنهاد فعال",
    missingMedia: "تصویر/گالری ندارد", weakContent: "محتوای محلی کم‌عمق", noOffer: "پیشنهاد فعال ندارد", lowReviews: "اعتبار نظرات کم", improve: "تقویت سرویس", manageOffers: "مدیریت پیشنهادها",
    notice: "این امتیاز یک راهنمای بازاریابی داخلی است، نه شرط اعتبار سرویس. نداشتن تخفیف یا تعداد کم نظر به معنی مشکل فنی یا غیرفعال بودن سرویس نیست.",
  },
  en: {
    title: "Service merchandising pulse", description: "Find bookable services that could convert better with stronger media, localized content, offers, or review proof.",
    bookable: "Bookable services", strength: "Merchandising strength", strengthen: "Services to strengthen", demand: "30-day demand to strengthen",
    queueTitle: "Priority services to strengthen", queueDescription: "Bookable services with weaker merchandising are ranked by real booking demand from the last 30 days.",
    empty: "No clear merchandising gaps were found among bookable services.", score: "Merchandising score", bookings: "30-day bookings", reviews: "Approved reviews", offers: "Active offers",
    missingMedia: "Missing image/gallery", weakContent: "Thin localized content", noOffer: "No active offer", lowReviews: "Low review proof", improve: "Improve service", manageOffers: "Manage offers",
    notice: "This is an internal merchandising heuristic, not a service-validity rule. No offer or limited reviews does not mean the service is technically invalid or inactive.",
  },
  ar: {
    title: "مؤشر قوة عرض الخدمة", description: "اعثر على الخدمات القابلة للحجز التي قد تتحول بشكل أفضل عبر وسائط ومحتوى محلي وعروض وإثبات مراجعات أقوى.",
    bookable: "خدمات قابلة للحجز", strength: "قوة العرض", strengthen: "خدمات تحتاج تعزيزاً", demand: "طلب 30 يوماً للتعزيز",
    queueTitle: "الخدمات ذات الأولوية للتعزيز", queueDescription: "تُرتب الخدمات القابلة للحجز ذات العرض الأضعف حسب طلب الحجز الحقيقي خلال آخر 30 يوماً.",
    empty: "لم تظهر فجوات واضحة في عرض الخدمات القابلة للحجز.", score: "درجة العرض", bookings: "حجوزات 30 يوماً", reviews: "مراجعات معتمدة", offers: "عروض نشطة",
    missingMedia: "لا توجد صورة/معرض", weakContent: "محتوى محلي ضعيف", noOffer: "لا يوجد عرض نشط", lowReviews: "إثبات مراجعات منخفض", improve: "تحسين الخدمة", manageOffers: "إدارة العروض",
    notice: "هذا مؤشر تسويقي داخلي وليس قاعدة لصلاحية الخدمة. غياب العرض أو قلة المراجعات لا يعني وجود خلل تقني أو أن الخدمة غير نشطة.",
  },
  tr: {
    title: "Hizmet sunum gücü göstergesi", description: "Daha güçlü medya, yerelleştirilmiş içerik, teklif veya yorum kanıtıyla daha iyi dönüşebilecek rezerve edilebilir hizmetleri bulun.",
    bookable: "Rezerve edilebilir hizmet", strength: "Sunum gücü", strengthen: "Güçlendirilecek hizmet", demand: "Güçlendirilecek 30 günlük talep",
    queueTitle: "Öncelikli güçlendirilecek hizmetler", queueDescription: "Sunumu zayıf rezerve edilebilir hizmetler son 30 gündeki gerçek rezervasyon talebine göre sıralanır.",
    empty: "Rezerve edilebilir hizmetlerde belirgin sunum boşluğu bulunmadı.", score: "Sunum puanı", bookings: "30 günlük rezervasyon", reviews: "Onaylı yorum", offers: "Aktif teklif",
    missingMedia: "Görsel/galeri eksik", weakContent: "Yerel içerik zayıf", noOffer: "Aktif teklif yok", lowReviews: "Yorum kanıtı düşük", improve: "Hizmeti geliştir", manageOffers: "Teklifleri yönet",
    notice: "Bu dahili bir pazarlama sezgisidir; hizmet geçerlilik kuralı değildir. Teklifin veya az yorumun olması teknik bir hata ya da pasif hizmet anlamına gelmez.",
  },
  es: {
    title: "Pulso de merchandising del servicio", description: "Detecta servicios reservables que podrían convertir mejor con mejores medios, contenido localizado, ofertas o prueba social.",
    bookable: "Servicios reservables", strength: "Fuerza comercial", strengthen: "Servicios a reforzar", demand: "Demanda de 30 días a reforzar",
    queueTitle: "Servicios prioritarios para reforzar", queueDescription: "Los servicios reservables con merchandising más débil se priorizan por demanda real de reservas de los últimos 30 días.",
    empty: "No se encontraron brechas claras de merchandising en servicios reservables.", score: "Puntuación comercial", bookings: "Reservas 30 días", reviews: "Reseñas aprobadas", offers: "Ofertas activas",
    missingMedia: "Falta imagen/galería", weakContent: "Contenido localizado escaso", noOffer: "Sin oferta activa", lowReviews: "Poca prueba de reseñas", improve: "Mejorar servicio", manageOffers: "Gestionar ofertas",
    notice: "Es una heurística interna de merchandising, no una regla de validez. No tener oferta o pocas reseñas no significa que el servicio sea inválido o esté inactivo.",
  },
  ku: {
    title: "نیشاندەری هێزی پیشاندانی خزمەتگوزاری", description: "خزمەتگوزارییە قابل حجزەکان بدۆزەوە کە بە میدیا، ناوەڕۆکی ناوخۆیی، ئۆفەر یان بەڵگەی ڕیڤیووی باشتر دەتوانن گۆڕانکاری زیاتر هەبێت.",
    bookable: "خزمەتگوزاری قابل حجز", strength: "هێزی پیشاندان", strengthen: "پێویستی بە بەهێزکردن", demand: "داواکاری 30 ڕۆژ بۆ بەهێزکردن",
    queueTitle: "خزمەتگوزارییە پێشەنگەکان بۆ بەهێزکردن", queueDescription: "خزمەتگوزارییە قابل حجزە لاوازترەکان بە پێی داواکاری ڕاستەقینەی حجز لە 30 ڕۆژی ڕابردوو ڕیز دەکرێن.",
    empty: "هیچ کەلێنی ڕوونی پیشاندانی بازرگانی لە خزمەتگوزارییە قابل حجزەکان نەدۆزرایەوە.", score: "نمرەی پیشاندان", bookings: "حجزی 30 ڕۆژ", reviews: "ڕیڤیووی پەسەندکراو", offers: "ئۆفەری چالاک",
    missingMedia: "وێنە/گالەری نییە", weakContent: "ناوەڕۆکی ناوخۆیی کەمە", noOffer: "ئۆفەری چالاک نییە", lowReviews: "بەڵگەی ڕیڤیوو کەمە", improve: "خزمەتگوزاری باشتر بکە", manageOffers: "بەڕێوەبردنی ئۆفەرەکان",
    notice: "ئەم نمرەیە ڕێنمایی ناوخۆیی بازاڕکردنە، نە یاسای دروستی خزمەتگوزاری. نەبوونی ئۆفەر یان کەمی ڕیڤیوو بە مانای کێشەی تەکنیکی یان ناچالاکی نییە.",
  },
  de: {
    title: "Service-Merchandising-Puls", description: "Finden Sie buchbare Leistungen, die mit stärkeren Medien, lokalisierten Inhalten, Angeboten oder Bewertungsnachweisen besser konvertieren könnten.",
    bookable: "Buchbare Leistungen", strength: "Merchandising-Stärke", strengthen: "Zu stärkende Leistungen", demand: "30-Tage-Nachfrage zum Stärken",
    queueTitle: "Priorisierte Leistungen zum Stärken", queueDescription: "Buchbare Leistungen mit schwächerem Merchandising werden nach realer Buchungsnachfrage der letzten 30 Tage priorisiert.",
    empty: "Bei buchbaren Leistungen wurden keine klaren Merchandising-Lücken gefunden.", score: "Merchandising-Score", bookings: "30-Tage-Buchungen", reviews: "Freigegebene Bewertungen", offers: "Aktive Angebote",
    missingMedia: "Bild/Galerie fehlt", weakContent: "Lokalisierter Inhalt zu dünn", noOffer: "Kein aktives Angebot", lowReviews: "Wenig Bewertungsnachweis", improve: "Leistung verbessern", manageOffers: "Angebote verwalten",
    notice: "Dies ist eine interne Merchandising-Heuristik, keine Gültigkeitsregel. Kein Angebot oder wenige Bewertungen bedeuten nicht, dass eine Leistung technisch ungültig oder inaktiv ist.",
  },
  fr: {
    title: "Indicateur de merchandising des services", description: "Repérez les services réservables qui pourraient mieux convertir avec de meilleurs médias, contenus localisés, offres ou preuves d'avis.",
    bookable: "Services réservables", strength: "Force merchandising", strengthen: "Services à renforcer", demand: "Demande 30 jours à renforcer",
    queueTitle: "Services prioritaires à renforcer", queueDescription: "Les services réservables au merchandising plus faible sont classés selon la demande réelle de réservation des 30 derniers jours.",
    empty: "Aucun écart clair de merchandising n'a été trouvé parmi les services réservables.", score: "Score merchandising", bookings: "Réservations 30 jours", reviews: "Avis approuvés", offers: "Offres actives",
    missingMedia: "Image/galerie manquante", weakContent: "Contenu localisé trop léger", noOffer: "Aucune offre active", lowReviews: "Peu de preuve par avis", improve: "Améliorer le service", manageOffers: "Gérer les offres",
    notice: "Il s'agit d'une heuristique interne de merchandising, pas d'une règle de validité. L'absence d'offre ou peu d'avis ne signifie pas que le service est invalide ou inactif.",
  },
} as const;

export function serviceMerchandisingCopy(locale?: string | null) {
  return copy[normalizePortalLocale(locale).locale];
}
