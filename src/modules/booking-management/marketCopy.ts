import { normalizePortalLocale } from "@core/i18n/config";

type BookingMarketCopy = {
  title: string;
  description: string;
  bookings30d: string;
  actionCoverage: string;
  completed30d: string;
  cancelledNoShow: string;
  averageResponse: string;
  awaitingAction: string;
  overdue: string;
  queueTitle: string;
  queueDescription: string;
  emptyQueue: string;
  proxyNotice: string;
  attentionThreshold: string;
  booking: string;
  status: string;
  age: string;
  scheduled: string;
  minutes: string;
  hours: string;
  days: string;
  notAvailable: string;
};

const en: BookingMarketCopy = {
  title: "Booking response pulse",
  description: "Focus on the bookings most likely to leak because nobody on the provider side has acted on them yet.",
  bookings30d: "Bookings · 30 days",
  actionCoverage: "Provider-action coverage",
  completed30d: "Completed · 30 days",
  cancelledNoShow: "Cancelled / no-show",
  averageResponse: "Average response proxy",
  awaitingAction: "Awaiting provider action",
  overdue: "Past attention threshold",
  queueTitle: "Oldest bookings needing attention",
  queueDescription: "Oldest non-terminal bookings with no provider update yet. Work from the top of this queue using the booking controls below.",
  emptyQueue: "No unattended non-terminal bookings are waiting right now.",
  proxyNotice: "Response timing is an operational proxy based on provider_updated_at, not a promised customer SLA.",
  attentionThreshold: "Internal attention threshold: 2 hours.",
  booking: "Booking",
  status: "Status",
  age: "Waiting",
  scheduled: "Scheduled",
  minutes: "min",
  hours: "h",
  days: "d",
  notAvailable: "—",
};

const fa: BookingMarketCopy = {
  ...en,
  title: "نبض پاسخ‌گویی رزروها",
  description: "روی رزروهایی تمرکز کنید که به‌دلیل نبود اقدام از سمت ارائه‌دهنده بیشتر در معرض ریزش هستند.",
  bookings30d: "رزروهای ۳۰ روز اخیر",
  actionCoverage: "پوشش اقدام ارائه‌دهنده",
  completed30d: "تکمیل‌شده در ۳۰ روز",
  cancelledNoShow: "لغو / عدم حضور",
  averageResponse: "میانگین زمان پاسخِ تقریبی",
  awaitingAction: "در انتظار اقدام ارائه‌دهنده",
  overdue: "گذشته از آستانه توجه",
  queueTitle: "قدیمی‌ترین رزروهای نیازمند توجه",
  queueDescription: "رزروهای غیرنهایی که هنوز به‌روزرسانی ارائه‌دهنده ندارند. از بالای صف و با کنترل‌های رزرو پایین صفحه شروع کنید.",
  emptyQueue: "در حال حاضر رزرو غیرنهایی بدون اقدام وجود ندارد.",
  proxyNotice: "زمان پاسخ یک شاخص عملیاتی بر اساس provider_updated_at است و SLA وعده‌داده‌شده به مشتری نیست.",
  attentionThreshold: "آستانه داخلی توجه: ۲ ساعت.",
  booking: "رزرو",
  status: "وضعیت",
  age: "زمان انتظار",
  scheduled: "زمان رزرو",
  minutes: "دقیقه",
  hours: "ساعت",
  days: "روز",
};

const ar: BookingMarketCopy = {
  ...en,
  title: "مؤشر الاستجابة للحجوزات",
  description: "ركّز على الحجوزات الأكثر عرضة للتسرب لأنها لم تتلقَّ إجراءً من جهة مقدم الخدمة بعد.",
  bookings30d: "حجوزات آخر 30 يوماً",
  actionCoverage: "تغطية إجراء مقدم الخدمة",
  completed30d: "مكتملة خلال 30 يوماً",
  cancelledNoShow: "ملغاة / عدم حضور",
  averageResponse: "متوسط زمن الاستجابة التقريبي",
  awaitingAction: "بانتظار إجراء مقدم الخدمة",
  overdue: "تجاوزت حد الانتباه",
  queueTitle: "أقدم الحجوزات التي تحتاج انتباهاً",
  queueDescription: "حجوزات غير نهائية بلا تحديث من مقدم الخدمة. ابدأ من أعلى القائمة باستخدام أدوات الحجز أدناه.",
  emptyQueue: "لا توجد حجوزات غير نهائية بلا إجراء حالياً.",
  proxyNotice: "توقيت الاستجابة مؤشر تشغيلي مبني على provider_updated_at وليس اتفاقية SLA موعودة للعميل.",
  attentionThreshold: "حد الانتباه الداخلي: ساعتان.",
  booking: "الحجز",
  status: "الحالة",
  age: "مدة الانتظار",
  scheduled: "الموعد",
  minutes: "د",
  hours: "س",
  days: "ي",
};

const tr: BookingMarketCopy = {
  ...en,
  title: "Rezervasyon yanıt nabzı",
  description: "Sağlayıcı tarafında henüz işlem görmediği için kaybedilme riski yüksek rezervasyonlara odaklanın.",
  bookings30d: "Son 30 gün rezervasyon",
  actionCoverage: "Sağlayıcı işlem kapsamı",
  completed30d: "30 günde tamamlanan",
  cancelledNoShow: "İptal / gelmedi",
  averageResponse: "Ortalama yanıt göstergesi",
  awaitingAction: "Sağlayıcı işlemi bekliyor",
  overdue: "Dikkat eşiğini geçti",
  queueTitle: "En eski dikkat bekleyen rezervasyonlar",
  queueDescription: "Sağlayıcı güncellemesi olmayan, terminal olmayan en eski rezervasyonlar. Aşağıdaki rezervasyon kontrolleriyle listenin başından ilerleyin.",
  emptyQueue: "Şu anda işlem bekleyen terminal olmayan rezervasyon yok.",
  proxyNotice: "Yanıt süresi provider_updated_at alanına dayalı operasyonel bir göstergedir; müşteriye taahhüt edilen SLA değildir.",
  attentionThreshold: "Dahili dikkat eşiği: 2 saat.",
  booking: "Rezervasyon",
  status: "Durum",
  age: "Bekleme",
  scheduled: "Planlanan",
  minutes: "dk",
  hours: "sa",
  days: "g",
};

const es: BookingMarketCopy = {
  ...en,
  title: "Pulso de respuesta de reservas",
  description: "Prioriza las reservas con mayor riesgo de perderse porque aún no tienen una acción del proveedor.",
  bookings30d: "Reservas · 30 días",
  actionCoverage: "Cobertura de acción del proveedor",
  completed30d: "Completadas · 30 días",
  cancelledNoShow: "Canceladas / ausencias",
  averageResponse: "Promedio de respuesta aproximado",
  awaitingAction: "Esperando acción del proveedor",
  overdue: "Fuera del umbral de atención",
  queueTitle: "Reservas más antiguas que requieren atención",
  queueDescription: "Reservas no terminales sin actualización del proveedor. Empieza por la parte superior usando los controles de reserva de abajo.",
  emptyQueue: "No hay reservas no terminales sin atender en este momento.",
  proxyNotice: "El tiempo de respuesta es un indicador operativo basado en provider_updated_at, no un SLA prometido al cliente.",
  attentionThreshold: "Umbral interno de atención: 2 horas.",
  booking: "Reserva",
  status: "Estado",
  age: "Espera",
  scheduled: "Programada",
  minutes: "min",
  hours: "h",
  days: "d",
};

const ku: BookingMarketCopy = {
  ...en,
  title: "نیشاندەری وەڵامدانەوەی حجز",
  description: "سەرنج بخەرە سەر ئەو حجزانەی هێشتا هیچ کردارێکی پێشکەشکەر لەسەریان نەکراوە و مەترسی لەدەستچوونیان زیاترە.",
  bookings30d: "حجزی ٣٠ ڕۆژی ڕابردوو",
  actionCoverage: "ڕێژەی کرداری پێشکەشکەر",
  completed30d: "تەواوبوو لە ٣٠ ڕۆژ",
  cancelledNoShow: "هەڵوەشاوە / نەهاتن",
  averageResponse: "تێکڕای کاتی وەڵامی نزیکەیی",
  awaitingAction: "چاوەڕوانی کرداری پێشکەشکەر",
  overdue: "لە سنووری سەرنج تێپەڕیوە",
  queueTitle: "کۆنترین حجزە پێویست بە سەرنجەکان",
  queueDescription: "حجزە ناتەواوەکان کە هێشتا نوێکردنەوەی پێشکەشکەریان نییە. لە سەرەوەی ڕیزەکە دەست پێ بکە.",
  emptyQueue: "ئێستا هیچ حجزی ناتەواوی بێ کردار نییە.",
  proxyNotice: "کاتی وەڵام نیشاندەرێکی کارگێڕییە لەسەر بنەمای provider_updated_at و SLAی بەڵێندراو بە کڕیار نییە.",
  attentionThreshold: "سنووری ناوخۆیی سەرنج: ٢ کاتژمێر.",
  booking: "حجز",
  status: "دۆخ",
  age: "چاوەڕوانی",
  scheduled: "کاتی دیاریکراو",
  minutes: "خولەک",
  hours: "کاتژمێر",
  days: "ڕۆژ",
};

const de: BookingMarketCopy = {
  ...en,
  title: "Buchungs-Antwortpuls",
  description: "Priorisieren Sie Buchungen mit erhöhtem Verlustrisiko, bei denen noch keine Anbieteraktion erfasst wurde.",
  bookings30d: "Buchungen · 30 Tage",
  actionCoverage: "Abdeckung der Anbieteraktionen",
  completed30d: "Abgeschlossen · 30 Tage",
  cancelledNoShow: "Storniert / nicht erschienen",
  averageResponse: "Durchschnittlicher Antwort-Proxy",
  awaitingAction: "Wartet auf Anbieteraktion",
  overdue: "Aufmerksamkeitsschwelle überschritten",
  queueTitle: "Älteste Buchungen mit Handlungsbedarf",
  queueDescription: "Älteste nicht abgeschlossene Buchungen ohne Anbieteraktualisierung. Arbeiten Sie die Liste von oben mit den Buchungsaktionen darunter ab.",
  emptyQueue: "Aktuell warten keine unbehandelten, nicht abgeschlossenen Buchungen.",
  proxyNotice: "Die Antwortzeit ist ein operativer Proxy auf Basis von provider_updated_at und keine zugesagte Kunden-SLA.",
  attentionThreshold: "Interne Aufmerksamkeitsschwelle: 2 Stunden.",
  booking: "Buchung",
  status: "Status",
  age: "Wartezeit",
  scheduled: "Geplant",
  minutes: "Min.",
  hours: "Std.",
  days: "T",
};

const fr: BookingMarketCopy = {
  ...en,
  title: "Pouls de réponse des réservations",
  description: "Priorisez les réservations qui risquent le plus d'être perdues parce qu'aucune action du prestataire n'a encore été enregistrée.",
  bookings30d: "Réservations · 30 jours",
  actionCoverage: "Couverture des actions prestataire",
  completed30d: "Terminées · 30 jours",
  cancelledNoShow: "Annulées / absent",
  averageResponse: "Temps de réponse indicatif moyen",
  awaitingAction: "En attente d'action prestataire",
  overdue: "Seuil d'attention dépassé",
  queueTitle: "Plus anciennes réservations à traiter",
  queueDescription: "Réservations non terminales les plus anciennes sans mise à jour prestataire. Traitez la file depuis le haut avec les contrôles ci-dessous.",
  emptyQueue: "Aucune réservation non terminale sans action n'attend actuellement.",
  proxyNotice: "Le délai de réponse est un indicateur opérationnel basé sur provider_updated_at, et non un SLA promis au client.",
  attentionThreshold: "Seuil d'attention interne : 2 heures.",
  booking: "Réservation",
  status: "Statut",
  age: "Attente",
  scheduled: "Prévue",
  minutes: "min",
  hours: "h",
  days: "j",
};

const dictionaries = { fa, en, ar, tr, es, ku, de, fr };
export function bookingMarketCopy(locale?: string): BookingMarketCopy {
  return dictionaries[normalizePortalLocale(locale).locale as keyof typeof dictionaries] ?? en;
}
