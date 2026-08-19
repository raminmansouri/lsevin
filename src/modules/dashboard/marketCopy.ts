import type { PortalLocale } from "@core/i18n/config";
import type { ProviderMarketActionKey } from "./marketTypes";

type ActionCopy = { title: string; description: string; cta: string };

export type ProviderMarketCopy = {
  readinessTitle: string;
  readinessDescription: string;
  scoreLabel: string;
  marketReady: string;
  awaitingActivation: string;
  activationPendingTitle: string;
  activationPendingDescription: string;
  almostReady: string;
  needsSetup: string;
  checklistTitle: string;
  checklistDescription: string;
  signalsTitle: string;
  bookings30d: string;
  activeOffers: string;
  rating: string;
  reviews: string;
  firstBooking: string;
  notYet: string;
  nextActionTitle: string;
  nextActionDescription: string;
  readOnlyNotice: string;
  ready: string;
  missing: string;
  open: string;
  gates: {
    profile: { label: string; help: string };
    services: { label: string; help: string };
    availability: { label: string; help: string };
    media: { label: string; help: string };
    offers: { label: string; help: string };
  };
  actions: Record<ProviderMarketActionKey, ActionCopy>;
};

const en: ProviderMarketCopy = {
  readinessTitle: "Market readiness",
  readinessDescription: "Complete the few provider controls that most directly affect discovery and booking readiness.",
  scoreLabel: "Readiness score",
  marketReady: "Ready for bookings",
  awaitingActivation: "Setup complete · awaiting activation",
  activationPendingTitle: "Your market setup is complete",
  activationPendingDescription: "The provider controls are ready. LSevin activation/publication still needs to be completed before treating the workspace as market-live.",
  almostReady: "Almost ready",
  needsSetup: "Needs setup",
  checklistTitle: "Path to first booking",
  checklistDescription: "Five existing LSevin capabilities make up this launch checklist. Staff is intentionally not required for solo providers.",
  signalsTitle: "Conversion signals",
  bookings30d: "Bookings · 30 days",
  activeOffers: "Active offers",
  rating: "Rating",
  reviews: "Reviews",
  firstBooking: "First booking",
  notYet: "Not yet",
  nextActionTitle: "Next best action",
  nextActionDescription: "Do the highest-impact missing step first; once ready, keep the booking queue moving.",
  readOnlyNotice: "You can view this readiness step, but a provider owner or teammate with the matching management permission must complete it.",
  ready: "Ready",
  missing: "Missing",
  open: "Open",
  gates: {
    profile: { label: "Complete provider profile", help: "Active profile with translated name, description, country and city." },
    services: { label: "Publish a service", help: "At least one active provider service customers can book." },
    availability: { label: "Open availability", help: "At least one active, available scheduling rule." },
    media: { label: "Add trust-building media", help: "At least one provider gallery item for the public experience." },
    offers: { label: "Create an active offer", help: "At least one current service-backed offer to improve conversion." },
  },
  actions: {
    profile: { title: "Finish your public profile", description: "A complete profile is the foundation for customer trust and discovery.", cta: "Complete profile" },
    services: { title: "Publish your first active service", description: "Customers need a concrete service before they can move toward booking.", cta: "Manage services" },
    availability: { title: "Open bookable availability", description: "Give customers a real path from interest to a selectable time.", cta: "Manage availability" },
    media: { title: "Add provider media", description: "Use real images or media to reduce uncertainty before customers book.", cta: "Manage media" },
    offers: { title: "Create a current offer", description: "A service-backed offer gives ready customers a stronger reason to act now.", cta: "Manage offers" },
    bookings: { title: "Work the booking queue", description: "Your market setup is ready. Keep new booking requests moving quickly.", cta: "Open bookings" },
  },
};

const fa: ProviderMarketCopy = {
  readinessTitle: "آمادگی برای بازار", readinessDescription: "چند کنترل اصلی ارائه‌دهنده را که مستقیماً بر دیده‌شدن و آمادگی رزرو اثر دارند کامل کنید.", scoreLabel: "امتیاز آمادگی", marketReady: "آماده دریافت رزرو", awaitingActivation: "تنظیمات کامل · در انتظار فعال‌سازی", activationPendingTitle: "تنظیمات بازار شما کامل است", activationPendingDescription: "کنترل‌های ارائه‌دهنده آماده‌اند؛ فعال‌سازی/انتشار توسط السوین باید پیش از فعال محسوب‌شدن در بازار تکمیل شود.", almostReady: "تقریباً آماده", needsSetup: "نیازمند تکمیل", checklistTitle: "مسیر تا اولین رزرو", checklistDescription: "این چک‌لیست فقط از پنج قابلیت موجود السوین ساخته شده است. برای ارائه‌دهندگان انفرادی داشتن پرسنل اجباری نیست.", signalsTitle: "نشانه‌های تبدیل", bookings30d: "رزروها · ۳۰ روز", activeOffers: "پیشنهادهای فعال", rating: "امتیاز", reviews: "نظرها", firstBooking: "اولین رزرو", notYet: "هنوز ثبت نشده", nextActionTitle: "بهترین اقدام بعدی", nextActionDescription: "ابتدا مهم‌ترین مرحله ناقص را انجام دهید؛ پس از آمادگی، صف رزرو را سریع پیش ببرید.", readOnlyNotice: "شما می‌توانید این وضعیت را ببینید، اما تکمیل آن به مالک یا هم‌تیمی دارای دسترسی مدیریتی مربوط نیاز دارد.", ready: "آماده", missing: "ناقص", open: "باز کردن",
  gates: { profile: { label: "تکمیل پروفایل ارائه‌دهنده", help: "پروفایل فعال با نام، توضیحات، کشور و شهر ترجمه‌شده." }, services: { label: "انتشار یک خدمت", help: "حداقل یک خدمت فعال که مشتری بتواند رزرو کند." }, availability: { label: "باز کردن زمان‌های قابل رزرو", help: "حداقل یک قانون زمان‌بندی فعال و قابل رزرو." }, media: { label: "افزودن رسانه اعتمادساز", help: "حداقل یک مورد در گالری ارائه‌دهنده برای نمایش عمومی." }, offers: { label: "ساخت پیشنهاد فعال", help: "حداقل یک پیشنهاد معتبر متصل به خدمت برای افزایش تبدیل." } },
  actions: { profile: { title: "پروفایل عمومی را کامل کنید", description: "پروفایل کامل پایه اعتماد و دیده‌شدن مشتری است.", cta: "تکمیل پروفایل" }, services: { title: "اولین خدمت فعال را منتشر کنید", description: "مشتری برای رسیدن به رزرو به یک خدمت مشخص نیاز دارد.", cta: "مدیریت خدمات" }, availability: { title: "زمان قابل رزرو باز کنید", description: "برای مشتری مسیر واقعی از علاقه تا انتخاب زمان ایجاد کنید.", cta: "مدیریت دسترس‌پذیری" }, media: { title: "رسانه ارائه‌دهنده اضافه کنید", description: "تصاویر واقعی، ابهام مشتری پیش از رزرو را کم می‌کنند.", cta: "مدیریت رسانه" }, offers: { title: "یک پیشنهاد معتبر بسازید", description: "پیشنهاد متصل به خدمت به مشتری آماده، دلیل قوی‌تری برای اقدام می‌دهد.", cta: "مدیریت پیشنهادها" }, bookings: { title: "صف رزرو را مدیریت کنید", description: "آمادگی بازار کامل است؛ درخواست‌های رزرو جدید را سریع پیش ببرید.", cta: "باز کردن رزروها" } },
};

const ar: ProviderMarketCopy = {
  readinessTitle: "الجاهزية للسوق", readinessDescription: "أكمل عناصر المزود الأكثر تأثيراً في الظهور والاستعداد للحجز.", scoreLabel: "درجة الجاهزية", marketReady: "جاهز للحجوزات", awaitingActivation: "الإعداد مكتمل · بانتظار التفعيل", activationPendingTitle: "إعداد السوق مكتمل", activationPendingDescription: "عناصر المزود جاهزة، لكن تفعيل/نشر LSevin ما زال مطلوباً قبل اعتبار مساحة العمل فعالة في السوق.", almostReady: "جاهز تقريباً", needsSetup: "يحتاج إلى إعداد", checklistTitle: "الطريق إلى أول حجز", checklistDescription: "تعتمد القائمة على خمس إمكانات موجودة في LSevin فقط، ولا يُشترط وجود موظفين للمزود الفردي.", signalsTitle: "إشارات التحويل", bookings30d: "الحجوزات · 30 يوماً", activeOffers: "العروض النشطة", rating: "التقييم", reviews: "المراجعات", firstBooking: "أول حجز", notYet: "ليس بعد", nextActionTitle: "أفضل خطوة تالية", nextActionDescription: "ابدأ بأهم خطوة ناقصة، وبعد الجاهزية حافظ على سرعة معالجة الحجوزات.", readOnlyNotice: "يمكنك مشاهدة هذه الخطوة، لكن إكمالها يحتاج إلى مالك المزود أو عضو فريق لديه صلاحية الإدارة المناسبة.", ready: "جاهز", missing: "ناقص", open: "فتح",
  gates: { profile: { label: "إكمال ملف المزود", help: "ملف نشط باسم ووصف وبلد ومدينة مترجمة." }, services: { label: "نشر خدمة", help: "خدمة مزود نشطة واحدة على الأقل قابلة للحجز." }, availability: { label: "فتح المواعيد", help: "قاعدة توفر نشطة وقابلة للحجز واحدة على الأقل." }, media: { label: "إضافة وسائط تعزز الثقة", help: "عنصر واحد على الأقل في معرض المزود." }, offers: { label: "إنشاء عرض نشط", help: "عرض حالي واحد على الأقل مرتبط بخدمة." } },
  actions: { profile: { title: "أكمل ملفك العام", description: "الملف الكامل أساس الثقة والظهور.", cta: "إكمال الملف" }, services: { title: "انشر أول خدمة نشطة", description: "يحتاج العميل إلى خدمة واضحة قبل الانتقال للحجز.", cta: "إدارة الخدمات" }, availability: { title: "افتح مواعيد قابلة للحجز", description: "امنح العميل مساراً فعلياً لاختيار الوقت.", cta: "إدارة المواعيد" }, media: { title: "أضف وسائط للمزود", description: "الصور الحقيقية تقلل تردد العميل قبل الحجز.", cta: "إدارة الوسائط" }, offers: { title: "أنشئ عرضاً حالياً", description: "العرض المرتبط بخدمة يشجع العميل الجاهز على التحرك.", cta: "إدارة العروض" }, bookings: { title: "أدر قائمة الحجوزات", description: "إعدادك للسوق جاهز؛ تعامل سريعاً مع طلبات الحجز الجديدة.", cta: "فتح الحجوزات" } },
};

const tr: ProviderMarketCopy = {
  readinessTitle: "Pazar hazırlığı", readinessDescription: "Keşfedilebilirliği ve rezervasyon hazırlığını en çok etkileyen sağlayıcı kontrollerini tamamlayın.", scoreLabel: "Hazırlık puanı", marketReady: "Rezervasyona hazır", awaitingActivation: "Kurulum tamam · aktivasyon bekleniyor", activationPendingTitle: "Pazar kurulumunuz tamamlandı", activationPendingDescription: "Sağlayıcı kontrolleri hazır. Çalışma alanı pazarda canlı sayılmadan önce LSevin aktivasyonu/yayını tamamlanmalıdır.", almostReady: "Neredeyse hazır", needsSetup: "Kurulum gerekli", checklistTitle: "İlk rezervasyona giden yol", checklistDescription: "Kontrol listesi yalnızca mevcut beş LSevin yeteneğini kullanır. Tek çalışan sağlayıcılarda personel zorunlu değildir.", signalsTitle: "Dönüşüm sinyalleri", bookings30d: "Rezervasyon · 30 gün", activeOffers: "Aktif teklifler", rating: "Puan", reviews: "Yorumlar", firstBooking: "İlk rezervasyon", notYet: "Henüz yok", nextActionTitle: "En iyi sonraki adım", nextActionDescription: "Önce en yüksek etkili eksik adımı tamamlayın; hazır olduğunuzda rezervasyon kuyruğunu hızlı tutun.", readOnlyNotice: "Bu adımı görüntüleyebilirsiniz; tamamlamak için ilgili yönetim iznine sahip sağlayıcı sahibi veya ekip üyesi gerekir.", ready: "Hazır", missing: "Eksik", open: "Aç",
  gates: { profile: { label: "Sağlayıcı profilini tamamla", help: "Çevrilmiş ad, açıklama, ülke ve şehir içeren aktif profil." }, services: { label: "Bir hizmet yayınla", help: "En az bir aktif, rezervasyon yapılabilir hizmet." }, availability: { label: "Uygunluk aç", help: "En az bir aktif ve müsait zamanlama kuralı." }, media: { label: "Güven artıran medya ekle", help: "Herkese açık deneyim için en az bir galeri öğesi." }, offers: { label: "Aktif teklif oluştur", help: "En az bir güncel, hizmete bağlı teklif." } },
  actions: { profile: { title: "Genel profilini tamamla", description: "Eksiksiz profil güven ve keşfedilebilirliğin temelidir.", cta: "Profili tamamla" }, services: { title: "İlk aktif hizmetini yayınla", description: "Müşterinin rezervasyona ilerlemesi için somut bir hizmet gerekir.", cta: "Hizmetleri yönet" }, availability: { title: "Rezervasyona açık zaman ekle", description: "İlgiden zaman seçimine gerçek bir yol oluşturun.", cta: "Uygunluğu yönet" }, media: { title: "Sağlayıcı medyası ekle", description: "Gerçek görseller rezervasyon öncesi belirsizliği azaltır.", cta: "Medyayı yönet" }, offers: { title: "Güncel bir teklif oluştur", description: "Hizmete bağlı teklif, hazır müşterinin harekete geçmesini kolaylaştırır.", cta: "Teklifleri yönet" }, bookings: { title: "Rezervasyon kuyruğunu yönet", description: "Pazar kurulumunuz hazır; yeni talepleri hızlı ilerletin.", cta: "Rezervasyonları aç" } },
};

const es: ProviderMarketCopy = {
  readinessTitle: "Preparación para el mercado", readinessDescription: "Completa los controles del proveedor que más influyen en visibilidad y reservas.", scoreLabel: "Puntuación de preparación", marketReady: "Listo para reservas", awaitingActivation: "Configuración completa · pendiente de activación", activationPendingTitle: "Tu configuración de mercado está completa", activationPendingDescription: "Los controles del proveedor están listos. La activación/publicación de LSevin debe completarse antes de considerar el espacio activo en el mercado.", almostReady: "Casi listo", needsSetup: "Necesita configuración", checklistTitle: "Camino a la primera reserva", checklistDescription: "La lista usa solo cinco capacidades existentes de LSevin. El personal no es obligatorio para proveedores individuales.", signalsTitle: "Señales de conversión", bookings30d: "Reservas · 30 días", activeOffers: "Ofertas activas", rating: "Valoración", reviews: "Reseñas", firstBooking: "Primera reserva", notYet: "Aún no", nextActionTitle: "Mejor siguiente acción", nextActionDescription: "Completa primero el paso pendiente de mayor impacto y después mantén ágil la cola de reservas.", readOnlyNotice: "Puedes ver este paso, pero debe completarlo el propietario o un miembro del equipo con el permiso de gestión correspondiente.", ready: "Listo", missing: "Pendiente", open: "Abrir",
  gates: { profile: { label: "Completar perfil", help: "Perfil activo con nombre, descripción, país y ciudad traducidos." }, services: { label: "Publicar un servicio", help: "Al menos un servicio activo que pueda reservarse." }, availability: { label: "Abrir disponibilidad", help: "Al menos una regla activa y disponible." }, media: { label: "Añadir contenido de confianza", help: "Al menos un elemento en la galería pública." }, offers: { label: "Crear una oferta activa", help: "Al menos una oferta vigente vinculada a un servicio." } },
  actions: { profile: { title: "Completa tu perfil público", description: "Un perfil completo es la base de confianza y descubrimiento.", cta: "Completar perfil" }, services: { title: "Publica tu primer servicio activo", description: "El cliente necesita un servicio concreto antes de reservar.", cta: "Gestionar servicios" }, availability: { title: "Abre horarios reservables", description: "Crea un camino real desde el interés hasta elegir una hora.", cta: "Gestionar disponibilidad" }, media: { title: "Añade contenido del proveedor", description: "Las imágenes reales reducen la incertidumbre antes de reservar.", cta: "Gestionar medios" }, offers: { title: "Crea una oferta vigente", description: "Una oferta vinculada al servicio da un motivo adicional para actuar.", cta: "Gestionar ofertas" }, bookings: { title: "Gestiona la cola de reservas", description: "Tu configuración ya está lista; mueve rápido las nuevas solicitudes.", cta: "Abrir reservas" } },
};

const ku: ProviderMarketCopy = {
  readinessTitle: "ئامادەیی بۆ بازاڕ", readinessDescription: "ئەو بەشە سەرەکییانەی دابینکەر تەواو بکە کە ڕاستەوخۆ کاریگەرییان لە دۆزینەوە و حجز هەیە.", scoreLabel: "نمرەی ئامادەیی", marketReady: "ئامادەی حجز", awaitingActivation: "ڕێکخستن تەواوە · چاوەڕوانی چالاککردن", activationPendingTitle: "ڕێکخستنی بازاڕ تەواوە", activationPendingDescription: "کۆنترۆڵەکانی دابینکەر ئامادەن؛ چالاککردن/بڵاوکردنەوەی LSevin هێشتا پێویستە پێش ئەوەی شوێنەکە چالاکی بازاڕ بزانرێت.", almostReady: "نزیکەی ئامادە", needsSetup: "پێویستی بە تەواوکردن هەیە", checklistTitle: "ڕێگا بۆ یەکەم حجز", checklistDescription: "ئەم لیستە تەنها پێنج توانای هەبووی LSevin بەکاردێنێت؛ بۆ دابینکەری تاک، ستاف مەرج نییە.", signalsTitle: "نیشانەکانی گۆڕان", bookings30d: "حجز · ٣٠ ڕۆژ", activeOffers: "پێشنیارە چالاکەکان", rating: "هەڵسەنگاندن", reviews: "بۆچوونەکان", firstBooking: "یەکەم حجز", notYet: "هێشتا نییە", nextActionTitle: "باشترین هەنگاوی داهاتوو", nextActionDescription: "سەرەتا گرنگترین هەنگاوی کەم تەواو بکە، پاشان داواکارییەکانی حجز بە خێرایی بەڕێوەببە.", readOnlyNotice: "دەتوانیت ئەم هەنگاوە ببینیت، بەڵام تەواوکردنی پێویستی بە خاوەن یان ئەندامی تیمێک هەیە کە مۆڵەتی بەڕێوەبردنی پێویست هەبێت.", ready: "ئامادە", missing: "کەمە", open: "بیکەرەوە",
  gates: { profile: { label: "پڕۆفایلی دابینکەر تەواو بکە", help: "پڕۆفایلی چالاک لەگەڵ ناو، باس، وڵات و شار." }, services: { label: "خزمەتگوزاری بڵاو بکەرەوە", help: "لانیکەم یەک خزمەتگوزاری چالاک و قابلی حجز." }, availability: { label: "کاتی بەردەست بکەرەوە", help: "لانیکەم یەک یاسای کاتی چالاک و بەردەست." }, media: { label: "میدیای متمانەپێدەر زیاد بکە", help: "لانیکەم یەک بابەتی گەلەری بۆ پیشاندانی گشتی." }, offers: { label: "پێشنیاری چالاک دروست بکە", help: "لانیکەم یەک پێشنیاری نوێ پەیوەست بە خزمەتگوزاری." } },
  actions: { profile: { title: "پڕۆفایلی گشتی تەواو بکە", description: "پڕۆفایلی تەواو بنەمای متمانە و دۆزینەوەی کڕیارە.", cta: "تەواوکردنی پڕۆفایل" }, services: { title: "یەکەم خزمەتگوزاری چالاک بڵاو بکەرەوە", description: "کڕیار پێویستی بە خزمەتگوزاری دیاریکراو هەیە بۆ چوون بۆ حجز.", cta: "بەڕێوەبردنی خزمەتگوزاری" }, availability: { title: "کاتی قابلی حجز بکەرەوە", description: "ڕێگایەکی ڕاستەقینە لە حەز تا هەڵبژاردنی کات دروست بکە.", cta: "بەڕێوەبردنی کات" }, media: { title: "میدیای دابینکەر زیاد بکە", description: "وێنەی ڕاستەقینە دوودڵی پێش حجز کەم دەکات.", cta: "بەڕێوەبردنی میدیا" }, offers: { title: "پێشنیاری نوێ دروست بکە", description: "پێشنیاری پەیوەست بە خزمەتگوزاری هاندانی کڕیاری ئامادە دەکات.", cta: "بەڕێوەبردنی پێشنیار" }, bookings: { title: "ڕیزی حجز بەڕێوەببە", description: "ئامادەیی بازاڕ تەواوە؛ داواکارییە نوێکان بە خێرایی بجوڵێنە.", cta: "کردنەوەی حجزەکان" } },
};

const de: ProviderMarketCopy = {
  readinessTitle: "Marktreife", readinessDescription: "Vervollständigen Sie die Anbieter-Bausteine mit dem größten Einfluss auf Sichtbarkeit und Buchbarkeit.", scoreLabel: "Reifegrad", marketReady: "Buchungsbereit", awaitingActivation: "Einrichtung fertig · Aktivierung ausstehend", activationPendingTitle: "Ihre Markteinrichtung ist vollständig", activationPendingDescription: "Die Anbietersteuerung ist bereit. LSevin-Aktivierung/Veröffentlichung muss noch erfolgen, bevor der Workspace als marktaktiv gilt.", almostReady: "Fast bereit", needsSetup: "Einrichtung nötig", checklistTitle: "Weg zur ersten Buchung", checklistDescription: "Die Checkliste nutzt nur fünf vorhandene LSevin-Funktionen. Personal ist für Solo-Anbieter nicht erforderlich.", signalsTitle: "Conversion-Signale", bookings30d: "Buchungen · 30 Tage", activeOffers: "Aktive Angebote", rating: "Bewertung", reviews: "Rezensionen", firstBooking: "Erste Buchung", notYet: "Noch nicht", nextActionTitle: "Nächste beste Aktion", nextActionDescription: "Erledigen Sie zuerst den wirkungsvollsten fehlenden Schritt und halten Sie danach die Buchungswarteschlange in Bewegung.", readOnlyNotice: "Sie können diesen Schritt sehen; abschließen kann ihn nur ein Anbieterinhaber oder Teammitglied mit der passenden Verwaltungsberechtigung.", ready: "Bereit", missing: "Fehlt", open: "Öffnen",
  gates: { profile: { label: "Anbieterprofil vervollständigen", help: "Aktives Profil mit übersetztem Namen, Beschreibung, Land und Stadt." }, services: { label: "Service veröffentlichen", help: "Mindestens ein aktiver buchbarer Anbieter-Service." }, availability: { label: "Verfügbarkeit öffnen", help: "Mindestens eine aktive verfügbare Terminregel." }, media: { label: "Vertrauensmedien hinzufügen", help: "Mindestens ein öffentliches Galerieelement." }, offers: { label: "Aktives Angebot erstellen", help: "Mindestens ein aktuelles servicegebundenes Angebot." } },
  actions: { profile: { title: "Öffentliches Profil vervollständigen", description: "Ein vollständiges Profil schafft Vertrauen und Auffindbarkeit.", cta: "Profil vervollständigen" }, services: { title: "Ersten aktiven Service veröffentlichen", description: "Kunden brauchen einen konkreten Service als Weg zur Buchung.", cta: "Services verwalten" }, availability: { title: "Buchbare Zeiten öffnen", description: "Schaffen Sie einen echten Weg vom Interesse zur Terminwahl.", cta: "Verfügbarkeit verwalten" }, media: { title: "Anbietermedien hinzufügen", description: "Echte Bilder reduzieren Unsicherheit vor der Buchung.", cta: "Medien verwalten" }, offers: { title: "Aktuelles Angebot erstellen", description: "Ein servicegebundenes Angebot erhöht den Handlungsanreiz.", cta: "Angebote verwalten" }, bookings: { title: "Buchungswarteschlange bearbeiten", description: "Ihre Markteinrichtung ist bereit; bearbeiten Sie neue Anfragen zügig.", cta: "Buchungen öffnen" } },
};

const fr: ProviderMarketCopy = {
  readinessTitle: "Préparation au marché", readinessDescription: "Complétez les éléments fournisseur qui influencent le plus la visibilité et la capacité à réserver.", scoreLabel: "Score de préparation", marketReady: "Prêt pour les réservations", awaitingActivation: "Configuration terminée · activation en attente", activationPendingTitle: "Votre configuration marché est terminée", activationPendingDescription: "Les contrôles fournisseur sont prêts. L’activation/publication LSevin doit encore être finalisée avant de considérer l’espace comme actif sur le marché.", almostReady: "Presque prêt", needsSetup: "Configuration requise", checklistTitle: "Chemin vers la première réservation", checklistDescription: "La liste utilise uniquement cinq capacités LSevin existantes. Le personnel n’est pas obligatoire pour un fournisseur indépendant.", signalsTitle: "Signaux de conversion", bookings30d: "Réservations · 30 jours", activeOffers: "Offres actives", rating: "Note", reviews: "Avis", firstBooking: "Première réservation", notYet: "Pas encore", nextActionTitle: "Meilleure prochaine action", nextActionDescription: "Traitez d’abord l’étape manquante la plus importante, puis gardez la file de réservations fluide.", readOnlyNotice: "Vous pouvez consulter cette étape, mais sa réalisation nécessite le propriétaire ou un membre de l’équipe disposant de l’autorisation de gestion correspondante.", ready: "Prêt", missing: "Manquant", open: "Ouvrir",
  gates: { profile: { label: "Compléter le profil", help: "Profil actif avec nom, description, pays et ville traduits." }, services: { label: "Publier un service", help: "Au moins un service actif réservable." }, availability: { label: "Ouvrir les disponibilités", help: "Au moins une règle active et disponible." }, media: { label: "Ajouter des médias de confiance", help: "Au moins un élément de galerie publique." }, offers: { label: "Créer une offre active", help: "Au moins une offre actuelle liée à un service." } },
  actions: { profile: { title: "Complétez votre profil public", description: "Un profil complet est la base de la confiance et de la découverte.", cta: "Compléter le profil" }, services: { title: "Publiez votre premier service actif", description: "Le client a besoin d’un service concret avant de réserver.", cta: "Gérer les services" }, availability: { title: "Ouvrez des créneaux réservables", description: "Créez un vrai passage de l’intérêt au choix d’un horaire.", cta: "Gérer les disponibilités" }, media: { title: "Ajoutez des médias fournisseur", description: "Des images réelles réduisent l’incertitude avant réservation.", cta: "Gérer les médias" }, offers: { title: "Créez une offre actuelle", description: "Une offre liée à un service donne une raison supplémentaire d’agir.", cta: "Gérer les offres" }, bookings: { title: "Gérez la file de réservations", description: "Votre configuration marché est prête ; traitez rapidement les nouvelles demandes.", cta: "Ouvrir les réservations" } },
};

const dictionary: Record<PortalLocale, ProviderMarketCopy> = { fa, en, ar, tr, es, ku, de, fr };

export function providerMarketCopy(locale: PortalLocale) {
  return dictionary[locale] ?? en;
}
