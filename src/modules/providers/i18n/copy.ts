import { normalizePortalLocale, type PortalLocale } from "@core/i18n/config";

const en = {
  moduleName: "Provider Profiles",
  profile: "Profile",
  providers: "Providers",
  profilePageTitle: "Provider profile",
  profilePageDescription: "Manage the provider information displayed in the LSevin marketplace.",
  profileCardTitle: "Provider profile",
  providerName: "Provider name",
  description: "Description",
  descriptionHelp: "Enter independent, formatted content for each language.",
  details: "Additional details",
  detailsHelp: "Add localized operational or visitor information.",
  streetAddress: "Street address",
  streetAddressHelp: "Enter the street address separately for each supported language.",
  email: "Email",
  countryCode: "Country code",
  phone: "Phone",
  postalCode: "Postal code",
  timezone: "Time zone",
  latitude: "Latitude",
  longitude: "Longitude",
  profileImage: "Main profile image",
  serviceLanguages: "Service languages",
  specialties: "Specialties",
  commaSeparated: "Separate values with commas.",
  saveProfile: "Save profile",
  adminTitle: "Provider catalog administration",
  adminDescription: "Search providers, inspect operational readiness, and control publication, accreditation, and sponsorship with an auditable reason.",
  adminControlCenter: "Admin control center",
  providersLabel: "Providers",
  active: "Active",
  inactive: "Inactive",
  accredited: "Accredited",
  sponsored: "Sponsored",
  withoutOwner: "Without owner",
  searchPlaceholder: "Provider, email, or phone",
  allStatuses: "All statuses",
  allProviderTypes: "All provider types",
  filter: "Filter",
  tableProvider: "Provider",
  location: "Location",
  status: "Status",
  operations: "Operations",
  reputation: "Reputation",
  lastUpdate: "Last update",
  controls: "Controls",
  members: "members",
  services: "services",
  staff: "staff",
  openBookings: "open bookings",
  reviews: "reviews",
  workspace: "Workspace",
  deactivate: "Deactivate",
  activate: "Activate",
  removeAccreditation: "Remove accreditation",
  accredit: "Accredit",
  removeSponsor: "Remove sponsorship",
  sponsor: "Sponsor",
  reason: "Reason",
  noMatchingProviders: "No matching providers",
  noMatchingProvidersDescription: "Change the filters or approve a provider application first.",
  recentAdministration: "Recent provider administration",
  noAdministrationActions: "No provider administration actions have been recorded yet.",
  reasonRequiredOnDeactivate: "A reason is required when deactivating a provider.",
  providerNotFound: "Provider not found.",
  changedActiveStatus: "Changed provider activation",
  changedAccreditation: "Changed provider accreditation",
  changedSponsorship: "Changed provider sponsorship",
  administrationAction: "Provider administration action",
} as const;

type Copy = { [K in keyof typeof en]: string };

const fa: Copy = {
  moduleName: "پروفایل ارائه‌دهندگان", profile: "پروفایل", providers: "ارائه‌دهندگان", profilePageTitle: "پروفایل ارائه‌دهنده", profilePageDescription: "اطلاعات ارائه‌دهنده‌ای را که در بازار السوین نمایش داده می‌شود مدیریت کنید.", profileCardTitle: "پروفایل ارائه‌دهنده", providerName: "نام ارائه‌دهنده", description: "توضیحات", descriptionHelp: "برای هر زبان محتوای مستقل و قالب‌بندی‌شده وارد کنید.", details: "جزئیات تکمیلی", detailsHelp: "اطلاعات اجرایی یا راهنمای مراجعه را برای هر زبان وارد کنید.", streetAddress: "نشانی خیابان", streetAddressHelp: "نشانی خیابان را برای هر زبان پشتیبانی‌شده جداگانه وارد کنید.", email: "ایمیل", countryCode: "پیش‌شماره کشور", phone: "تلفن", postalCode: "کد پستی", timezone: "منطقه زمانی", latitude: "عرض جغرافیایی", longitude: "طول جغرافیایی", profileImage: "تصویر اصلی پروفایل", serviceLanguages: "زبان‌های ارائه خدمت", specialties: "تخصص‌ها", commaSeparated: "مقادیر را با ویرگول جدا کنید.", saveProfile: "ذخیره پروفایل", adminTitle: "مدیریت فهرست ارائه‌دهندگان", adminDescription: "ارائه‌دهندگان را جستجو کنید، آمادگی عملیاتی را بررسی کنید و انتشار، اعتبارسنجی و حمایت را با دلیل قابل ممیزی کنترل کنید.", adminControlCenter: "مرکز کنترل مدیریت", providersLabel: "ارائه‌دهندگان", active: "فعال", inactive: "غیرفعال", accredited: "اعتبارسنجی‌شده", sponsored: "حمایت‌شده", withoutOwner: "بدون مالک", searchPlaceholder: "ارائه‌دهنده، ایمیل یا تلفن", allStatuses: "همه وضعیت‌ها", allProviderTypes: "همه انواع ارائه‌دهنده", filter: "فیلتر", tableProvider: "ارائه‌دهنده", location: "موقعیت", status: "وضعیت", operations: "عملیات", reputation: "اعتبار", lastUpdate: "آخرین به‌روزرسانی", controls: "کنترل‌ها", members: "عضو", services: "خدمت", staff: "پرسنل", openBookings: "رزرو باز", reviews: "نظر", workspace: "فضای کاری", deactivate: "غیرفعال‌سازی", activate: "فعال‌سازی", removeAccreditation: "حذف اعتبار", accredit: "اعتبارسنجی", removeSponsor: "حذف حمایت", sponsor: "حمایت", reason: "دلیل", noMatchingProviders: "ارائه‌دهنده‌ای یافت نشد", noMatchingProvidersDescription: "فیلترها را تغییر دهید یا ابتدا یک درخواست ارائه‌دهنده را تأیید کنید.", recentAdministration: "آخرین اقدامات مدیریتی ارائه‌دهندگان", noAdministrationActions: "هنوز اقدام مدیریتی برای ارائه‌دهندگان ثبت نشده است.", reasonRequiredOnDeactivate: "برای غیرفعال‌کردن ارائه‌دهنده واردکردن دلیل الزامی است.", providerNotFound: "ارائه‌دهنده یافت نشد.", changedActiveStatus: "وضعیت فعال‌بودن ارائه‌دهنده تغییر کرد", changedAccreditation: "اعتبار ارائه‌دهنده تغییر کرد", changedSponsorship: "وضعیت حمایت ارائه‌دهنده تغییر کرد", administrationAction: "اقدام مدیریتی ارائه‌دهنده",
};

const ar: Copy = {
  moduleName: "ملفات مقدمي الخدمة", profile: "الملف", providers: "مقدمو الخدمة", profilePageTitle: "ملف مقدم الخدمة", profilePageDescription: "إدارة معلومات مقدم الخدمة الظاهرة في سوق LSevin.", profileCardTitle: "ملف مقدم الخدمة", providerName: "اسم مقدم الخدمة", description: "الوصف", descriptionHelp: "أدخل محتوى مستقلاً ومنسقاً لكل لغة.", details: "تفاصيل إضافية", detailsHelp: "أضف معلومات تشغيلية أو إرشادات للزوار بكل لغة.", streetAddress: "عنوان الشارع", streetAddressHelp: "أدخل عنوان الشارع بشكل منفصل لكل لغة مدعومة.", email: "البريد الإلكتروني", countryCode: "رمز الدولة", phone: "الهاتف", postalCode: "الرمز البريدي", timezone: "المنطقة الزمنية", latitude: "خط العرض", longitude: "خط الطول", profileImage: "الصورة الرئيسية للملف", serviceLanguages: "لغات تقديم الخدمة", specialties: "التخصصات", commaSeparated: "افصل القيم بفواصل.", saveProfile: "حفظ الملف", adminTitle: "إدارة دليل مقدمي الخدمة", adminDescription: "ابحث عن مقدمي الخدمة وافحص الجاهزية التشغيلية وتحكم بالنشر والاعتماد والرعاية مع سبب قابل للتدقيق.", adminControlCenter: "مركز تحكم الإدارة", providersLabel: "مقدمو الخدمة", active: "نشط", inactive: "غير نشط", accredited: "معتمد", sponsored: "برعاية", withoutOwner: "بلا مالك", searchPlaceholder: "مقدم خدمة أو بريد أو هاتف", allStatuses: "كل الحالات", allProviderTypes: "كل أنواع مقدمي الخدمة", filter: "تصفية", tableProvider: "مقدم الخدمة", location: "الموقع", status: "الحالة", operations: "العمليات", reputation: "السمعة", lastUpdate: "آخر تحديث", controls: "التحكم", members: "أعضاء", services: "خدمات", staff: "موظفون", openBookings: "حجوزات مفتوحة", reviews: "مراجعات", workspace: "مساحة العمل", deactivate: "تعطيل", activate: "تفعيل", removeAccreditation: "إزالة الاعتماد", accredit: "اعتماد", removeSponsor: "إزالة الرعاية", sponsor: "رعاية", reason: "السبب", noMatchingProviders: "لا يوجد مقدمو خدمة مطابقون", noMatchingProvidersDescription: "غيّر عوامل التصفية أو وافق أولاً على طلب مقدم خدمة.", recentAdministration: "أحدث إجراءات إدارة مقدمي الخدمة", noAdministrationActions: "لم تُسجّل إجراءات إدارية لمقدمي الخدمة بعد.", reasonRequiredOnDeactivate: "يجب إدخال سبب عند تعطيل مقدم الخدمة.", providerNotFound: "لم يتم العثور على مقدم الخدمة.", changedActiveStatus: "تم تغيير حالة تفعيل مقدم الخدمة", changedAccreditation: "تم تغيير اعتماد مقدم الخدمة", changedSponsorship: "تم تغيير رعاية مقدم الخدمة", administrationAction: "إجراء إدارة مقدم الخدمة",
};

const tr: Copy = {
  moduleName: "Sağlayıcı Profilleri", profile: "Profil", providers: "Sağlayıcılar", profilePageTitle: "Sağlayıcı profili", profilePageDescription: "LSevin pazarında gösterilen sağlayıcı bilgilerini yönetin.", profileCardTitle: "Sağlayıcı profili", providerName: "Sağlayıcı adı", description: "Açıklama", descriptionHelp: "Her dil için bağımsız ve biçimlendirilmiş içerik girin.", details: "Ek ayrıntılar", detailsHelp: "Her dil için operasyonel veya ziyaretçi bilgileri ekleyin.", streetAddress: "Sokak adresi", streetAddressHelp: "Sokak adresini desteklenen her dil için ayrı girin.", email: "E-posta", countryCode: "Ülke kodu", phone: "Telefon", postalCode: "Posta kodu", timezone: "Saat dilimi", latitude: "Enlem", longitude: "Boylam", profileImage: "Ana profil görseli", serviceLanguages: "Hizmet dilleri", specialties: "Uzmanlıklar", commaSeparated: "Değerleri virgülle ayırın.", saveProfile: "Profili kaydet", adminTitle: "Sağlayıcı kataloğu yönetimi", adminDescription: "Sağlayıcıları arayın, operasyonel hazırlığı inceleyin ve yayın, akreditasyon ve sponsorluğu denetlenebilir bir gerekçeyle yönetin.", adminControlCenter: "Yönetici kontrol merkezi", providersLabel: "Sağlayıcılar", active: "Etkin", inactive: "Etkin değil", accredited: "Akredite", sponsored: "Sponsorlu", withoutOwner: "Sahipsiz", searchPlaceholder: "Sağlayıcı, e-posta veya telefon", allStatuses: "Tüm durumlar", allProviderTypes: "Tüm sağlayıcı türleri", filter: "Filtrele", tableProvider: "Sağlayıcı", location: "Konum", status: "Durum", operations: "Operasyonlar", reputation: "İtibar", lastUpdate: "Son güncelleme", controls: "Kontroller", members: "üye", services: "hizmet", staff: "personel", openBookings: "açık rezervasyon", reviews: "yorum", workspace: "Çalışma alanı", deactivate: "Devre dışı bırak", activate: "Etkinleştir", removeAccreditation: "Akreditasyonu kaldır", accredit: "Akredite et", removeSponsor: "Sponsorluğu kaldır", sponsor: "Sponsor yap", reason: "Gerekçe", noMatchingProviders: "Eşleşen sağlayıcı yok", noMatchingProvidersDescription: "Filtreleri değiştirin veya önce bir sağlayıcı başvurusunu onaylayın.", recentAdministration: "Son sağlayıcı yönetimi", noAdministrationActions: "Henüz sağlayıcı yönetimi işlemi kaydedilmedi.", reasonRequiredOnDeactivate: "Sağlayıcı devre dışı bırakılırken gerekçe zorunludur.", providerNotFound: "Sağlayıcı bulunamadı.", changedActiveStatus: "Sağlayıcı etkinliği değiştirildi", changedAccreditation: "Sağlayıcı akreditasyonu değiştirildi", changedSponsorship: "Sağlayıcı sponsorluğu değiştirildi", administrationAction: "Sağlayıcı yönetim işlemi",
};

const es: Copy = {
  moduleName: "Perfiles de proveedores", profile: "Perfil", providers: "Proveedores", profilePageTitle: "Perfil del proveedor", profilePageDescription: "Gestiona la información del proveedor mostrada en el mercado de LSevin.", profileCardTitle: "Perfil del proveedor", providerName: "Nombre del proveedor", description: "Descripción", descriptionHelp: "Introduce contenido independiente y con formato para cada idioma.", details: "Detalles adicionales", detailsHelp: "Añade información operativa o para visitantes en cada idioma.", streetAddress: "Dirección", streetAddressHelp: "Introduce la dirección por separado para cada idioma compatible.", email: "Correo electrónico", countryCode: "Código de país", phone: "Teléfono", postalCode: "Código postal", timezone: "Zona horaria", latitude: "Latitud", longitude: "Longitud", profileImage: "Imagen principal del perfil", serviceLanguages: "Idiomas de servicio", specialties: "Especialidades", commaSeparated: "Separa los valores con comas.", saveProfile: "Guardar perfil", adminTitle: "Administración del catálogo de proveedores", adminDescription: "Busca proveedores, revisa la preparación operativa y controla publicación, acreditación y patrocinio con un motivo auditable.", adminControlCenter: "Centro de control administrativo", providersLabel: "Proveedores", active: "Activo", inactive: "Inactivo", accredited: "Acreditado", sponsored: "Patrocinado", withoutOwner: "Sin propietario", searchPlaceholder: "Proveedor, correo o teléfono", allStatuses: "Todos los estados", allProviderTypes: "Todos los tipos de proveedor", filter: "Filtrar", tableProvider: "Proveedor", location: "Ubicación", status: "Estado", operations: "Operaciones", reputation: "Reputación", lastUpdate: "Última actualización", controls: "Controles", members: "miembros", services: "servicios", staff: "personal", openBookings: "reservas abiertas", reviews: "reseñas", workspace: "Espacio de trabajo", deactivate: "Desactivar", activate: "Activar", removeAccreditation: "Quitar acreditación", accredit: "Acreditar", removeSponsor: "Quitar patrocinio", sponsor: "Patrocinar", reason: "Motivo", noMatchingProviders: "No hay proveedores coincidentes", noMatchingProvidersDescription: "Cambia los filtros o aprueba primero una solicitud de proveedor.", recentAdministration: "Administración reciente de proveedores", noAdministrationActions: "Aún no se han registrado acciones administrativas de proveedores.", reasonRequiredOnDeactivate: "Se requiere un motivo al desactivar un proveedor.", providerNotFound: "Proveedor no encontrado.", changedActiveStatus: "Se cambió la activación del proveedor", changedAccreditation: "Se cambió la acreditación del proveedor", changedSponsorship: "Se cambió el patrocinio del proveedor", administrationAction: "Acción administrativa del proveedor",
};

const ku: Copy = {
  moduleName: "پرۆفایلی دابینکەران", profile: "پرۆفایل", providers: "دابینکەران", profilePageTitle: "پرۆفایلی دابینکەر", profilePageDescription: "زانیاری دابینکەر کە لە بازاڕی LSevin پیشان دەدرێت بەڕێوەببە.", profileCardTitle: "پرۆفایلی دابینکەر", providerName: "ناوی دابینکەر", description: "وەسف", descriptionHelp: "بۆ هەر زمانێک ناوەڕۆکی سەربەخۆ و ڕێکخراو بنووسە.", details: "وردەکاری زیاتر", detailsHelp: "زانیاری کارگێڕی یان ڕێنمایی سەردانکەر بە هەر زمانێک زیاد بکە.", streetAddress: "ناونیشانی شەقام", streetAddressHelp: "ناونیشانی شەقام بۆ هەر زمانی پشتگیریکراو جیاواز بنووسە.", email: "ئیمەیڵ", countryCode: "کۆدی وڵات", phone: "تەلەفۆن", postalCode: "کۆدی پۆست", timezone: "کاتی ناوچە", latitude: "پانی جوگرافی", longitude: "درێژی جوگرافی", profileImage: "وێنەی سەرەکی پرۆفایل", serviceLanguages: "زمانەکانی خزمەتگوزاری", specialties: "پسپۆڕییەکان", commaSeparated: "بەهاکان بە کۆما جیا بکەوە.", saveProfile: "پاشەکەوتکردنی پرۆفایل", adminTitle: "بەڕێوەبردنی کەتەلۆگی دابینکەران", adminDescription: "دابینکەران بگەڕێ، ئامادەیی کارگێڕی بپشکنە و بڵاوکردنەوە و پەسەندکردن و سپۆنسەری بە هۆکاری پشکنین‌پذیر بەڕێوەببە.", adminControlCenter: "ناوەندی کۆنترۆڵی بەڕێوەبەر", providersLabel: "دابینکەران", active: "چالاک", inactive: "ناچالاک", accredited: "پەسەندکراو", sponsored: "سپۆنسەرکراو", withoutOwner: "بێ خاوەن", searchPlaceholder: "دابینکەر، ئیمەیڵ یان تەلەفۆن", allStatuses: "هەموو دۆخەکان", allProviderTypes: "هەموو جۆرەکانی دابینکەر", filter: "پاڵاوتن", tableProvider: "دابینکەر", location: "شوێن", status: "دۆخ", operations: "کارەکان", reputation: "ناوبانگ", lastUpdate: "دوایین نوێکردنەوە", controls: "کۆنترۆڵەکان", members: "ئەندام", services: "خزمەتگوزاری", staff: "ستاف", openBookings: "حجزی کراوە", reviews: "هەڵسەنگاندن", workspace: "شوێنی کار", deactivate: "ناچالاککردن", activate: "چالاککردن", removeAccreditation: "لابردنی پەسەند", accredit: "پەسەندکردن", removeSponsor: "لابردنی سپۆنسەر", sponsor: "سپۆنسەرکردن", reason: "هۆکار", noMatchingProviders: "دابینکەری هاوتا نییە", noMatchingProvidersDescription: "پاڵاوتنەکان بگۆڕە یان سەرەتا داواکاری دابینکەرێک پەسەند بکە.", recentAdministration: "دوایین بەڕێوەبردنی دابینکەر", noAdministrationActions: "هێشتا هیچ کردارێکی بەڕێوەبردنی دابینکەر تۆمار نەکراوە.", reasonRequiredOnDeactivate: "لە ناچالاککردنی دابینکەر هۆکار پێویستە.", providerNotFound: "دابینکەر نەدۆزرایەوە.", changedActiveStatus: "دۆخی چالاکی دابینکەر گۆڕا", changedAccreditation: "پەسەندکردنی دابینکەر گۆڕا", changedSponsorship: "سپۆنسەری دابینکەر گۆڕا", administrationAction: "کرداری بەڕێوەبردنی دابینکەر",
};

const de: Copy = {
  moduleName: "Anbieterprofile", profile: "Profil", providers: "Anbieter", profilePageTitle: "Anbieterprofil", profilePageDescription: "Verwalten Sie die im LSevin-Marktplatz angezeigten Anbieterdaten.", profileCardTitle: "Anbieterprofil", providerName: "Anbietername", description: "Beschreibung", descriptionHelp: "Geben Sie für jede Sprache eigenständige, formatierte Inhalte ein.", details: "Zusätzliche Details", detailsHelp: "Ergänzen Sie lokalisierte Betriebs- oder Besucherinformationen.", streetAddress: "Straßenadresse", streetAddressHelp: "Geben Sie die Straßenadresse für jede unterstützte Sprache separat ein.", email: "E-Mail", countryCode: "Ländervorwahl", phone: "Telefon", postalCode: "Postleitzahl", timezone: "Zeitzone", latitude: "Breitengrad", longitude: "Längengrad", profileImage: "Hauptbild des Profils", serviceLanguages: "Service-Sprachen", specialties: "Fachgebiete", commaSeparated: "Werte durch Kommas trennen.", saveProfile: "Profil speichern", adminTitle: "Verwaltung des Anbieterkatalogs", adminDescription: "Suchen Sie Anbieter, prüfen Sie die Betriebsbereitschaft und steuern Sie Veröffentlichung, Akkreditierung und Sponsoring mit nachvollziehbarer Begründung.", adminControlCenter: "Admin-Kontrollzentrum", providersLabel: "Anbieter", active: "Aktiv", inactive: "Inaktiv", accredited: "Akkreditiert", sponsored: "Gesponsert", withoutOwner: "Ohne Eigentümer", searchPlaceholder: "Anbieter, E-Mail oder Telefon", allStatuses: "Alle Status", allProviderTypes: "Alle Anbietertypen", filter: "Filtern", tableProvider: "Anbieter", location: "Standort", status: "Status", operations: "Betrieb", reputation: "Reputation", lastUpdate: "Letzte Aktualisierung", controls: "Steuerung", members: "Mitglieder", services: "Dienste", staff: "Mitarbeitende", openBookings: "offene Buchungen", reviews: "Bewertungen", workspace: "Arbeitsbereich", deactivate: "Deaktivieren", activate: "Aktivieren", removeAccreditation: "Akkreditierung entfernen", accredit: "Akkreditieren", removeSponsor: "Sponsoring entfernen", sponsor: "Sponsern", reason: "Begründung", noMatchingProviders: "Keine passenden Anbieter", noMatchingProvidersDescription: "Ändern Sie die Filter oder genehmigen Sie zuerst einen Anbieterantrag.", recentAdministration: "Letzte Anbieteradministration", noAdministrationActions: "Es wurden noch keine Anbieteraktionen protokolliert.", reasonRequiredOnDeactivate: "Beim Deaktivieren eines Anbieters ist eine Begründung erforderlich.", providerNotFound: "Anbieter nicht gefunden.", changedActiveStatus: "Anbieteraktivierung geändert", changedAccreditation: "Anbieterakkreditierung geändert", changedSponsorship: "Anbietersponsoring geändert", administrationAction: "Anbieter-Administrationsaktion",
};

const fr: Copy = {
  moduleName: "Profils des prestataires", profile: "Profil", providers: "Prestataires", profilePageTitle: "Profil du prestataire", profilePageDescription: "Gérez les informations du prestataire affichées sur la place de marché LSevin.", profileCardTitle: "Profil du prestataire", providerName: "Nom du prestataire", description: "Description", descriptionHelp: "Saisissez un contenu indépendant et mis en forme pour chaque langue.", details: "Détails supplémentaires", detailsHelp: "Ajoutez des informations opérationnelles ou destinées aux visiteurs dans chaque langue.", streetAddress: "Adresse", streetAddressHelp: "Saisissez l’adresse séparément pour chaque langue prise en charge.", email: "E-mail", countryCode: "Indicatif pays", phone: "Téléphone", postalCode: "Code postal", timezone: "Fuseau horaire", latitude: "Latitude", longitude: "Longitude", profileImage: "Image principale du profil", serviceLanguages: "Langues de service", specialties: "Spécialités", commaSeparated: "Séparez les valeurs par des virgules.", saveProfile: "Enregistrer le profil", adminTitle: "Administration du catalogue des prestataires", adminDescription: "Recherchez les prestataires, contrôlez leur préparation opérationnelle et gérez publication, accréditation et parrainage avec un motif auditable.", adminControlCenter: "Centre de contrôle administrateur", providersLabel: "Prestataires", active: "Actif", inactive: "Inactif", accredited: "Accrédité", sponsored: "Sponsorisé", withoutOwner: "Sans propriétaire", searchPlaceholder: "Prestataire, e-mail ou téléphone", allStatuses: "Tous les statuts", allProviderTypes: "Tous les types de prestataire", filter: "Filtrer", tableProvider: "Prestataire", location: "Emplacement", status: "Statut", operations: "Opérations", reputation: "Réputation", lastUpdate: "Dernière mise à jour", controls: "Contrôles", members: "membres", services: "services", staff: "personnel", openBookings: "réservations ouvertes", reviews: "avis", workspace: "Espace de travail", deactivate: "Désactiver", activate: "Activer", removeAccreditation: "Retirer l’accréditation", accredit: "Accréditer", removeSponsor: "Retirer le parrainage", sponsor: "Sponsoriser", reason: "Motif", noMatchingProviders: "Aucun prestataire correspondant", noMatchingProvidersDescription: "Modifiez les filtres ou approuvez d’abord une demande de prestataire.", recentAdministration: "Administration récente des prestataires", noAdministrationActions: "Aucune action d’administration de prestataire n’a encore été enregistrée.", reasonRequiredOnDeactivate: "Un motif est requis pour désactiver un prestataire.", providerNotFound: "Prestataire introuvable.", changedActiveStatus: "Activation du prestataire modifiée", changedAccreditation: "Accréditation du prestataire modifiée", changedSponsorship: "Parrainage du prestataire modifié", administrationAction: "Action d’administration du prestataire",
};

const dictionaries: Record<PortalLocale, Copy> = { en, fa, ar, tr, es, ku, de, fr };

export type ProvidersCopy = Copy;
export function providersCopy(locale?: string | null): ProvidersCopy {
  return dictionaries[normalizePortalLocale(locale).locale];
}

export function providerAdminActionLabel(locale: string | null | undefined, action: string) {
  const copy = providersCopy(locale);
  if (action === "set_is_active") return copy.changedActiveStatus;
  if (action === "set_accredited") return copy.changedAccreditation;
  if (action === "set_is_sponsored") return copy.changedSponsorship;
  return copy.administrationAction;
}

export const providersMetadata = {
  en: { name: en.moduleName, profile: en.profile, providers: en.providers },
  fa: { name: fa.moduleName, profile: fa.profile, providers: fa.providers },
  ar: { name: ar.moduleName, profile: ar.profile, providers: ar.providers },
  tr: { name: tr.moduleName, profile: tr.profile, providers: tr.providers },
  es: { name: es.moduleName, profile: es.profile, providers: es.providers },
  ku: { name: ku.moduleName, profile: ku.profile, providers: ku.providers },
  de: { name: de.moduleName, profile: de.profile, providers: de.providers },
  fr: { name: fr.moduleName, profile: fr.profile, providers: fr.providers },
} as const;
