import { normalizePortalLocale, type PortalLocale } from "@core/i18n/config";
import { translateUiText } from "@core/i18n/uiText";
import type { ModuleCatalogCategory } from "./catalog";
import type { ModuleScope } from "./types";
import { getModuleDescriptionText } from "./moduleDescriptions";

type CatalogRoute = { key: string; scope: ModuleScope; path: string; title: string; description?: string | null };

type Localized = Record<Exclude<PortalLocale, "en">, string>;

const moduleNames: Record<string, Localized> = {
  "admin-governance": { fa: "مدیریت و حاکمیت سامانه", ar: "إدارة وحوكمة النظام", tr: "Sistem Yönetimi ve Yönetişimi", es: "Administración y gobernanza", ku: "بەڕێوەبردن و حوکمڕانی سیستەم", de: "Systemverwaltung und Governance", fr: "Administration et gouvernance" },
  "arrival-checkin-studio": { fa: "مدیریت ورود و پذیرش", ar: "إدارة الوصول وتسجيل الدخول", tr: "Varış ve Giriş Yönetimi", es: "Gestión de llegada y registro", ku: "بەڕێوەبردنی گەیشتن و تۆمارکردنی هاتن", de: "Ankunfts- und Check-in-Verwaltung", fr: "Gestion des arrivées et de l’accueil" },
  "audience-growth": { fa: "رشد مخاطبان و ارتباط با مشتری", ar: "نمو الجمهور وإدارة علاقات العملاء", tr: "Kitle Büyümesi ve Müşteri İlişkileri", es: "Crecimiento de audiencia y CRM", ku: "گەشەی بینەران و پەیوەندیی کڕیار", de: "Zielgruppenwachstum und CRM", fr: "Croissance d’audience et CRM" },
  "provider-availability": { fa: "زمان‌بندی و ظرفیت ارائه‌دهنده", ar: "مواعيد وسعة مزوّد الخدمة", tr: "Sağlayıcı Uygunluğu", es: "Disponibilidad del proveedor", ku: "بەردەستبوونی دابینکەر", de: "Anbieterverfügbarkeit", fr: "Disponibilité du prestataire" },
  "booking-management": { fa: "مدیریت رزروها", ar: "إدارة الحجوزات", tr: "Rezervasyon Yönetimi", es: "Gestión de reservas", ku: "بەڕێوەبردنی حجزەکان", de: "Buchungsverwaltung", fr: "Gestion des réservations" },
  "provider-bookings": { fa: "رزروهای ارائه‌دهنده", ar: "حجوزات مزوّد الخدمة", tr: "Sağlayıcı Rezervasyonları", es: "Reservas del proveedor", ku: "حجزەکانی دابینکەر", de: "Anbieterbuchungen", fr: "Réservations du prestataire" },
  "boost-studio": { fa: "استودیوی افزایش دیده‌شدن", ar: "استوديو تعزيز الظهور", tr: "Görünürlük Artırma Stüdyosu", es: "Estudio de impulso", ku: "ستۆدیۆی زیادکردنی بینراوی", de: "Boost-Studio", fr: "Studio de mise en avant" },
  "business-growth": { fa: "ابزارهای رشد کسب‌وکار", ar: "أدوات نمو الأعمال", tr: "İş Büyüme Araçları", es: "Herramientas de crecimiento empresarial", ku: "ئامرازەکانی گەشەی بازرگانی", de: "Werkzeuge für Geschäftswachstum", fr: "Outils de croissance commerciale" },
  "care-journey": { fa: "مدیریت مسیر مراقبت", ar: "إدارة رحلة الرعاية", tr: "Bakım Yolculuğu Yönetimi", es: "Gestión del recorrido asistencial", ku: "بەڕێوەبردنی ڕێڕەوی چاودێری", de: "Versorgungsweg-Verwaltung", fr: "Gestion du parcours de soins" },
  "challenge-studio": { fa: "استودیوی چالش‌ها", ar: "استوديو التحديات", tr: "Meydan Okuma Stüdyosu", es: "Estudio de retos", ku: "ستۆدیۆی ئالەنگارییەکان", de: "Challenge-Studio", fr: "Studio de défis" },
  "class-group-studio": { fa: "مدیریت کلاس‌ها و جلسات گروهی", ar: "إدارة الصفوف والجلسات الجماعية", tr: "Sınıf ve Grup Oturumu Yönetimi", es: "Gestión de clases y sesiones grupales", ku: "بەڕێوەبردنی پۆل و دانیشتنە گروپییەکان", de: "Kurs- und Gruppensitzungsverwaltung", fr: "Gestion des cours et séances de groupe" },
  "community-studio": { fa: "مدیریت جامعه کاربران", ar: "إدارة مجتمع المستخدمين", tr: "Topluluk Yönetimi", es: "Gestión de comunidad", ku: "بەڕێوەبردنی کۆمەڵگا", de: "Community-Verwaltung", fr: "Gestion de communauté" },
  "concierge-studio": { fa: "مدیریت خدمات همراه و کانسیرج", ar: "إدارة خدمات الكونسيرج", tr: "Konsiyerj Yönetimi", es: "Gestión de conserjería", ku: "بەڕێوەبردنی خزمەتگوزاریی کۆنسێرژ", de: "Concierge-Verwaltung", fr: "Gestion de conciergerie" },
  "consent-studio": { fa: "مدیریت رضایت‌نامه‌ها", ar: "إدارة الموافقات", tr: "Onay Yönetimi", es: "Gestión de consentimientos", ku: "بەڕێوەبردنی ڕەزامەندییەکان", de: "Einwilligungsverwaltung", fr: "Gestion des consentements" },
  "consultation-studio": { fa: "مدیریت مشاوره‌ها", ar: "إدارة الاستشارات", tr: "Danışmanlık Yönetimi", es: "Gestión de consultas", ku: "بەڕێوەبردنی ڕاوێژکارییەکان", de: "Beratungsverwaltung", fr: "Gestion des consultations" },
  "content-studio": { fa: "استودیوی محتوا", ar: "استوديو المحتوى", tr: "İçerik Stüdyosu", es: "Estudio de contenido", ku: "ستۆدیۆی ناوەڕۆک", de: "Content-Studio", fr: "Studio de contenu" },
  "conversation-studio": { fa: "مدیریت گفتگوها", ar: "إدارة المحادثات", tr: "Görüşme Yönetimi", es: "Gestión de conversaciones", ku: "بەڕێوەبردنی گفتوگۆکان", de: "Konversationsverwaltung", fr: "Gestion des conversations" },
  "conversion-studio": { fa: "مدیریت تبدیل و فروش", ar: "إدارة التحويل والمبيعات", tr: "Dönüşüm ve Satış Yönetimi", es: "Gestión de conversión y ventas", ku: "بەڕێوەبردنی گۆڕین و فرۆشتن", de: "Conversion- und Vertriebsverwaltung", fr: "Gestion de la conversion et des ventes" },
  "customer-case-studio": { fa: "مدیریت پرونده مشتری", ar: "إدارة ملفات العملاء", tr: "Müşteri Dosyası Yönetimi", es: "Gestión de casos de clientes", ku: "بەڕێوەبردنی پەڕگەی کڕیار", de: "Kundenfallverwaltung", fr: "Gestion des dossiers clients" },
  "customer-decision": { fa: "ابزارهای تصمیم‌گیری مشتری", ar: "أدوات قرار العميل", tr: "Müşteri Karar Araçları", es: "Herramientas de decisión del cliente", ku: "ئامرازەکانی بڕیاردانی کڕیار", de: "Kundenentscheidungswerkzeuge", fr: "Outils de décision client" },
  "customer-engagement": { fa: "تعامل با مشتری", ar: "تفاعل العملاء", tr: "Müşteri Etkileşimi", es: "Interacción con clientes", ku: "بەشداریی کڕیار", de: "Kundenbindung", fr: "Engagement client" },
  "customer-relationship-studio": { fa: "مدیریت ارتباط با مشتری", ar: "إدارة علاقات العملاء", tr: "Müşteri İlişkileri Yönetimi", es: "Gestión de relaciones con clientes", ku: "بەڕێوەبردنی پەیوەندیی کڕیار", de: "Kundenbeziehungsverwaltung", fr: "Gestion de la relation client" },
  "provider-dashboard": { fa: "داشبورد", ar: "لوحة التحكم", tr: "Gösterge Paneli", es: "Panel de control", ku: "داشبۆرد", de: "Dashboard", fr: "Tableau de bord" },
  "document-intake-studio": { fa: "مدیریت دریافت مدارک", ar: "إدارة استلام المستندات", tr: "Belge Kabul Yönetimi", es: "Gestión de recepción de documentos", ku: "بەڕێوەبردنی وەرگرتنی بەڵگەنامە", de: "Dokumentenannahme", fr: "Gestion de la collecte de documents" },
  "feedback-recovery-studio": { fa: "بازخورد و جبران خدمت", ar: "التعليقات واستعادة الخدمة", tr: "Geri Bildirim ve Hizmet Telafisi", es: "Comentarios y recuperación del servicio", ku: "ڕەخنە و چاککردنەوەی خزمەتگوزاری", de: "Feedback und Servicewiederherstellung", fr: "Retours et rétablissement du service" },
  "field-dispatch-studio": { fa: "اعزام خدمات در محل", ar: "إرسال الخدمات الميدانية", tr: "Saha Hizmeti Sevk Yönetimi", es: "Despacho de servicios a domicilio", ku: "ناردنی خزمەتگوزاریی مەیدانی", de: "Außendiensteinsatz", fr: "Planification des interventions à domicile" },
  "provider-finance-legacy": { fa: "مالی قدیمی ارائه‌دهنده", ar: "النظام المالي القديم للمزوّد", tr: "Eski Sağlayıcı Finans Modülü", es: "Finanzas heredadas del proveedor", ku: "دارایی کۆنی دابینکەر", de: "Alte Anbieterfinanzen", fr: "Finances historiques du prestataire" },
  "gift-card-studio": { fa: "کارت هدیه و بن خرید", ar: "بطاقات الهدايا والقسائم", tr: "Hediye Kartı ve Kupon Yönetimi", es: "Tarjetas regalo y vales", ku: "کارتی دیاری و ڤاچەڕ", de: "Geschenkkarten und Gutscheine", fr: "Cartes cadeaux et bons" },
  "household-caregiver-studio": { fa: "مدیریت خانواده و مراقب", ar: "إدارة الأسرة ومقدّم الرعاية", tr: "Hane ve Bakıcı Yönetimi", es: "Gestión de hogares y cuidadores", ku: "بەڕێوەبردنی خێزان و چاودێر", de: "Haushalts- und Betreuerverwaltung", fr: "Gestion des foyers et aidants" },
  "lead-pipeline-studio": { fa: "مدیریت سرنخ‌های فروش", ar: "إدارة مسار العملاء المحتملين", tr: "Satış Adayı Yönetimi", es: "Gestión del embudo de oportunidades", ku: "بەڕێوەبردنی سەرچاوەکانی فرۆشتن", de: "Lead-Pipeline-Verwaltung", fr: "Gestion du pipeline de prospects" },
  "live-engagement": { fa: "تعامل زنده", ar: "التفاعل المباشر", tr: "Canlı Etkileşim", es: "Interacción en vivo", ku: "بەشداریی ڕاستەوخۆ", de: "Live-Interaktion", fr: "Engagement en direct" },
  "loyalty-studio": { fa: "باشگاه مشتریان", ar: "برنامج الولاء", tr: "Sadakat Yönetimi", es: "Gestión de fidelización", ku: "بەرنامەی دڵسۆزی", de: "Treueprogramm", fr: "Programme de fidélité" },
  "provider-management-hub": { fa: "مرکز مدیریت ارائه‌دهنده", ar: "مركز إدارة مزوّد الخدمة", tr: "Sağlayıcı Yönetim Merkezi", es: "Centro de gestión del proveedor", ku: "ناوەندی بەڕێوەبردنی دابینکەر", de: "Anbieter-Verwaltungszentrale", fr: "Centre de gestion du prestataire" },
  "provider-media": { fa: "رسانه‌های ارائه‌دهنده", ar: "وسائط مزوّد الخدمة", tr: "Sağlayıcı Medyası", es: "Medios del proveedor", ku: "میدیای دابینکەر", de: "Anbietermedien", fr: "Médias du prestataire" },
  "media-library": { fa: "کتابخانه رسانه", ar: "مكتبة الوسائط", tr: "Medya Kütüphanesi", es: "Biblioteca multimedia", ku: "کتێبخانەی میدیا", de: "Medienbibliothek", fr: "Médiathèque" },
  "membership-studio": { fa: "عضویت‌ها و اشتراک‌ها", ar: "العضويات والاشتراكات", tr: "Üyelik ve Geçiş Yönetimi", es: "Membresías y pases", ku: "ئەندامێتی و پاسەکان", de: "Mitgliedschaften und Pässe", fr: "Adhésions et pass" },
  "notifications-module": { fa: "اعلان‌ها", ar: "الإشعارات", tr: "Bildirimler", es: "Notificaciones", ku: "ئاگادارکردنەوەکان", de: "Benachrichtigungen", fr: "Notifications" },
  "provider-offers": { fa: "پیشنهادهای ارائه‌دهنده", ar: "عروض مزوّد الخدمة", tr: "Sağlayıcı Teklifleri", es: "Ofertas del proveedor", ku: "پێشنیارەکانی دابینکەر", de: "Anbieterangebote", fr: "Offres du prestataire" },
  "provider-onboarding": { fa: "ثبت و پذیرش ارائه‌دهنده", ar: "تسجيل وقبول مزوّد الخدمة", tr: "Sağlayıcı Katılımı", es: "Incorporación de proveedores", ku: "تۆمارکردن و پەسەندکردنی دابینکەر", de: "Anbieter-Onboarding", fr: "Intégration des prestataires" },
  "package-studio": { fa: "مدیریت بسته‌های خدمات", ar: "إدارة باقات الخدمات", tr: "Hizmet Paketi Yönetimi", es: "Gestión de paquetes de servicios", ku: "بەڕێوەبردنی پاکێجی خزمەتگوزاری", de: "Servicepaket-Verwaltung", fr: "Gestion des forfaits de services" },
  "partner-studio": { fa: "مدیریت شرکا", ar: "إدارة الشركاء", tr: "İş Ortağı Yönetimi", es: "Gestión de socios", ku: "بەڕێوەبردنی هاوبەشەکان", de: "Partnerverwaltung", fr: "Gestion des partenaires" },
  "payment-billing": { fa: "پرداخت و صورتحساب", ar: "الدفع والفوترة", tr: "Ödeme ve Faturalandırma", es: "Pagos y facturación", ku: "پارەدان و پسوڵە", de: "Zahlung und Abrechnung", fr: "Paiement et facturation" },
  "pricing-plans": { fa: "طرح‌های قیمت‌گذاری", ar: "خطط الأسعار", tr: "Fiyatlandırma Planları", es: "Planes de precios", ku: "پلانی نرخدانان", de: "Preispläne", fr: "Plans tarifaires" },
  "progress-outcomes-studio": { fa: "پیشرفت و نتایج مشتری", ar: "تقدّم ونتائج العميل", tr: "Müşteri İlerlemesi ve Sonuçları", es: "Progreso y resultados del cliente", ku: "پێشکەوتن و ئەنجامی کڕیار", de: "Kundenfortschritt und Ergebnisse", fr: "Progression et résultats du client" },
  "proposal-studio": { fa: "مدیریت پیشنهادها", ar: "إدارة المقترحات", tr: "Teklif Yönetimi", es: "Gestión de propuestas", ku: "بەڕێوەبردنی پێشنیارەکان", de: "Angebotsverwaltung", fr: "Gestion des propositions" },
  "provider-access": { fa: "دسترسی‌های ارائه‌دهنده", ar: "صلاحيات مزوّد الخدمة", tr: "Sağlayıcı Erişimleri", es: "Accesos del proveedor", ku: "دەستگەیشتنی دابینکەر", de: "Anbieterzugriffe", fr: "Accès du prestataire" },
  "provider-finance-analytics": { fa: "مالی و تحلیل ارائه‌دهنده", ar: "مالية وتحليلات المزوّد", tr: "Sağlayıcı Finans ve Analitik", es: "Finanzas y análisis del proveedor", ku: "دارایی و شیکردنەوەی دابینکەر", de: "Anbieterfinanzen und Analysen", fr: "Finances et analyses du prestataire" },
  "provider-portal": { fa: "پرتال ارائه‌دهنده", ar: "بوابة مزوّد الخدمة", tr: "Sağlayıcı Portalı", es: "Portal del proveedor", ku: "پۆرتاڵی دابینکەر", de: "Anbieterportal", fr: "Portail du prestataire" },
  "provider-profile": { fa: "پروفایل ارائه‌دهنده", ar: "ملف مزوّد الخدمة", tr: "Sağlayıcı Profili", es: "Perfil del proveedor", ku: "پرۆفایلی دابینکەر", de: "Anbieterprofil", fr: "Profil du prestataire" },
  "rebooking-studio": { fa: "حفظ مشتری و رزرو مجدد", ar: "الاحتفاظ وإعادة الحجز", tr: "Müşteri Tutma ve Yeniden Rezervasyon", es: "Retención y nueva reserva", ku: "پاراستنی کڕیار و حجزکردنەوە", de: "Kundenbindung und Wiederbuchung", fr: "Fidélisation et nouvelle réservation" },
  "referral-growth": { fa: "رشد ارجاع و همکاری", ar: "نمو الإحالات والتعاون", tr: "Yönlendirme ve İş Birliği Büyümesi", es: "Crecimiento por referidos y colaboración", ku: "گەشەی ناساندن و هاوکاری", de: "Empfehlungs- und Kooperationswachstum", fr: "Croissance par recommandation et collaboration" },
  "reporting-analytics": { fa: "گزارش‌ها و تحلیل‌ها", ar: "التقارير والتحليلات", tr: "Raporlama ve Analitik", es: "Informes y análisis", ku: "ڕاپۆرت و شیکردنەوە", de: "Berichte und Analysen", fr: "Rapports et analyses" },
  "provider-reviews": { fa: "نظرات ارائه‌دهنده", ar: "تقييمات مزوّد الخدمة", tr: "Sağlayıcı Değerlendirmeleri", es: "Reseñas del proveedor", ku: "هەڵسەنگاندنەکانی دابینکەر", de: "Anbieterbewertungen", fr: "Avis sur le prestataire" },
  "reviews-standalone": { fa: "نظرات و پاسخ‌ها", ar: "التقييمات والردود", tr: "Değerlendirmeler ve Yanıtlar", es: "Reseñas y respuestas", ku: "هەڵسەنگاندن و وەڵامەکان", de: "Bewertungen und Antworten", fr: "Avis et réponses" },
  "provider-services": { fa: "خدمات ارائه‌دهنده", ar: "خدمات مزوّد الخدمة", tr: "Sağlayıcı Hizmetleri", es: "Servicios del proveedor", ku: "خزمەتگوزارییەکانی دابینکەر", de: "Anbieterdienste", fr: "Services du prestataire" },
  "slotdrop-studio": { fa: "مدیریت ظرفیت‌های آزاد", ar: "إدارة المواعيد الشاغرة", tr: "Boş Randevu Yönetimi", es: "Gestión de huecos disponibles", ku: "بەڕێوەبردنی کاتە بەتاڵەکان", de: "Verwaltung freier Termine", fr: "Gestion des créneaux disponibles" },
  "provider-staff": { fa: "کارکنان ارائه‌دهنده", ar: "موظفو مزوّد الخدمة", tr: "Sağlayıcı Personeli", es: "Personal del proveedor", ku: "کارمەندانی دابینکەر", de: "Anbieterpersonal", fr: "Personnel du prestataire" },
  "provider-support": { fa: "پشتیبانی ارائه‌دهنده", ar: "دعم مزوّد الخدمة", tr: "Sağlayıcı Desteği", es: "Soporte al proveedor", ku: "پشتگیریی دابینکەر", de: "Anbietersupport", fr: "Assistance au prestataire" },
  "ticketing": { fa: "سامانه تیکت", ar: "نظام التذاكر", tr: "Destek Talebi Sistemi", es: "Sistema de tickets", ku: "سیستەمی تیکەت", de: "Ticketsystem", fr: "Système de tickets" },
  "trust-studio": { fa: "اعتماد و اعتبار", ar: "الثقة والسمعة", tr: "Güven ve İtibar", es: "Confianza y reputación", ku: "متمانە و ناوبانگ", de: "Vertrauen und Reputation", fr: "Confiance et réputation" },
};

const categoryLabels: Record<ModuleCatalogCategory, Localized> = {
  Administration: { fa: "مدیریت سامانه", ar: "إدارة النظام", tr: "Sistem Yönetimi", es: "Administración", ku: "بەڕێوەبردنی سیستەم", de: "Administration", fr: "Administration" },
  "Provider operations": { fa: "عملیات ارائه‌دهنده", ar: "عمليات مزوّد الخدمة", tr: "Sağlayıcı Operasyonları", es: "Operaciones del proveedor", ku: "کارگێڕیی دابینکەر", de: "Anbieterbetrieb", fr: "Opérations du prestataire" },
  "Customer experience": { fa: "تجربه مشتری", ar: "تجربة العميل", tr: "Müşteri Deneyimi", es: "Experiencia del cliente", ku: "ئەزموونی کڕیار", de: "Kundenerlebnis", fr: "Expérience client" },
  "Growth and engagement": { fa: "رشد و تعامل", ar: "النمو والتفاعل", tr: "Büyüme ve Etkileşim", es: "Crecimiento e interacción", ku: "گەشە و بەشداری", de: "Wachstum und Interaktion", fr: "Croissance et engagement" },
  "Finance and commercial": { fa: "مالی و تجاری", ar: "المالية والتجارية", tr: "Finans ve Ticaret", es: "Finanzas y comercio", ku: "دارایی و بازرگانی", de: "Finanzen und Handel", fr: "Finance et commerce" },
  "Platform services": { fa: "خدمات پلتفرم", ar: "خدمات المنصة", tr: "Platform Hizmetleri", es: "Servicios de plataforma", ku: "خزمەتگوزاریی پلاتفۆرم", de: "Plattformdienste", fr: "Services de plateforme" },
};

const scopeLabels: Record<ModuleScope, Localized> = {
  public: { fa: "عمومی", ar: "عام", tr: "Genel", es: "Público", ku: "گشتی", de: "Öffentlich", fr: "Public" },
  portal: { fa: "پرتال کاربر", ar: "بوابة المستخدم", tr: "Kullanıcı Portalı", es: "Portal de usuario", ku: "پۆرتاڵی بەکارهێنەر", de: "Benutzerportal", fr: "Portail utilisateur" },
  provider: { fa: "پرتال ارائه‌دهنده", ar: "بوابة المزوّد", tr: "Sağlayıcı Portalı", es: "Portal del proveedor", ku: "پۆرتاڵی دابینکەر", de: "Anbieterportal", fr: "Portail du prestataire" },
  admin: { fa: "مدیریت", ar: "الإدارة", tr: "Yönetim", es: "Administración", ku: "بەڕێوەبردن", de: "Administration", fr: "Administration" },
};

function localized(row: Localized | undefined, fallback: string, localeValue?: string | null) {
  const locale = normalizePortalLocale(localeValue).locale;
  if (locale === "en") return fallback;
  return row?.[locale] || fallback;
}

export function localizeModuleName(moduleId: string, fallback: string, localeValue?: string | null) {
  return localized(moduleNames[moduleId], fallback, localeValue);
}

export function localizeModuleCategory(category: ModuleCatalogCategory, localeValue?: string | null) {
  return localized(categoryLabels[category], category, localeValue);
}

export function localizeModuleScope(scope: ModuleScope, localeValue?: string | null) {
  return localized(scopeLabels[scope], scope, localeValue);
}

export function localizeModuleDescription(moduleId: string, fallback: string, localeValue?: string | null) {
  const locale = normalizePortalLocale(localeValue).locale;
  return getModuleDescriptionText(moduleId, locale) || fallback;
}

export function localizeModuleRouteTitle(input: {
  moduleId: string;
  moduleName: string;
  route: CatalogRoute;
  index: number;
  locale?: string | null;
}) {
  const locale = normalizePortalLocale(input.locale).locale;
  if (locale === "en") return input.route.title;
  const exact = translateUiText(input.route.title, input.locale);
  if (exact !== input.route.title) return exact;
  const moduleName = localizeModuleName(input.moduleId, input.moduleName, input.locale);
  const scope = localizeModuleScope(input.route.scope, input.locale);
  const number = input.index + 1;
  const templates: Record<Exclude<PortalLocale, "en">, string> = {
    fa: `${scope} — ${moduleName}، صفحه ${number}`,
    ar: `${scope} — ${moduleName}، الصفحة ${number}`,
    tr: `${scope} — ${moduleName}, sayfa ${number}`,
    es: `${scope} — ${moduleName}, página ${number}`,
    ku: `${scope} — ${moduleName}، پەڕەی ${number}`,
    de: `${scope} — ${moduleName}, Seite ${number}`,
    fr: `${scope} — ${moduleName}, page ${number}`,
  };
  return templates[locale];
}

export function localizeModuleRouteDescription(input: {
  moduleId: string;
  moduleName: string;
  route: CatalogRoute;
  locale?: string | null;
}) {
  const locale = normalizePortalLocale(input.locale).locale;
  if (locale === "en") return input.route.description || "This page is part of the module workflow.";
  if (input.route.description) {
    const exact = translateUiText(input.route.description, input.locale);
    if (exact !== input.route.description) return exact;
  }
  const moduleName = localizeModuleName(input.moduleId, input.moduleName, input.locale);
  const scope = localizeModuleScope(input.route.scope, input.locale);
  const templates: Record<Exclude<PortalLocale, "en">, string> = {
    fa: `صفحه ${scope} برای اجرای بخشی از گردش‌کارهای ${moduleName}.`,
    ar: `صفحة ${scope} لتنفيذ جزء من سير عمل ${moduleName}.`,
    tr: `${moduleName} iş akışının bir bölümünü yürütmek için ${scope} sayfası.`,
    es: `Página de ${scope} para ejecutar una parte del flujo de ${moduleName}.`,
    ku: `پەڕەی ${scope} بۆ جێبەجێکردنی بەشێک لە ڕەوتی ${moduleName}.`,
    de: `${scope}-Seite für einen Teil des Arbeitsablaufs von ${moduleName}.`,
    fr: `Page ${scope} destinée à une partie du processus de ${moduleName}.`,
  };
  return templates[locale];
}
