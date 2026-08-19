import { normalizePortalLocale, type PortalLocale } from "@core/i18n/config";

const en = {
  moduleName: "Provider Services",
  services: "Services",
  newService: "New service",
  editService: "Edit service",
  providerPageDescription: "Manage provider-specific prices, names, durations, media, and booking settings.",
  addService: "Add service",
  noServicesYet: "No services yet",
  formNewTitle: "New service",
  formEditTitle: "Edit service",
  serviceDefinition: "Global service definition",
  selectService: "Select a service",
  currency: "Currency",
  displayName: "Service display name",
  description: "Service description",
  descriptionHelp: "Enter independent, formatted service content for each supported language.",
  price: "Price",
  durationMinutes: "Duration (minutes)",
  slotIntervalMinutes: "Slot interval (minutes)",
  serviceImage: "Service image",
  active: "Active",
  inactive: "Inactive",
  popular: "Popular",
  saveService: "Save service",
  tableService: "Service",
  tableDefinition: "Definition",
  tablePrice: "Price",
  tableStatus: "Status",
  tableActions: "Actions",
  edit: "Edit",
  delete: "Delete service",
  untitled: "Untitled service",
  adminTitle: "Provider service catalog",
  adminDescription: "Moderate every provider service without changing provider ownership or the stable LSevin service-definition contract.",
  adminControlCenter: "Admin control center",
  servicesLabel: "Services",
  inactiveProviderCount: "On inactive provider",
  searchPlaceholder: "Service, definition, or provider",
  allStatuses: "All statuses",
  allProviders: "All providers",
  filter: "Filter",
  provider: "Provider",
  commercial: "Commercial",
  scheduling: "Scheduling",
  reputation: "Reputation",
  updated: "Updated",
  controls: "Controls",
  providerInactive: "Provider inactive",
  minutes: "minutes",
  minuteSlots: "minute slots",
  reviews: "reviews",
  deactivate: "Deactivate",
  activate: "Activate",
  unfeature: "Unfeature",
  feature: "Feature",
  reason: "Reason",
  noMatchingServices: "No matching services",
  noMatchingServicesDescription: "Change the filters or ask a provider to add a service.",
  recentAdministration: "Recent service administration",
  noAdministrationActions: "No service administration actions have been recorded yet.",
  reasonRequiredOnDeactivate: "A reason is required when deactivating a service.",
  serviceNotFound: "Provider service not found.",
  changedActiveStatus: "Changed service activation",
  changedPopularStatus: "Changed service featured status",
  administrationAction: "Service administration action",
  newPageDescription: "Attach a global LSevin service definition to this provider.",
} as const;

type Copy = { [K in keyof typeof en]: string };

const fa: Copy = {
  moduleName: "خدمات ارائه‌دهنده", services: "خدمات", newService: "خدمت جدید", editService: "ویرایش خدمت", providerPageDescription: "قیمت، نام، مدت، رسانه و تنظیمات رزرو اختصاصی ارائه‌دهنده را مدیریت کنید.", addService: "افزودن خدمت", noServicesYet: "هنوز خدمتی ثبت نشده است", formNewTitle: "خدمت جدید", formEditTitle: "ویرایش خدمت", serviceDefinition: "تعریف خدمت اصلی", selectService: "انتخاب خدمت", currency: "ارز", displayName: "نام نمایشی خدمت", description: "توضیحات خدمت", descriptionHelp: "برای هر زبان پشتیبانی‌شده محتوای مستقل و قالب‌بندی‌شده وارد کنید.", price: "قیمت", durationMinutes: "مدت زمان (دقیقه)", slotIntervalMinutes: "فاصله اسلات‌ها (دقیقه)", serviceImage: "تصویر خدمت", active: "فعال", inactive: "غیرفعال", popular: "محبوب", saveService: "ذخیره خدمت", tableService: "خدمت", tableDefinition: "تعریف اصلی", tablePrice: "قیمت", tableStatus: "وضعیت", tableActions: "عملیات", edit: "ویرایش", delete: "حذف خدمت", untitled: "خدمت بدون عنوان", adminTitle: "مدیریت فهرست خدمات ارائه‌دهندگان", adminDescription: "همه خدمات ارائه‌دهندگان را بدون تغییر مالکیت یا قرارداد پایدار تعریف خدمت در السوین مدیریت کنید.", adminControlCenter: "مرکز کنترل مدیریت", servicesLabel: "خدمات", inactiveProviderCount: "روی ارائه‌دهنده غیرفعال", searchPlaceholder: "خدمت، تعریف اصلی یا ارائه‌دهنده", allStatuses: "همه وضعیت‌ها", allProviders: "همه ارائه‌دهندگان", filter: "فیلتر", provider: "ارائه‌دهنده", commercial: "مالی", scheduling: "زمان‌بندی", reputation: "اعتبار", updated: "به‌روزرسانی", controls: "کنترل‌ها", providerInactive: "ارائه‌دهنده غیرفعال", minutes: "دقیقه", minuteSlots: "دقیقه فاصله اسلات", reviews: "نظر", deactivate: "غیرفعال‌سازی", activate: "فعال‌سازی", unfeature: "حذف از ویژه‌ها", feature: "ویژه‌کردن", reason: "دلیل", noMatchingServices: "خدمت مطابقی یافت نشد", noMatchingServicesDescription: "فیلترها را تغییر دهید یا از ارائه‌دهنده بخواهید خدمتی اضافه کند.", recentAdministration: "آخرین اقدامات مدیریتی خدمات", noAdministrationActions: "هنوز اقدام مدیریتی برای خدمات ثبت نشده است.", reasonRequiredOnDeactivate: "برای غیرفعال‌کردن خدمت واردکردن دلیل الزامی است.", serviceNotFound: "خدمت ارائه‌دهنده یافت نشد.", changedActiveStatus: "وضعیت فعال‌بودن خدمت تغییر کرد", changedPopularStatus: "وضعیت ویژه‌بودن خدمت تغییر کرد", administrationAction: "اقدام مدیریتی خدمت", newPageDescription: "یک تعریف خدمت سراسری السوین را به این ارائه‌دهنده متصل کنید.",
};

const ar: Copy = {
  moduleName: "خدمات مقدم الخدمة", services: "الخدمات", newService: "خدمة جديدة", editService: "تعديل الخدمة", providerPageDescription: "إدارة الأسعار والأسماء والمدد والوسائط وإعدادات الحجز الخاصة بمقدم الخدمة.", addService: "إضافة خدمة", noServicesYet: "لا توجد خدمات بعد", formNewTitle: "خدمة جديدة", formEditTitle: "تعديل الخدمة", serviceDefinition: "تعريف الخدمة العام", selectService: "اختر خدمة", currency: "العملة", displayName: "اسم عرض الخدمة", description: "وصف الخدمة", descriptionHelp: "أدخل محتوى مستقلاً ومنسقاً للخدمة بكل لغة مدعومة.", price: "السعر", durationMinutes: "المدة (بالدقائق)", slotIntervalMinutes: "فاصل المواعيد (بالدقائق)", serviceImage: "صورة الخدمة", active: "نشط", inactive: "غير نشط", popular: "شائع", saveService: "حفظ الخدمة", tableService: "الخدمة", tableDefinition: "التعريف", tablePrice: "السعر", tableStatus: "الحالة", tableActions: "الإجراءات", edit: "تعديل", delete: "حذف الخدمة", untitled: "خدمة بلا عنوان", adminTitle: "دليل خدمات مقدمي الخدمة", adminDescription: "إدارة جميع خدمات مقدمي الخدمة دون تغيير الملكية أو عقد تعريف الخدمة المستقر في LSevin.", adminControlCenter: "مركز تحكم الإدارة", servicesLabel: "الخدمات", inactiveProviderCount: "لدى مقدم خدمة غير نشط", searchPlaceholder: "خدمة أو تعريف أو مقدم خدمة", allStatuses: "كل الحالات", allProviders: "كل مقدمي الخدمة", filter: "تصفية", provider: "مقدم الخدمة", commercial: "تجاري", scheduling: "الجدولة", reputation: "السمعة", updated: "آخر تحديث", controls: "التحكم", providerInactive: "مقدم الخدمة غير نشط", minutes: "دقائق", minuteSlots: "دقائق بين المواعيد", reviews: "مراجعات", deactivate: "تعطيل", activate: "تفعيل", unfeature: "إلغاء التمييز", feature: "تمييز", reason: "السبب", noMatchingServices: "لا توجد خدمات مطابقة", noMatchingServicesDescription: "غيّر عوامل التصفية أو اطلب من مقدم الخدمة إضافة خدمة.", recentAdministration: "أحدث إجراءات إدارة الخدمات", noAdministrationActions: "لم تُسجّل إجراءات إدارية للخدمات بعد.", reasonRequiredOnDeactivate: "يجب إدخال سبب عند تعطيل الخدمة.", serviceNotFound: "لم يتم العثور على خدمة مقدم الخدمة.", changedActiveStatus: "تم تغيير حالة تفعيل الخدمة", changedPopularStatus: "تم تغيير حالة تمييز الخدمة", administrationAction: "إجراء إدارة الخدمة", newPageDescription: "اربط تعريف خدمة عام من LSevin بمقدم الخدمة هذا.",
};

const tr: Copy = {
  moduleName: "Sağlayıcı Hizmetleri", services: "Hizmetler", newService: "Yeni hizmet", editService: "Hizmeti düzenle", providerPageDescription: "Sağlayıcıya özel fiyatları, adları, süreleri, medyayı ve rezervasyon ayarlarını yönetin.", addService: "Hizmet ekle", noServicesYet: "Henüz hizmet yok", formNewTitle: "Yeni hizmet", formEditTitle: "Hizmeti düzenle", serviceDefinition: "Genel hizmet tanımı", selectService: "Hizmet seçin", currency: "Para birimi", displayName: "Hizmet görünen adı", description: "Hizmet açıklaması", descriptionHelp: "Desteklenen her dil için bağımsız ve biçimlendirilmiş hizmet içeriği girin.", price: "Fiyat", durationMinutes: "Süre (dakika)", slotIntervalMinutes: "Randevu aralığı (dakika)", serviceImage: "Hizmet görseli", active: "Etkin", inactive: "Etkin değil", popular: "Popüler", saveService: "Hizmeti kaydet", tableService: "Hizmet", tableDefinition: "Tanım", tablePrice: "Fiyat", tableStatus: "Durum", tableActions: "İşlemler", edit: "Düzenle", delete: "Hizmeti sil", untitled: "Adsız hizmet", adminTitle: "Sağlayıcı hizmet kataloğu", adminDescription: "Sağlayıcı sahipliğini veya LSevin hizmet tanımı sözleşmesini değiştirmeden tüm sağlayıcı hizmetlerini yönetin.", adminControlCenter: "Yönetici kontrol merkezi", servicesLabel: "Hizmetler", inactiveProviderCount: "Etkin olmayan sağlayıcıda", searchPlaceholder: "Hizmet, tanım veya sağlayıcı", allStatuses: "Tüm durumlar", allProviders: "Tüm sağlayıcılar", filter: "Filtrele", provider: "Sağlayıcı", commercial: "Ticari", scheduling: "Planlama", reputation: "İtibar", updated: "Güncellendi", controls: "Kontroller", providerInactive: "Sağlayıcı etkin değil", minutes: "dakika", minuteSlots: "dakikalık aralıklar", reviews: "yorum", deactivate: "Devre dışı bırak", activate: "Etkinleştir", unfeature: "Öne çıkarmayı kaldır", feature: "Öne çıkar", reason: "Gerekçe", noMatchingServices: "Eşleşen hizmet yok", noMatchingServicesDescription: "Filtreleri değiştirin veya sağlayıcıdan hizmet eklemesini isteyin.", recentAdministration: "Son hizmet yönetimi", noAdministrationActions: "Henüz hizmet yönetimi işlemi kaydedilmedi.", reasonRequiredOnDeactivate: "Bir hizmet devre dışı bırakılırken gerekçe gereklidir.", serviceNotFound: "Sağlayıcı hizmeti bulunamadı.", changedActiveStatus: "Hizmet etkinliği değiştirildi", changedPopularStatus: "Hizmet öne çıkarma durumu değiştirildi", administrationAction: "Hizmet yönetimi işlemi", newPageDescription: "Genel bir LSevin hizmet tanımını bu sağlayıcıya bağlayın.",
};

const es: Copy = {
  moduleName: "Servicios del proveedor", services: "Servicios", newService: "Nuevo servicio", editService: "Editar servicio", providerPageDescription: "Gestiona precios, nombres, duraciones, contenido multimedia y ajustes de reserva específicos del proveedor.", addService: "Añadir servicio", noServicesYet: "Aún no hay servicios", formNewTitle: "Nuevo servicio", formEditTitle: "Editar servicio", serviceDefinition: "Definición global del servicio", selectService: "Seleccionar servicio", currency: "Moneda", displayName: "Nombre visible del servicio", description: "Descripción del servicio", descriptionHelp: "Introduce contenido independiente y con formato para cada idioma compatible.", price: "Precio", durationMinutes: "Duración (minutos)", slotIntervalMinutes: "Intervalo de turnos (minutos)", serviceImage: "Imagen del servicio", active: "Activo", inactive: "Inactivo", popular: "Popular", saveService: "Guardar servicio", tableService: "Servicio", tableDefinition: "Definición", tablePrice: "Precio", tableStatus: "Estado", tableActions: "Acciones", edit: "Editar", delete: "Eliminar servicio", untitled: "Servicio sin título", adminTitle: "Catálogo de servicios de proveedores", adminDescription: "Modera todos los servicios sin cambiar la propiedad ni el contrato estable de definiciones de LSevin.", adminControlCenter: "Centro de control administrativo", servicesLabel: "Servicios", inactiveProviderCount: "En proveedor inactivo", searchPlaceholder: "Servicio, definición o proveedor", allStatuses: "Todos los estados", allProviders: "Todos los proveedores", filter: "Filtrar", provider: "Proveedor", commercial: "Comercial", scheduling: "Programación", reputation: "Reputación", updated: "Actualizado", controls: "Controles", providerInactive: "Proveedor inactivo", minutes: "minutos", minuteSlots: "minutos por turno", reviews: "reseñas", deactivate: "Desactivar", activate: "Activar", unfeature: "Quitar destacado", feature: "Destacar", reason: "Motivo", noMatchingServices: "No hay servicios coincidentes", noMatchingServicesDescription: "Cambia los filtros o pide a un proveedor que añada un servicio.", recentAdministration: "Administración reciente de servicios", noAdministrationActions: "Aún no se han registrado acciones administrativas de servicios.", reasonRequiredOnDeactivate: "Se requiere un motivo al desactivar un servicio.", serviceNotFound: "No se encontró el servicio del proveedor.", changedActiveStatus: "Se cambió la activación del servicio", changedPopularStatus: "Se cambió el estado destacado del servicio", administrationAction: "Acción administrativa del servicio", newPageDescription: "Vincula una definición global de servicio de LSevin a este proveedor.",
};

const ku: Copy = {
  moduleName: "خزمەتگوزارییەکانی دابینکەر", services: "خزمەتگوزارییەکان", newService: "خزمەتگوزاریی نوێ", editService: "دەستکاری خزمەتگوزاری", providerPageDescription: "نرخ و ناو و ماوە و میدیا و ڕێکخستنەکانی حجز بۆ دابینکەر بەڕێوەببە.", addService: "زیادکردنی خزمەتگوزاری", noServicesYet: "هێشتا خزمەتگوزاری نییە", formNewTitle: "خزمەتگوزاریی نوێ", formEditTitle: "دەستکاری خزمەتگوزاری", serviceDefinition: "پێناسەی گشتی خزمەتگوزاری", selectService: "خزمەتگوزاری هەڵبژێرە", currency: "دراو", displayName: "ناوی پیشاندانی خزمەتگوزاری", description: "وەسفی خزمەتگوزاری", descriptionHelp: "بۆ هەر زمانێکی پشتگیریکراو ناوەڕۆکی سەربەخۆ و ڕێکخراو بنووسە.", price: "نرخ", durationMinutes: "ماوە (خولەک)", slotIntervalMinutes: "ماوەی نێوان کاتەکان (خولەک)", serviceImage: "وێنەی خزمەتگوزاری", active: "چالاک", inactive: "ناچالاک", popular: "بەناوبانگ", saveService: "پاشەکەوتکردنی خزمەتگوزاری", tableService: "خزمەتگوزاری", tableDefinition: "پێناسە", tablePrice: "نرخ", tableStatus: "دۆخ", tableActions: "کردارەکان", edit: "دەستکاری", delete: "سڕینەوەی خزمەتگوزاری", untitled: "خزمەتگوزاری بێ ناونیشان", adminTitle: "کەتەلۆگی خزمەتگوزاریی دابینکەران", adminDescription: "هەموو خزمەتگوزارییەکان بەبێ گۆڕینی خاوەندارێتی یان گرێبەستی پێناسەی LSevin بەڕێوەببە.", adminControlCenter: "ناوەندی کۆنترۆڵی بەڕێوەبەر", servicesLabel: "خزمەتگوزارییەکان", inactiveProviderCount: "لەسەر دابینکەری ناچالاک", searchPlaceholder: "خزمەتگوزاری، پێناسە یان دابینکەر", allStatuses: "هەموو دۆخەکان", allProviders: "هەموو دابینکەران", filter: "پاڵاوتن", provider: "دابینکەر", commercial: "بازرگانی", scheduling: "کات‌بەندی", reputation: "ناوبانگ", updated: "نوێکراوەتەوە", controls: "کۆنترۆڵەکان", providerInactive: "دابینکەر ناچالاکە", minutes: "خولەک", minuteSlots: "خولەک نێوان کاتەکان", reviews: "هەڵسەنگاندن", deactivate: "ناچالاککردن", activate: "چالاککردن", unfeature: "لابردن لە تایبەت", feature: "کردنە تایبەت", reason: "هۆکار", noMatchingServices: "خزمەتگوزاریی هاوتا نییە", noMatchingServicesDescription: "پاڵاوتنەکان بگۆڕە یان داوا لە دابینکەر بکە خزمەتگوزاری زیاد بکات.", recentAdministration: "دوایین بەڕێوەبردنی خزمەتگوزاری", noAdministrationActions: "هێشتا کرداری بەڕێوەبردنی خزمەتگوزاری تۆمار نەکراوە.", reasonRequiredOnDeactivate: "لە کاتی ناچالاککردنی خزمەتگوزاری هۆکار پێویستە.", serviceNotFound: "خزمەتگوزاریی دابینکەر نەدۆزرایەوە.", changedActiveStatus: "دۆخی چالاکی خزمەتگوزاری گۆڕدرا", changedPopularStatus: "دۆخی تایبەتی خزمەتگوزاری گۆڕدرا", administrationAction: "کرداری بەڕێوەبردنی خزمەتگوزاری", newPageDescription: "پێناسەیەکی گشتی LSevin بەو دابینکەرەوە ببەستە.",
};

const de: Copy = {
  moduleName: "Anbieterleistungen", services: "Leistungen", newService: "Neue Leistung", editService: "Leistung bearbeiten", providerPageDescription: "Anbieterspezifische Preise, Namen, Laufzeiten, Medien und Buchungseinstellungen verwalten.", addService: "Leistung hinzufügen", noServicesYet: "Noch keine Leistungen", formNewTitle: "Neue Leistung", formEditTitle: "Leistung bearbeiten", serviceDefinition: "Globale Leistungsdefinition", selectService: "Leistung auswählen", currency: "Währung", displayName: "Anzeigename der Leistung", description: "Leistungsbeschreibung", descriptionHelp: "Geben Sie für jede unterstützte Sprache eigenständige formatierte Inhalte ein.", price: "Preis", durationMinutes: "Dauer (Minuten)", slotIntervalMinutes: "Terminintervall (Minuten)", serviceImage: "Leistungsbild", active: "Aktiv", inactive: "Inaktiv", popular: "Beliebt", saveService: "Leistung speichern", tableService: "Leistung", tableDefinition: "Definition", tablePrice: "Preis", tableStatus: "Status", tableActions: "Aktionen", edit: "Bearbeiten", delete: "Leistung löschen", untitled: "Unbenannte Leistung", adminTitle: "Anbieter-Leistungskatalog", adminDescription: "Verwalten Sie alle Anbieterleistungen, ohne Eigentum oder den stabilen LSevin-Definitionsvertrag zu verändern.", adminControlCenter: "Admin-Kontrollzentrum", servicesLabel: "Leistungen", inactiveProviderCount: "Bei inaktivem Anbieter", searchPlaceholder: "Leistung, Definition oder Anbieter", allStatuses: "Alle Status", allProviders: "Alle Anbieter", filter: "Filtern", provider: "Anbieter", commercial: "Kommerziell", scheduling: "Planung", reputation: "Bewertung", updated: "Aktualisiert", controls: "Steuerung", providerInactive: "Anbieter inaktiv", minutes: "Minuten", minuteSlots: "Minuten je Termin", reviews: "Bewertungen", deactivate: "Deaktivieren", activate: "Aktivieren", unfeature: "Hervorhebung entfernen", feature: "Hervorheben", reason: "Grund", noMatchingServices: "Keine passenden Leistungen", noMatchingServicesDescription: "Ändern Sie die Filter oder bitten Sie einen Anbieter, eine Leistung hinzuzufügen.", recentAdministration: "Letzte Leistungsverwaltung", noAdministrationActions: "Noch keine administrativen Leistungsaktionen erfasst.", reasonRequiredOnDeactivate: "Beim Deaktivieren einer Leistung ist ein Grund erforderlich.", serviceNotFound: "Anbieterleistung nicht gefunden.", changedActiveStatus: "Leistungsaktivierung geändert", changedPopularStatus: "Hervorhebungsstatus geändert", administrationAction: "Administrative Leistungsaktion", newPageDescription: "Verknüpfen Sie eine globale LSevin-Leistungsdefinition mit diesem Anbieter.",
};

const fr: Copy = {
  moduleName: "Services du prestataire", services: "Services", newService: "Nouveau service", editService: "Modifier le service", providerPageDescription: "Gérez les prix, noms, durées, médias et paramètres de réservation propres au prestataire.", addService: "Ajouter un service", noServicesYet: "Aucun service pour le moment", formNewTitle: "Nouveau service", formEditTitle: "Modifier le service", serviceDefinition: "Définition globale du service", selectService: "Sélectionner un service", currency: "Devise", displayName: "Nom affiché du service", description: "Description du service", descriptionHelp: "Saisissez un contenu indépendant et mis en forme pour chaque langue prise en charge.", price: "Prix", durationMinutes: "Durée (minutes)", slotIntervalMinutes: "Intervalle des créneaux (minutes)", serviceImage: "Image du service", active: "Actif", inactive: "Inactif", popular: "Populaire", saveService: "Enregistrer le service", tableService: "Service", tableDefinition: "Définition", tablePrice: "Prix", tableStatus: "Statut", tableActions: "Actions", edit: "Modifier", delete: "Supprimer le service", untitled: "Service sans titre", adminTitle: "Catalogue des services prestataires", adminDescription: "Modérez tous les services sans modifier leur propriété ni le contrat stable des définitions LSevin.", adminControlCenter: "Centre de contrôle administrateur", servicesLabel: "Services", inactiveProviderCount: "Chez un prestataire inactif", searchPlaceholder: "Service, définition ou prestataire", allStatuses: "Tous les statuts", allProviders: "Tous les prestataires", filter: "Filtrer", provider: "Prestataire", commercial: "Commercial", scheduling: "Planification", reputation: "Réputation", updated: "Mis à jour", controls: "Contrôles", providerInactive: "Prestataire inactif", minutes: "minutes", minuteSlots: "minutes par créneau", reviews: "avis", deactivate: "Désactiver", activate: "Activer", unfeature: "Retirer la mise en avant", feature: "Mettre en avant", reason: "Motif", noMatchingServices: "Aucun service correspondant", noMatchingServicesDescription: "Modifiez les filtres ou demandez à un prestataire d’ajouter un service.", recentAdministration: "Administration récente des services", noAdministrationActions: "Aucune action administrative de service n’a encore été enregistrée.", reasonRequiredOnDeactivate: "Un motif est requis lors de la désactivation d’un service.", serviceNotFound: "Service du prestataire introuvable.", changedActiveStatus: "Activation du service modifiée", changedPopularStatus: "Mise en avant du service modifiée", administrationAction: "Action administrative du service", newPageDescription: "Associez une définition globale de service LSevin à ce prestataire.",
};

const dictionaries: Record<PortalLocale, Copy> = { en, fa, ar, tr, es, ku, de, fr };

export function servicesCopy(locale?: string | null) {
  return dictionaries[normalizePortalLocale(locale).locale];
}

export type ServicesCopy = Copy;

export function serviceAdminActionLabel(locale: string | null | undefined, action: string) {
  const copy = servicesCopy(locale);
  if (action === "set_is_active") return copy.changedActiveStatus;
  if (action === "set_is_popular") return copy.changedPopularStatus;
  return copy.administrationAction;
}

export const servicesMetadata = {
  en: { name: en.moduleName, services: en.services, newService: en.newService, editService: en.editService },
  fa: { name: fa.moduleName, services: fa.services, newService: fa.newService, editService: fa.editService },
  ar: { name: ar.moduleName, services: ar.services, newService: ar.newService, editService: ar.editService },
  tr: { name: tr.moduleName, services: tr.services, newService: tr.newService, editService: tr.editService },
  es: { name: es.moduleName, services: es.services, newService: es.newService, editService: es.editService },
  ku: { name: ku.moduleName, services: ku.services, newService: ku.newService, editService: ku.editService },
  de: { name: de.moduleName, services: de.services, newService: de.newService, editService: de.editService },
  fr: { name: fr.moduleName, services: fr.services, newService: fr.newService, editService: fr.editService },
} satisfies Record<PortalLocale, { name: string; services: string; newService: string; editService: string }>;
