import type { PortalLocale } from "@core/i18n/config";

type LandingCopy = {
  language: string;
  providerTitle: string;
  providerText: string;
  apply: string;
  openPortal: string;
  promises: [string, string, string];
  stepsTitle: string;
  steps: [string, string, string];
  capabilitiesTitle: string;
  capabilities: [string, string, string, string, string, string, string, string];
  financeTitle: string;
  financeText: string;
  staffTitle: string;
  staffText: string;
  staffStart: string;
  clinicPath: string;
  staffStepsTitle: string;
  staffSteps: [string, string, string, string];
  staffToolsTitle: string;
  staffTools: [string, string, string, string, string, string];
};

const en: LandingCopy = {
  language: "Language",
  providerTitle: "Run your LSevin provider business from one trusted workspace.",
  providerText: "Apply once, receive LSevin approval, then manage the information and operations customers actually use.",
  apply: "Become a provider", openPortal: "Open my portal",
  promises: ["Shared LSevin login", "Provider and LSevin approval", "Canonical marketplace data"],
  stepsTitle: "A clear path to publishing",
  steps: ["Sign in with your LSevin account", "Submit the provider application and documents", "After approval, complete the business and publish"],
  capabilitiesTitle: "Production scope",
  capabilities: ["Provider profile", "Services and prices", "Staff profiles", "Availability", "Bookings", "Reviews", "Media library", "Support and notifications"],
  financeTitle: "Finance is part of every booking",
  financeText: "Provider prices, LSevin compensation policies, wallet movements, settlements and payouts use the existing LSevin commercial records.",
  staffTitle: "Own and manage your verified LSevin staff profile.",
  staffText: "Doctors, specialists, trainers and other staff can claim or request a profile connected to an approved provider.",
  staffStart: "Claim or create staff profile", clinicPath: "I represent a provider",
  staffStepsTitle: "Protected staff ownership",
  staffSteps: ["Select an existing profile or request a new one", "The clinic confirms the relationship", "LSevin verifies the request", "Manage only your approved profile and work"],
  staffToolsTitle: "What approved staff can manage",
  staffTools: ["Multilingual profile", "Assigned service prices", "Availability", "Assigned bookings", "Own reviews", "Owned provider media"],
};

export const landingCopy: Record<PortalLocale, LandingCopy> = {
  en,
  fa: {
    language: "زبان",
    providerTitle: "کسب‌وکار ارائه‌دهندگی خود در السوین را از یک محیط مطمئن مدیریت کنید.",
    providerText: "یک‌بار درخواست بدهید، تأیید السوین را دریافت کنید و سپس اطلاعات و عملیات واقعی مورد استفاده مشتری را مدیریت کنید.",
    apply: "درخواست ارائه‌دهندگی", openPortal: "ورود به پرتال من",
    promises: ["ورود مشترک با السوین", "تأیید ارائه‌دهنده و السوین", "اطلاعات مرجع بازار"],
    stepsTitle: "مسیر روشن تا انتشار",
    steps: ["با حساب السوین وارد شوید", "درخواست و مدارک ارائه‌دهنده را ارسال کنید", "پس از تأیید، کسب‌وکار را تکمیل و منتشر کنید"],
    capabilitiesTitle: "دامنه نسخه تولید",
    capabilities: ["پروفایل ارائه‌دهنده", "خدمات و قیمت‌ها", "پروفایل کارکنان", "زمان‌های در دسترس", "رزروها", "نظرها", "کتابخانه رسانه", "پشتیبانی و اعلان‌ها"],
    financeTitle: "مالی بخشی از هر رزرو است",
    financeText: "قیمت ارائه‌دهنده، سیاست‌های سهم السوین، گردش کیف پول، تسویه و پرداخت همگی از رکوردهای تجاری فعلی السوین استفاده می‌کنند.",
    staffTitle: "مالک پروفایل تأییدشده خود در السوین باشید و آن را مدیریت کنید.",
    staffText: "پزشکان، متخصصان، مربیان و سایر کارکنان می‌توانند پروفایل متصل به یک ارائه‌دهنده تأییدشده را درخواست یا تصاحب کنند.",
    staffStart: "درخواست یا ساخت پروفایل کارمند", clinicPath: "نماینده یک ارائه‌دهنده هستم",
    staffStepsTitle: "مالکیت محافظت‌شده کارکنان",
    staffSteps: ["پروفایل موجود را انتخاب یا پروفایل جدید درخواست کنید", "کلینیک رابطه کاری را تأیید می‌کند", "السوین درخواست را بررسی می‌کند", "فقط پروفایل و کارهای تأییدشده خود را مدیریت کنید"],
    staffToolsTitle: "امکانات کارمند تأییدشده",
    staffTools: ["پروفایل چندزبانه", "قیمت خدمات تخصیص‌یافته", "زمان‌های در دسترس", "رزروهای تخصیص‌یافته", "نظرهای خود", "رسانه‌های متعلق به ارائه‌دهنده"],
  },
  ar: {
    language: "اللغة", providerTitle: "أدر أعمالك كمزوّد في LSevin من مساحة عمل واحدة موثوقة.", providerText: "قدّم الطلب مرة واحدة، واحصل على موافقة LSevin، ثم أدر البيانات والعمليات التي يستخدمها العملاء فعلاً.", apply: "التقديم كمزوّد", openPortal: "فتح بوابتي", promises: ["تسجيل دخول LSevin موحّد", "موافقة المزوّد وLSevin", "بيانات السوق المعتمدة"], stepsTitle: "مسار واضح للنشر", steps: ["سجّل الدخول بحساب LSevin", "أرسل طلب المزوّد والمستندات", "بعد الموافقة أكمل العمل وانشره"], capabilitiesTitle: "نطاق الإصدار الإنتاجي", capabilities: ["ملف المزوّد", "الخدمات والأسعار", "ملفات الموظفين", "المواعيد المتاحة", "الحجوزات", "التقييمات", "مكتبة الوسائط", "الدعم والإشعارات"], financeTitle: "المالية جزء من كل حجز", financeText: "تستخدم أسعار المزوّد وسياسات حصة LSevin والمحفظة والتسويات والمدفوعات سجلات LSevin التجارية الحالية.", staffTitle: "امتلك وأدر ملفك الوظيفي الموثق في LSevin.", staffText: "يمكن للأطباء والمتخصصين والمدربين والموظفين طلب ملف مرتبط بمزوّد معتمد.", staffStart: "المطالبة بملف موظف أو إنشاؤه", clinicPath: "أنا أمثل مزوّدًا", staffStepsTitle: "ملكية موظف محمية", staffSteps: ["اختر ملفًا موجودًا أو اطلب ملفًا جديدًا", "تؤكد العيادة العلاقة", "تتحقق LSevin من الطلب", "أدر ملفك وأعمالك المعتمدة فقط"], staffToolsTitle: "ما يمكن للموظف المعتمد إدارته", staffTools: ["ملف متعدد اللغات", "أسعار الخدمات المسندة", "الأوقات المتاحة", "الحجوزات المسندة", "تقييماته", "وسائط المزوّد المملوكة"],
  },
  tr: {
    language: "Dil", providerTitle: "LSevin sağlayıcı işletmenizi tek ve güvenilir bir çalışma alanından yönetin.", providerText: "Bir kez başvurun, LSevin onayını alın ve müşterilerin gerçekten kullandığı bilgileri ve işlemleri yönetin.", apply: "Sağlayıcı ol", openPortal: "Portalımı aç", promises: ["Ortak LSevin girişi", "Sağlayıcı ve LSevin onayı", "Kanonik pazar verisi"], stepsTitle: "Yayına giden açık yol", steps: ["LSevin hesabınızla giriş yapın", "Başvuru ve belgeleri gönderin", "Onaydan sonra işletmeyi tamamlayıp yayınlayın"], capabilitiesTitle: "Üretim kapsamı", capabilities: ["Sağlayıcı profili", "Hizmetler ve fiyatlar", "Personel profilleri", "Uygunluk", "Rezervasyonlar", "Yorumlar", "Medya kütüphanesi", "Destek ve bildirimler"], financeTitle: "Finans her rezervasyonun parçasıdır", financeText: "Sağlayıcı fiyatları, LSevin pay politikaları, cüzdan hareketleri, mutabakatlar ve ödemeler mevcut LSevin ticari kayıtlarını kullanır.", staffTitle: "Doğrulanmış LSevin personel profilinizin sahibi olun.", staffText: "Doktorlar, uzmanlar, eğitmenler ve diğer personel onaylı bir sağlayıcıya bağlı profili talep edebilir.", staffStart: "Personel profili talep et veya oluştur", clinicPath: "Bir sağlayıcıyı temsil ediyorum", staffStepsTitle: "Korumalı personel sahipliği", staffSteps: ["Mevcut profili seçin veya yenisini isteyin", "Klinik ilişkiyi onaylar", "LSevin talebi doğrular", "Yalnızca onaylı profilinizi ve işinizi yönetin"], staffToolsTitle: "Onaylı personelin yönetebilecekleri", staffTools: ["Çok dilli profil", "Atanan hizmet fiyatları", "Uygunluk", "Atanan rezervasyonlar", "Kendi yorumları", "Sağlayıcı medyası"],
  },
  es: {
    language: "Idioma", providerTitle: "Gestiona tu negocio proveedor de LSevin desde un único espacio confiable.", providerText: "Solicita una vez, recibe la aprobación de LSevin y gestiona la información y operaciones que usan los clientes.", apply: "Ser proveedor", openPortal: "Abrir mi portal", promises: ["Acceso compartido de LSevin", "Aprobación del proveedor y LSevin", "Datos oficiales del mercado"], stepsTitle: "Un camino claro a publicación", steps: ["Inicia sesión con tu cuenta LSevin", "Envía la solicitud y los documentos", "Tras la aprobación, completa y publica el negocio"], capabilitiesTitle: "Alcance de producción", capabilities: ["Perfil del proveedor", "Servicios y precios", "Perfiles del personal", "Disponibilidad", "Reservas", "Reseñas", "Biblioteca multimedia", "Soporte y notificaciones"], financeTitle: "Las finanzas forman parte de cada reserva", financeText: "Los precios, comisiones de LSevin, movimientos de cartera, liquidaciones y pagos usan los registros comerciales existentes de LSevin.", staffTitle: "Controla tu perfil profesional verificado en LSevin.", staffText: "Médicos, especialistas, entrenadores y demás personal pueden solicitar un perfil vinculado a un proveedor aprobado.", staffStart: "Solicitar o crear perfil", clinicPath: "Represento a un proveedor", staffStepsTitle: "Propiedad de perfil protegida", staffSteps: ["Elige un perfil existente o solicita uno nuevo", "La clínica confirma la relación", "LSevin verifica la solicitud", "Gestiona solo tu perfil y trabajo aprobados"], staffToolsTitle: "Qué puede gestionar el personal aprobado", staffTools: ["Perfil multilingüe", "Precios asignados", "Disponibilidad", "Reservas asignadas", "Reseñas propias", "Multimedia del proveedor"],
  },
  ku: {
    language: "زمان", providerTitle: "کاروباری پێشکەشکارییەکەت لە LSevin لە یەک شوێنی متمانەپێکراو بەڕێوەببە.", providerText: "یەکجار داواکاری بنێرە، پەسەندی LSevin وەربگرە و زانیاری و کارە سەرەکییەکان بەڕێوەببە.", apply: "بوون بە پێشکەشکار", openPortal: "کردنەوەی پۆرتاڵ", promises: ["چوونەژوورەوەی هاوبەشی LSevin", "پەسەندی پێشکەشکار و LSevin", "داتای فەرمی بازاڕ"], stepsTitle: "ڕێگای ڕوون بۆ بڵاوکردنەوە", steps: ["بە هەژماری LSevin بچۆ ژوورەوە", "داواکاری و بەڵگەکان بنێرە", "دوای پەسەندکردن کاروبارەکەت تەواو و بڵاوبکەرەوە"], capabilitiesTitle: "سنووری وەشانی بەرهەم", capabilities: ["پڕۆفایلی پێشکەشکار", "خزمەتگوزاری و نرخ", "پڕۆفایلی ستاف", "کاتی بەردەست", "حجزەکان", "هەڵسەنگاندن", "کتێبخانەی میدیا", "پشتیوانی و ئاگادارکردنەوە"], financeTitle: "دارایی بەشێکە لە هەر حجزێک", financeText: "نرخەکان، سیاسەتی بەشی LSevin، جوڵەی جزدان، تسویە و پارەدان لە تۆمارە بازرگانییەکانی LSevin بەکاردەهێنن.", staffTitle: "خاوەنی پڕۆفایلی پشتڕاستکراوەی ستافی LSevin بە.", staffText: "پزیشک، پسپۆڕ، ڕاهێنەر و ستاف دەتوانن داوای پڕۆفایلێکی بەستراو بە پێشکەشکاری پەسەندکراو بکەن.", staffStart: "داواکردن یان دروستکردنی پڕۆفایل", clinicPath: "نوێنەری پێشکەشکارم", staffStepsTitle: "خاوەنداری پارێزراوی ستاف", staffSteps: ["پڕۆفایلی هەبوو هەڵبژێرە یان نوێ داوابکە", "کلینیک پەیوەندییەکە پشتڕاست دەکات", "LSevin داواکارییەکە دەپسێنێت", "تەنها پڕۆفایل و کاری پەسەندکراوت بەڕێوەببە"], staffToolsTitle: "ستافی پەسەندکراو چی بەڕێوەدەبات", staffTools: ["پڕۆفایلی چەندزمانە", "نرخی خزمەتگوزارییە سپێردراوەکان", "کاتی بەردەست", "حجزە سپێردراوەکان", "هەڵسەنگاندنی خۆی", "میدیای پێشکەشکار"],
  },
  de: {
    language: "Sprache", providerTitle: "Verwalten Sie Ihr LSevin-Anbietergeschäft in einem vertrauenswürdigen Arbeitsbereich.", providerText: "Einmal bewerben, die LSevin-Freigabe erhalten und anschließend die tatsächlich genutzten Daten und Abläufe verwalten.", apply: "Anbieter werden", openPortal: "Mein Portal öffnen", promises: ["Gemeinsame LSevin-Anmeldung", "Anbieter- und LSevin-Freigabe", "Verbindliche Marktdaten"], stepsTitle: "Ein klarer Weg zur Veröffentlichung", steps: ["Mit dem LSevin-Konto anmelden", "Antrag und Unterlagen einreichen", "Nach Freigabe vervollständigen und veröffentlichen"], capabilitiesTitle: "Produktionsumfang", capabilities: ["Anbieterprofil", "Leistungen und Preise", "Mitarbeiterprofile", "Verfügbarkeit", "Buchungen", "Bewertungen", "Medienbibliothek", "Support und Benachrichtigungen"], financeTitle: "Finanzen gehören zu jeder Buchung", financeText: "Preise, LSevin-Vergütungsregeln, Wallet-Bewegungen, Abrechnungen und Auszahlungen nutzen die bestehenden LSevin-Geschäftsdaten.", staffTitle: "Verwalten Sie Ihr verifiziertes LSevin-Mitarbeiterprofil.", staffText: "Ärzte, Fachkräfte, Trainer und weitere Mitarbeiter können ein mit einem freigegebenen Anbieter verbundenes Profil beantragen.", staffStart: "Mitarbeiterprofil beantragen", clinicPath: "Ich vertrete einen Anbieter", staffStepsTitle: "Geschützte Profilinhaberschaft", staffSteps: ["Bestehendes Profil wählen oder neues beantragen", "Die Klinik bestätigt die Beziehung", "LSevin prüft den Antrag", "Nur das freigegebene Profil und die eigene Arbeit verwalten"], staffToolsTitle: "Funktionen für freigegebene Mitarbeiter", staffTools: ["Mehrsprachiges Profil", "Zugewiesene Leistungspreise", "Verfügbarkeit", "Zugewiesene Buchungen", "Eigene Bewertungen", "Anbietermedien"],
  },
  fr: {
    language: "Langue", providerTitle: "Gérez votre activité de prestataire LSevin depuis un espace unique et fiable.", providerText: "Déposez une seule demande, obtenez l’approbation de LSevin, puis gérez les données et opérations réellement utilisées par les clients.", apply: "Devenir prestataire", openPortal: "Ouvrir mon portail", promises: ["Connexion LSevin partagée", "Approbation du prestataire et de LSevin", "Données officielles de la place de marché"], stepsTitle: "Un parcours clair vers la publication", steps: ["Connectez-vous avec votre compte LSevin", "Envoyez la demande et les documents", "Après approbation, complétez et publiez l’activité"], capabilitiesTitle: "Périmètre de production", capabilities: ["Profil prestataire", "Services et prix", "Profils du personnel", "Disponibilités", "Réservations", "Avis", "Médiathèque", "Support et notifications"], financeTitle: "La finance fait partie de chaque réservation", financeText: "Les prix, règles de rémunération LSevin, mouvements de portefeuille, règlements et versements utilisent les données commerciales existantes de LSevin.", staffTitle: "Gérez votre profil professionnel LSevin vérifié.", staffText: "Médecins, spécialistes, entraîneurs et autres collaborateurs peuvent demander un profil lié à un prestataire approuvé.", staffStart: "Demander ou créer un profil", clinicPath: "Je représente un prestataire", staffStepsTitle: "Propriété du profil protégée", staffSteps: ["Choisissez un profil existant ou demandez-en un nouveau", "La clinique confirme la relation", "LSevin vérifie la demande", "Gérez uniquement votre profil et votre travail approuvés"], staffToolsTitle: "Ce que le personnel approuvé peut gérer", staffTools: ["Profil multilingue", "Prix des services attribués", "Disponibilités", "Réservations attribuées", "Avis personnels", "Médias du prestataire"],
  },
};
