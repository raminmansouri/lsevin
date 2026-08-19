import { normalizePortalLocale } from "@core/i18n/config";

const copy = {
  fa: {
    title: "نبض بازگشت مشتری و پیگیری پیشنهاد", description: "تقاضای تکرارشونده را در سطح سرویس ببینید و جاهایی را پیدا کنید که پیشنهاد فعال یا اعتبار نظرها می‌تواند پیگیری تجاری را تقویت کند.",
    completed: "رزرو تکمیل‌شده ۹۰ روز", repeatCustomers: "مشتری تکراری ۹۰ روز", offerCoverage: "پوشش پیشنهاد برای تقاضای تکراری", offerUses: "استفاده ثبت‌شده از پیشنهاد",
    queueTitle: "فرصت‌های پیگیری اولویت‌دار", queueDescription: "فقط سرویس‌هایی با سیگنال واقعی رزرو تکمیل‌شده نمایش داده می‌شوند؛ هویت مشتری هرگز در این نما نمایش داده نمی‌شود.",
    empty: "در حال حاضر فرصت واضحی برای پیگیری تکرار خرید یا پیشنهاد پیدا نشد.", completedShort: "تکمیل‌شده", repeatShort: "تکراری", offers: "پیشنهاد فعال", uses: "استفاده", reviews: "نظر تاییدشده",
    noOffer: "تقاضای تکراری بدون پیشنهاد فعال", lowReviews: "تقاضای تکمیل‌شده با اعتبار نظر کم", noUse: "پیشنهاد فعال بدون استفاده ثبت‌شده", createOffer: "ساخت پیشنهاد", reviewProof: "بررسی اعتبار نظرها",
    notice: "این نما یک راهنمای تجاری تجمیعی است، نه سیستم انتساب بازاریابی یا پیش‌بینی بازگشت مشتری. استفاده از پیشنهاد از used_count موجود می‌آید و هیچ پیام مستقیم به مشتری ایجاد نمی‌شود.",
  },
  en: {
    title: "Repeat business & offer follow-through pulse", description: "See repeat demand at service level and find where an active offer or stronger review proof could improve commercial follow-through.",
    completed: "90-day completed bookings", repeatCustomers: "90-day repeat customers", offerCoverage: "Offer coverage on repeat demand", offerUses: "Recorded offer uses",
    queueTitle: "Priority follow-through opportunities", queueDescription: "Only services with real completed-booking signals are shown; customer identities are never surfaced in this view.",
    empty: "No clear repeat-business or offer follow-through opportunity is visible right now.", completedShort: "Completed", repeatShort: "Repeat", offers: "Active offers", uses: "Uses", reviews: "Approved reviews",
    noOffer: "Repeat demand without an active offer", lowReviews: "Completed demand with low review proof", noUse: "Active offer with no recorded use", createOffer: "Create offer", reviewProof: "Review reputation",
    notice: "This is an aggregate commercial heuristic, not marketing attribution or a rebooking prediction system. Offer use comes from the existing used_count contract and no direct customer messaging is introduced.",
  },
  ar: {
    title: "مؤشر تكرار الأعمال ومتابعة العروض", description: "شاهد الطلب المتكرر على مستوى الخدمة وحدد أين يمكن لعرض نشط أو إثبات مراجعات أقوى تحسين المتابعة التجارية.",
    completed: "حجوزات مكتملة خلال 90 يوماً", repeatCustomers: "عملاء متكررون خلال 90 يوماً", offerCoverage: "تغطية العرض للطلب المتكرر", offerUses: "استخدامات العرض المسجلة",
    queueTitle: "فرص المتابعة ذات الأولوية", queueDescription: "تظهر فقط الخدمات ذات إشارات حجز مكتملة حقيقية، ولا تُعرض هوية العملاء أبداً في هذا العرض.",
    empty: "لا توجد حالياً فرصة واضحة لتكرار الأعمال أو متابعة العروض.", completedShort: "مكتمل", repeatShort: "متكرر", offers: "عروض نشطة", uses: "استخدامات", reviews: "مراجعات معتمدة",
    noOffer: "طلب متكرر بلا عرض نشط", lowReviews: "طلب مكتمل مع إثبات مراجعات ضعيف", noUse: "عرض نشط بلا استخدام مسجل", createOffer: "إنشاء عرض", reviewProof: "مراجعة السمعة",
    notice: "هذا مؤشر تجاري تجميعي وليس نظام إسناد تسويقي أو توقع لإعادة الحجز. استخدام العرض مأخوذ من used_count الحالي ولا يضيف أي مراسلة مباشرة مع العميل.",
  },
  tr: {
    title: "Tekrar iş ve teklif takip göstergesi", description: "Hizmet bazında tekrar talebi görün; aktif teklif veya daha güçlü yorum kanıtının ticari takibi geliştirebileceği alanları bulun.",
    completed: "90 günlük tamamlanan rezervasyon", repeatCustomers: "90 günlük tekrar müşteri", offerCoverage: "Tekrar talepte teklif kapsamı", offerUses: "Kaydedilmiş teklif kullanımı",
    queueTitle: "Öncelikli takip fırsatları", queueDescription: "Yalnızca gerçek tamamlanmış rezervasyon sinyali olan hizmetler gösterilir; müşteri kimlikleri bu görünümde asla gösterilmez.",
    empty: "Şu anda belirgin bir tekrar iş veya teklif takip fırsatı görünmüyor.", completedShort: "Tamamlandı", repeatShort: "Tekrar", offers: "Aktif teklifler", uses: "Kullanım", reviews: "Onaylı yorum",
    noOffer: "Aktif teklif olmadan tekrar talep", lowReviews: "Düşük yorum kanıtıyla tamamlanmış talep", noUse: "Kayıtlı kullanımı olmayan aktif teklif", createOffer: "Teklif oluştur", reviewProof: "İtibarı incele",
    notice: "Bu toplu bir ticari sezgidir; pazarlama atfı veya yeniden rezervasyon tahmini değildir. Teklif kullanımı mevcut used_count alanından gelir ve doğrudan müşteri mesajlaşması eklenmez.",
  },
  es: {
    title: "Pulso de repetición y seguimiento de ofertas", description: "Vea la demanda repetida por servicio y detecte dónde una oferta activa o una mejor prueba de reseñas puede mejorar el seguimiento comercial.",
    completed: "Reservas completadas en 90 días", repeatCustomers: "Clientes repetidos en 90 días", offerCoverage: "Cobertura de oferta en demanda repetida", offerUses: "Usos de oferta registrados",
    queueTitle: "Oportunidades prioritarias de seguimiento", queueDescription: "Solo se muestran servicios con señales reales de reservas completadas; nunca se muestran identidades de clientes.",
    empty: "No hay una oportunidad clara de repetición o seguimiento de ofertas en este momento.", completedShort: "Completadas", repeatShort: "Repetidos", offers: "Ofertas activas", uses: "Usos", reviews: "Reseñas aprobadas",
    noOffer: "Demanda repetida sin oferta activa", lowReviews: "Demanda completada con poca prueba de reseñas", noUse: "Oferta activa sin uso registrado", createOffer: "Crear oferta", reviewProof: "Revisar reputación",
    notice: "Es una heurística comercial agregada, no atribución de marketing ni predicción de recompra. El uso de ofertas procede de used_count y no se añade mensajería directa al cliente.",
  },
  ku: {
    title: "نیشاندەری بازرگانی دووبارە و بەدواداچوونی ئۆفەر", description: "داواکاری دووبارە لە ئاستی خزمەتگوزاری ببینە و ئەو شوێنانە بدۆزەوە کە ئۆفەری چالاک یان بەڵگەی ڕیڤیووی باشتر دەتوانێت بەدواداچوونی بازرگانی بەهێز بکات.",
    completed: "حجزی تەواوبوو لە 90 ڕۆژ", repeatCustomers: "کڕیاری دووبارە لە 90 ڕۆژ", offerCoverage: "پۆششی ئۆفەر بۆ داواکاری دووبارە", offerUses: "بەکارهێنانی تۆمارکراوی ئۆفەر",
    queueTitle: "دەرفەتە پێشەنگەکانی بەدواداچوون", queueDescription: "تەنها خزمەتگوزارییەکان بە سیگناڵی ڕاستەقینەی حجزی تەواوبوو پیشان دەدرێن؛ ناسنامەی کڕیار هەرگیز پیشان نادرێت.",
    empty: "لە ئێستادا دەرفەتی ڕوونی بازرگانی دووبارە یان بەدواداچوونی ئۆفەر نییە.", completedShort: "تەواوبوو", repeatShort: "دووبارە", offers: "ئۆفەری چالاک", uses: "بەکارهێنان", reviews: "ڕیڤیووی پەسەندکراو",
    noOffer: "داواکاری دووبارە بەبێ ئۆفەری چالاک", lowReviews: "داواکاری تەواوبوو بە بەڵگەی ڕیڤیووی کەم", noUse: "ئۆفەری چالاک بەبێ بەکارهێنانی تۆمارکراو", createOffer: "دروستکردنی ئۆفەر", reviewProof: "پشکنینی ناوبانگ",
    notice: "ئەمە هێوریستیکی بازرگانی کۆکراوەیە، نە بەستنەوەی مارکێتینگ یان پێشبینی حجزی دووبارە. بەکارهێنانی ئۆفەر لە used_count ـەوە دێت و هیچ پەیامی ڕاستەوخۆ بۆ کڕیار زیاد ناکات.",
  },
  de: {
    title: "Puls für Wiederholungsgeschäft und Angebots-Follow-up", description: "Sehen Sie Wiederholungsnachfrage je Leistung und erkennen Sie, wo aktive Angebote oder stärkere Bewertungsnachweise das kommerzielle Follow-up verbessern können.",
    completed: "Abgeschlossene Buchungen 90 Tage", repeatCustomers: "Wiederkehrende Kunden 90 Tage", offerCoverage: "Angebotsabdeckung bei Wiederholungsnachfrage", offerUses: "Erfasste Angebotsnutzungen",
    queueTitle: "Priorisierte Follow-up-Chancen", queueDescription: "Es werden nur Leistungen mit echten abgeschlossenen Buchungssignalen gezeigt; Kundenidentitäten werden nie angezeigt.",
    empty: "Derzeit ist keine klare Chance für Wiederholungsgeschäft oder Angebots-Follow-up sichtbar.", completedShort: "Abgeschlossen", repeatShort: "Wiederkehrend", offers: "Aktive Angebote", uses: "Nutzungen", reviews: "Freigegebene Bewertungen",
    noOffer: "Wiederholungsnachfrage ohne aktives Angebot", lowReviews: "Abgeschlossene Nachfrage mit wenig Bewertungsnachweis", noUse: "Aktives Angebot ohne erfasste Nutzung", createOffer: "Angebot erstellen", reviewProof: "Reputation prüfen",
    notice: "Dies ist eine aggregierte kommerzielle Heuristik, keine Marketing-Attribution oder Wiederbuchungsprognose. Angebotsnutzung stammt aus used_count; direkte Kundennachrichten werden nicht eingeführt.",
  },
  fr: {
    title: "Indicateur de récurrence et de suivi des offres", description: "Visualisez la demande récurrente par service et repérez où une offre active ou davantage de preuves d'avis peut améliorer le suivi commercial.",
    completed: "Réservations terminées sur 90 jours", repeatCustomers: "Clients récurrents sur 90 jours", offerCoverage: "Couverture d'offre sur demande récurrente", offerUses: "Utilisations d'offre enregistrées",
    queueTitle: "Opportunités de suivi prioritaires", queueDescription: "Seuls les services avec de vrais signaux de réservations terminées sont affichés ; aucune identité client n'est exposée.",
    empty: "Aucune opportunité claire de récurrence ou de suivi d'offre n'est visible pour le moment.", completedShort: "Terminées", repeatShort: "Récurrents", offers: "Offres actives", uses: "Utilisations", reviews: "Avis approuvés",
    noOffer: "Demande récurrente sans offre active", lowReviews: "Demande terminée avec peu de preuves d'avis", noUse: "Offre active sans utilisation enregistrée", createOffer: "Créer une offre", reviewProof: "Voir la réputation",
    notice: "Il s'agit d'une heuristique commerciale agrégée, pas d'une attribution marketing ni d'une prédiction de nouvelle réservation. L'usage provient de used_count et aucune messagerie directe client n'est ajoutée.",
  },
} as const;

export function repeatBusinessCopy(locale?: string | null) {
  return copy[normalizePortalLocale(locale).locale];
}
