import type { PortalLocale } from "./config";

type LSevinTranslationRow = Partial<Record<Exclude<PortalLocale, "en">, string>>;

export const lsevinUiTextRows: Record<string, LSevinTranslationRow> = {
  "admin": {
    "fa": "مدیریت",
    "ar": "مشرف"
  },
  "about": {
    "fa": "درباره",
    "ar": "نبذة"
  },
  "accept": {
    "fa": "Accept",
    "ar": "قبول"
  },
  "accepted files": {
    "fa": "فایل‌های مجاز",
    "ar": "الملفات المقبولة",
    "tr": "Accepted files",
    "es": "Accepted files",
    "ku": "Accepted files",
    "de": "Accepted files",
    "fr": "Accepted files"
  },
  "account holder": {
    "fa": "Account holder",
    "ar": "صاحب الحساب"
  },
  "accredited": {
    "fa": "Accredited",
    "ar": "معتمد"
  },
  "action": {
    "fa": "Action",
    "ar": "إجراء"
  },
  "activate": {
    "fa": "فعال‌سازی",
    "ar": "تفعيل",
    "tr": "Aktifleştir",
    "es": "Activar",
    "ku": "چالاککردن",
    "de": "Aktivieren",
    "fr": "Activer"
  },
  "active": {
    "fa": "فعال",
    "ar": "نشط",
    "tr": "Aktif",
    "es": "Activo",
    "ku": "چالاک",
    "de": "Aktiv",
    "fr": "Actif"
  },
  "active offers": {
    "fa": "پیشنهادهای فعال",
    "ar": "العروض النشطة"
  },
  "active services": {
    "fa": "خدمات فعال",
    "ar": "نشط الخدمات",
    "tr": "Aktif Hizmetler",
    "es": "Servicios activos",
    "ku": "خزمەتە چالاکەکان",
    "de": "Aktive Leistungen",
    "fr": "Services actifs"
  },
  "active users": {
    "fa": "کاربران فعال",
    "ar": "المستخدمون النشطون"
  },
  "activity timeline": {
    "fa": "فعالیت Timeline",
    "ar": "الجدول الزمني للنشاط"
  },
  "actor": {
    "fa": "Actor",
    "ar": "الفاعل"
  },
  "add": {
    "fa": "افزودن",
    "ar": "إضافة",
    "tr": "Ekle",
    "es": "Añadir",
    "ku": "زیادکردن",
    "de": "Hinzufügen",
    "fr": "Ajouter"
  },
  "add media": {
    "fa": "افزودن رسانه",
    "ar": "إضافة وسائط"
  },
  "add note": {
    "fa": "افزودن یادداشت",
    "ar": "إضافة ملاحظة"
  },
  "add payout account": {
    "fa": "Add payout account",
    "ar": "إضافة حساب دفع"
  },
  "add requirement": {
    "fa": "افزودن الزام",
    "ar": "إضافة المتطلب",
    "tr": "Gereklilik Ekle",
    "es": "Añadir requisito",
    "ku": "زیادکردنی پێداویستی",
    "de": "Anforderung hinzufügen",
    "fr": "Ajouter une exigence"
  },
  "add service": {
    "fa": "افزودن خدمت",
    "ar": "إضافة الخدمة",
    "tr": "Hizmet Ata",
    "es": "Asignar servicio",
    "ku": "زیادکردنی خزمەت",
    "de": "Leistung hinzufügen",
    "fr": "Ajouter un service"
  },
  "add staff": {
    "fa": "افزودن پرسنل",
    "ar": "إضافة الموظفون",
    "tr": "Personel Ekle",
    "es": "Añadir personal",
    "ku": "زیادکردنی کارمەند",
    "de": "Mitarbeiter hinzufügen",
    "fr": "Ajouter un membre du personnel"
  },
  "add step": {
    "fa": "افزودن مرحله",
    "ar": "إضافة خطوة"
  },
  "additional details": {
    "fa": "جزئیات بیشتر",
    "ar": "إضافية التفاصيل",
    "tr": "Ek Detaylar",
    "es": "Detalles adicionales",
    "ku": "وردەکاریی زیاتر",
    "de": "Zusätzliche Details",
    "fr": "Détails supplémentaires"
  },
  "address": {
    "fa": "آدرس",
    "ar": "العنوان",
    "tr": "Adres",
    "es": "Dirección",
    "ku": "ناونیشان",
    "de": "Adresse",
    "fr": "Adresse"
  },
  "all": {
    "fa": "همه",
    "ar": "الكل"
  },
  "all roles": {
    "fa": "همه نقش‌ها",
    "ar": "كل الأدوار"
  },
  "all services": {
    "fa": "همه خدمات",
    "ar": "كل الخدمات"
  },
  "all statuses": {
    "fa": "همه Statuses",
    "ar": "كل الحالات"
  },
  "amount": {
    "fa": "مبلغ",
    "ar": "المبلغ"
  },
  "analytics": {
    "fa": "تحلیل‌ها",
    "ar": "التحليلات"
  },
  "answer": {
    "fa": "پاسخ",
    "ar": "الإجابة"
  },
  "any": {
    "fa": "همه",
    "ar": "أي",
    "tr": "Herhangi",
    "es": "Cualquiera",
    "ku": "هەر کام",
    "de": "Beliebig",
    "fr": "Tout"
  },
  "applicant": {
    "fa": "Applicant",
    "ar": "مقدم الطلب"
  },
  "applications": {
    "fa": "درخواست‌ها",
    "ar": "الطلبات"
  },
  "apply": {
    "fa": "اعمال",
    "ar": "تطبيق"
  },
  "approve": {
    "fa": "تایید",
    "ar": "الموافقة",
    "tr": "Onayla",
    "es": "Aprobar",
    "ku": "پەسەندکردن",
    "de": "Genehmigen",
    "fr": "Approuver"
  },
  "approved": {
    "fa": "تایید شده",
    "ar": "موافق عليه",
    "tr": "Onaylandı",
    "es": "Aprobado",
    "ku": "پەسەندکراو",
    "de": "Genehmigt",
    "fr": "Approuvé"
  },
  "asia/tehran": {
    "fa": "Asia/Tehran",
    "ar": "آسيا/طهران"
  },
  "assigned": {
    "fa": "اختصاص داده شد",
    "ar": "تم الإسناد"
  },
  "availability": {
    "fa": "دسترسی‌پذیری",
    "ar": "التوفر"
  },
  "available": {
    "fa": "در دسترس",
    "ar": "متاح",
    "tr": "Müsait",
    "es": "Disponible",
    "ku": "بەردەست",
    "de": "Verfügbar",
    "fr": "Disponible"
  },
  "average rating": {
    "fa": "میانگین امتیاز",
    "ar": "متوسط التقييم"
  },
  "bank name": {
    "fa": "Bank name",
    "ar": "اسم البنك"
  },
  "beauty": {
    "fa": "زیبایی",
    "ar": "الجمال",
    "tr": "Güzellik",
    "es": "Belleza",
    "ku": "دڵرایەتی",
    "de": "Beauty",
    "fr": "Beauté"
  },
  "billing": {
    "fa": "صورتحساب",
    "ar": "الفوترة"
  },
  "biography": {
    "fa": "بیوگرافی",
    "ar": "السيرة الذاتية",
    "tr": "Biyografi",
    "es": "Biografía",
    "ku": "ژیاننامە",
    "de": "Biografie",
    "fr": "Biographie"
  },
  "body": {
    "fa": "Body",
    "ar": "المتن"
  },
  "bookable resource": {
    "fa": "bookable منبع",
    "ar": "قابل للحجز مورد"
  },
  "bookable resources": {
    "fa": "bookable منابع",
    "ar": "الموارد القابلة للحجز"
  },
  "booking": {
    "fa": "رزرو",
    "ar": "الحجز"
  },
  "booking id": {
    "fa": "شناسه رزرو",
    "ar": "معرّف الحجز"
  },
  "booking management": {
    "fa": "مدیریت رزرو",
    "ar": "إدارة الحجز"
  },
  "booking operations": {
    "fa": "عملیات رزرو",
    "ar": "عمليات الحجز"
  },
  "booking created": {
    "fa": "رزرو ایجاد شد",
    "ar": "تم إنشاء الحجز"
  },
  "bookings": {
    "fa": "رزروها",
    "ar": "الحجوزات"
  },
  "budget": {
    "fa": "Budget",
    "ar": "الميزانية"
  },
  "code": {
    "fa": "کد",
    "ar": "الكود"
  },
  "campaigns": {
    "fa": "کمپین‌ها",
    "ar": "الحملات"
  },
  "cancelled": {
    "fa": "لغوشده",
    "ar": "ملغى"
  },
  "capacity": {
    "fa": "ظرفیت",
    "ar": "السعة"
  },
  "category": {
    "fa": "دسته‌بندی",
    "ar": "الفئة",
    "tr": "Kategori",
    "es": "Categoría",
    "ku": "هاوپۆل",
    "de": "Kategorie",
    "fr": "Catégorie"
  },
  "channel": {
    "fa": "Channel",
    "ar": "القناة"
  },
  "city": {
    "fa": "شهر",
    "ar": "المدينة",
    "tr": "Şehir",
    "es": "Ciudad",
    "ku": "شار",
    "de": "Stadt",
    "fr": "Ville"
  },
  "clear": {
    "fa": "پاک کردن",
    "ar": "مسح"
  },
  "clinic": {
    "fa": "کلینیک",
    "ar": "عيادة"
  },
  "close": {
    "fa": "بستن",
    "ar": "إغلاق",
    "tr": "Kapat",
    "es": "Cerrar",
    "ku": "داخستن",
    "de": "Schließen",
    "fr": "Fermer"
  },
  "closed": {
    "fa": "بسته",
    "ar": "مغلق"
  },
  "closes at": {
    "fa": "Closes at",
    "ar": "يغلق في"
  },
  "commercial": {
    "fa": "تجاری",
    "ar": "تجاري"
  },
  "complete": {
    "fa": "Complete",
    "ar": "إكمال"
  },
  "completed": {
    "fa": "تکمیل‌شده",
    "ar": "مكتمل"
  },
  "confirmed": {
    "fa": "تأییدشده",
    "ar": "مؤكد"
  },
  "consultation": {
    "fa": "مشاوره",
    "ar": "الاستشارة"
  },
  "contact": {
    "fa": "Contact",
    "ar": "التواصل"
  },
  "content": {
    "fa": "محتوا",
    "ar": "المحتوى"
  },
  "content type": {
    "fa": "محتوا نوع",
    "ar": "نوع المحتوى"
  },
  "continue": {
    "fa": "ادامه",
    "ar": "متابعة",
    "tr": "Continue",
    "es": "Continue",
    "ku": "Continue",
    "de": "Continue",
    "fr": "Continue"
  },
  "conversation": {
    "fa": "گفتگو",
    "ar": "المحادثة"
  },
  "country": {
    "fa": "کشور",
    "ar": "الدولة",
    "tr": "Ülke",
    "es": "País",
    "ku": "وڵات",
    "de": "Land",
    "fr": "Pays"
  },
  "country code": {
    "fa": "کد کشور",
    "ar": "الدولة الكود",
    "tr": "Ülke Kodu",
    "es": "Código de país",
    "ku": "کۆدی وڵات",
    "de": "Ländercode",
    "fr": "Code pays"
  },
  "create campaign": {
    "fa": "ایجاد کمپین",
    "ar": "إنشاء الحملة"
  },
  "create offer": {
    "fa": "ایجاد پیشنهاد",
    "ar": "إنشاء العرض"
  },
  "create staff": {
    "fa": "Create staff",
    "ar": "إنشاء الموظفون"
  },
  "created": {
    "fa": "تاریخ ایجاد",
    "ar": "تم الإنشاء",
    "tr": "Oluşturulma",
    "es": "Creado",
    "ku": "دروستکرا",
    "de": "Erstellt",
    "fr": "Créé le"
  },
  "credits": {
    "fa": "واریزی‌ها",
    "ar": "إيداعات"
  },
  "critical": {
    "fa": "بحرانی",
    "ar": "حرج"
  },
  "currency": {
    "fa": "واحد پول",
    "ar": "العملة",
    "tr": "Para Birimi",
    "es": "Moneda",
    "ku": "دراو",
    "de": "Währung",
    "fr": "Devise"
  },
  "custom": {
    "fa": "سفارشی",
    "ar": "مخصص"
  },
  "customer": {
    "fa": "کاربر",
    "ar": "العميل",
    "tr": "Müşteri",
    "es": "Cliente",
    "ku": "خەریدار",
    "de": "Kunde",
    "fr": "Client"
  },
  "customer requests": {
    "fa": "درخواست‌های مشتری",
    "ar": "العميل الطلبات"
  },
  "dashboard": {
    "fa": "داشبورد",
    "ar": "لوحة التحكم",
    "tr": "Kontrol Paneli",
    "es": "Panel",
    "ku": "داشبۆرد",
    "de": "Dashboard",
    "fr": "Tableau de bord"
  },
  "date": {
    "fa": "تاریخ",
    "ar": "التاريخ",
    "tr": "Tarih",
    "es": "Fecha",
    "ku": "بەروار",
    "de": "Datum",
    "fr": "Date"
  },
  "day": {
    "fa": "روز",
    "ar": "اليوم"
  },
  "deactivate": {
    "fa": "غیرفعال‌سازی",
    "ar": "إلغاء التفعيل",
    "tr": "Pasifleştir",
    "es": "Desactivar",
    "ku": "ناچالاککردن",
    "de": "Deaktivieren",
    "fr": "Désactiver"
  },
  "default": {
    "fa": "Default",
    "ar": "افتراضي"
  },
  "dental": {
    "fa": "دندان‌پزشکی",
    "ar": "طب الأسنان"
  },
  "deposit": {
    "fa": "Deposit",
    "ar": "العربون"
  },
  "description": {
    "fa": "توضیحات",
    "ar": "الوصف",
    "tr": "Açıklama",
    "es": "Descripción",
    "ku": "پەسناس",
    "de": "Beschreibung",
    "fr": "Description"
  },
  "details": {
    "fa": "جزئیات",
    "ar": "التفاصيل"
  },
  "disabled": {
    "fa": "غیرفعال",
    "ar": "معطّل"
  },
  "discount": {
    "fa": "Discount",
    "ar": "الخصم"
  },
  "display name": {
    "fa": "نام نمایشی",
    "ar": "العرض الاسم",
    "tr": "Görünen Ad",
    "es": "Nombre para mostrar",
    "ku": "ناوی نیشاندان",
    "de": "Anzeigename",
    "fr": "Nom d'affichage"
  },
  "display order": {
    "fa": "ترتیب نمایش",
    "ar": "العرض الترتيب",
    "tr": "Görüntüleme Sırası",
    "es": "Orden de visualización",
    "ku": "ڕیز",
    "de": "Anzeigereihenfolge",
    "fr": "Ordre d'affichage"
  },
  "document": {
    "fa": "مدرک",
    "ar": "مستند"
  },
  "draft": {
    "fa": "Draft",
    "ar": "مسودة"
  },
  "duplicate": {
    "fa": "Duplicate",
    "ar": "تكرار"
  },
  "edit": {
    "fa": "ویرایش",
    "ar": "تعديل",
    "tr": "Düzenle",
    "es": "Editar",
    "ku": "دەستکاری",
    "de": "Bearbeiten",
    "fr": "Modifier"
  },
  "edit service": {
    "fa": "Edit service",
    "ar": "تعديل الخدمة"
  },
  "edit staff": {
    "fa": "ویرایش کارمند",
    "ar": "تعديل الموظفون"
  },
  "editor": {
    "fa": "ویرایشگر",
    "ar": "محرر"
  },
  "education": {
    "fa": "تحصیلات",
    "ar": "التعليم"
  },
  "email": {
    "fa": "ایمیل",
    "ar": "البريد الإلكتروني",
    "tr": "E-posta",
    "es": "Correo electrónico",
    "ku": "ئیمەیل",
    "de": "E-Mail",
    "fr": "E-mail"
  },
  "emergency contact": {
    "fa": "تماس اضطراری",
    "ar": "جهة اتصال الطوارئ"
  },
  "enabled": {
    "fa": "فعال",
    "ar": "مفعّل"
  },
  "experience": {
    "fa": "تجربه",
    "ar": "التجربة"
  },
  "faqs": {
    "fa": "سؤالات متداول",
    "ar": "الأسئلة الشائعة"
  },
  "featured": {
    "fa": "ویژه",
    "ar": "مميز"
  },
  "fee": {
    "fa": "هزینه",
    "ar": "رسوم"
  },
  "file": {
    "fa": "File",
    "ar": "ملف"
  },
  "filter": {
    "fa": "فیلتر",
    "ar": "تصفية"
  },
  "financial": {
    "fa": "Financial",
    "ar": "مالي"
  },
  "fitness": {
    "fa": "تناسب اندام",
    "ar": "اللياقة"
  },
  "free": {
    "fa": "رایگان",
    "ar": "مجاني"
  },
  "from": {
    "fa": "از",
    "ar": "من"
  },
  "full name": {
    "fa": "نام و نام خانوادگی",
    "ar": "كامل الاسم",
    "tr": "Ad Soyad",
    "es": "Nombre completo",
    "ku": "ناوی تەواو",
    "de": "Vollständiger Name",
    "fr": "Nom complet"
  },
  "gallery": {
    "fa": "گالری",
    "ar": "المعرض",
    "tr": "Galeri",
    "es": "Galería",
    "ku": "گەلەری",
    "de": "Galerie",
    "fr": "Galerie"
  },
  "gateway": {
    "fa": "Gateway",
    "ar": "بوابة الدفع"
  },
  "general": {
    "fa": "عمومی",
    "ar": "عام"
  },
  "generic": {
    "fa": "Generic",
    "ar": "عام"
  },
  "global": {
    "fa": "سراسری",
    "ar": "عام"
  },
  "global service definition": {
    "fa": "Global service definition",
    "ar": "عام تعريف الخدمة"
  },
  "gross": {
    "fa": "Gross",
    "ar": "الإجمالي"
  },
  "growth": {
    "fa": "رشد",
    "ar": "النمو"
  },
  "help text": {
    "fa": "متن کمکی",
    "ar": "نص المساعدة"
  },
  "high": {
    "fa": "زیاد",
    "ar": "عالٍ"
  },
  "hotel": {
    "fa": "Hotel",
    "ar": "فندق"
  },
  "hotels": {
    "fa": "هتل‌ها",
    "ar": "الفنادق"
  },
  "how it works": {
    "fa": "نحوه کار",
    "ar": "طريقة العمل"
  },
  "iban": {
    "fa": "IBAN",
    "ar": "IBAN"
  },
  "image": {
    "fa": "تصویر",
    "ar": "الصورة"
  },
  "in progress": {
    "fa": "در حال انجام",
    "ar": "قيد التنفيذ"
  },
  "in review": {
    "fa": "در حال بررسی",
    "ar": "في مراجعة"
  },
  "in-app": {
    "fa": "in App",
    "ar": "في-app"
  },
  "inactive": {
    "fa": "غیرفعال",
    "ar": "غير نشط",
    "tr": "Pasif",
    "es": "Inactivo",
    "ku": "ناچالاک",
    "de": "Inaktiv",
    "fr": "Inactif"
  },
  "inbox": {
    "fa": "Inbox",
    "ar": "صندوق الوارد"
  },
  "included items": {
    "fa": "موارد شامل‌شده",
    "ar": "مشمول عناصر"
  },
  "instagram": {
    "fa": "اینستاگرام",
    "ar": "إنستغرام"
  },
  "internal note": {
    "fa": "یادداشت داخلی",
    "ar": "ملاحظة داخلية"
  },
  "invoice": {
    "fa": "Invoice",
    "ar": "فاتورة"
  },
  "iran": {
    "fa": "ایران",
    "ar": "إيران"
  },
  "lsevin customer": {
    "fa": "مشتری LSevin",
    "ar": "عميل LSevin"
  },
  "label": {
    "fa": "Label",
    "ar": "التسمية"
  },
  "latitude": {
    "fa": "عرض جغرافیایی",
    "ar": "خط العرض"
  },
  "learn more": {
    "fa": "اطلاعات بیشتر",
    "ar": "معرفة المزيد"
  },
  "legal name": {
    "fa": "legal نام",
    "ar": "الاسم القانوني"
  },
  "limit": {
    "fa": "تعداد نتایج",
    "ar": "الحد"
  },
  "link": {
    "fa": "Link",
    "ar": "رابط"
  },
  "loading": {
    "fa": "در حال بارگذاری",
    "ar": "جارٍ التحميل"
  },
  "locale": {
    "fa": "زبان",
    "ar": "اللغة"
  },
  "location": {
    "fa": "موقعیت مکانی",
    "ar": "الموقع",
    "tr": "Konum",
    "es": "Ubicación",
    "ku": "شوێن",
    "de": "Standort",
    "fr": "Localisation"
  },
  "longitude": {
    "fa": "طول جغرافیایی",
    "ar": "خط الطول"
  },
  "low": {
    "fa": "کم",
    "ar": "منخفض"
  },
  "manage": {
    "fa": "مدیریت",
    "ar": "إدارة"
  },
  "manager": {
    "fa": "مدیر",
    "ar": "مدير"
  },
  "mark paid": {
    "fa": "mark Paid",
    "ar": "Mark مدفوع"
  },
  "max": {
    "fa": "حداکثر",
    "ar": "الحد الأعلى"
  },
  "max price": {
    "fa": "حداکثر قیمت",
    "ar": "الحد الأقصى للسعر"
  },
  "media": {
    "fa": "رسانه",
    "ar": "الوسائط"
  },
  "media type": {
    "fa": "رسانه نوع",
    "ar": "نوع الوسائط"
  },
  "medical": {
    "fa": "پزشکی",
    "ar": "طبي",
    "tr": "Tıp",
    "es": "Salud",
    "ku": "پزیشکی",
    "de": "Medizin",
    "fr": "Médical"
  },
  "message": {
    "fa": "پیام",
    "ar": "الرسالة",
    "tr": "Mesaj",
    "es": "Mensaje",
    "ku": "پەیام",
    "de": "Nachricht",
    "fr": "Message"
  },
  "messages": {
    "fa": "پیام‌ها",
    "ar": "الرسائل"
  },
  "min": {
    "fa": "دقیقه",
    "ar": "min",
    "tr": "dk",
    "es": "min",
    "ku": "خولەک",
    "de": "min",
    "fr": "min"
  },
  "mode:": {
    "fa": "حالت:",
    "ar": "الوضع:"
  },
  "module": {
    "fa": "Module",
    "ar": "الوحدة"
  },
  "name": {
    "fa": "نام",
    "ar": "L Sevin",
    "tr": "L Sevin",
    "es": "L Sevin",
    "ku": "L Sevin",
    "de": "L Sevin",
    "fr": "L Sevin"
  },
  "new ticket": {
    "fa": "تیکت جدید",
    "ar": "تذكرة جديدة"
  },
  "no events yet.": {
    "fa": "هنوز رویدادی ثبت نشده است.",
    "ar": "لا توجد أحداث بعد."
  },
  "no ledger entries yet.": {
    "fa": "No ledger entries yet.",
    "ar": "لا يوجد دفتر الأستاذ entries yet."
  },
  "no offers yet.": {
    "fa": "هنوز پیشنهادی وجود ندارد.",
    "ar": "لا يوجد العروض yet."
  },
  "no options found.": {
    "fa": "گزینه‌ای پیدا نشد.",
    "ar": "لم يتم العثور على خيارات."
  },
  "no payout accounts yet.": {
    "fa": "No payout accounts yet.",
    "ar": "لا يوجد الدفع للمزوّد الحسابات yet."
  },
  "no provider workspace yet": {
    "fa": "No provider workspace yet",
    "ar": "لا يوجد مساحة عمل المزوّد yet"
  },
  "no reviews yet.": {
    "fa": "No reviews yet.",
    "ar": "لا يوجد المراجعات yet."
  },
  "no roles": {
    "fa": "no نقش‌ها",
    "ar": "No الأدوار."
  },
  "no services yet": {
    "fa": "No services yet",
    "ar": "لا يوجد الخدمات yet"
  },
  "normal": {
    "fa": "معمولی",
    "ar": "عادية"
  },
  "not required": {
    "fa": "نیاز نیست",
    "ar": "غير مطلوب"
  },
  "notes": {
    "fa": "یادداشت‌ها",
    "ar": "الملاحظات",
    "tr": "Notlar",
    "es": "Notas",
    "ku": "تێبینییەکان",
    "de": "Notizen",
    "fr": "Notes"
  },
  "notification templates": {
    "fa": "اعلان قالب‌ها",
    "ar": "قوالب الإشعارات"
  },
  "notifications": {
    "fa": "اعلان‌ها",
    "ar": "الإشعارات"
  },
  "offer": {
    "fa": "Offer",
    "ar": "العرض"
  },
  "offers": {
    "fa": "پیشنهادها",
    "ar": "العروض"
  },
  "office hours": {
    "fa": "ساعات کاری",
    "ar": "ساعات العمل"
  },
  "open": {
    "fa": "باز کردن",
    "ar": "مفتوح"
  },
  "open requests": {
    "fa": "درخواست‌های باز",
    "ar": "فتح الطلبات",
    "tr": "Açık Talepler",
    "es": "Solicitudes abiertas",
    "ku": "داواکارییە کراوەکان",
    "de": "Offene Anfragen",
    "fr": "Demandes ouvertes"
  },
  "open workspace": {
    "fa": "Open workspace",
    "ar": "فتح مساحة العمل"
  },
  "opens at": {
    "fa": "Opens at",
    "ar": "يفتح في"
  },
  "operating hours": {
    "fa": "Operating hours",
    "ar": "Operating ساعات"
  },
  "optional": {
    "fa": "اختیاری",
    "ar": "اختياري",
    "tr": "Optional",
    "es": "Optional",
    "ku": "Optional",
    "de": "Optional",
    "fr": "Optional"
  },
  "order": {
    "fa": "ترتیب",
    "ar": "الترتيب",
    "tr": "Sıra",
    "es": "Orden",
    "ku": "ڕیز",
    "de": "Reihenfolge",
    "fr": "Ordre"
  },
  "other": {
    "fa": "سایر",
    "ar": "أخرى",
    "tr": "Diğer",
    "es": "Otro",
    "ku": "هی تر",
    "de": "Divers",
    "fr": "Autre"
  },
  "overview": {
    "fa": "بررسی کلی",
    "ar": "نظرة عامة",
    "tr": "Genel Bakış",
    "es": "Resumen",
    "ku": "کورتە",
    "de": "Übersicht",
    "fr": "Aperçu"
  },
  "owner": {
    "fa": "مالک",
    "ar": "المالك"
  },
  "package": {
    "fa": "پکیج",
    "ar": "باقة"
  },
  "paid": {
    "fa": "پرداخت‌شده",
    "ar": "مدفوع"
  },
  "paid amount": {
    "fa": "مبلغ پرداخت‌شده",
    "ar": "المبلغ المدفوع"
  },
  "passport": {
    "fa": "گذرنامه",
    "ar": "جواز السفر",
    "tr": "Pasaport",
    "es": "Pasaporte",
    "ku": "پاسپۆرت",
    "de": "Reisepass",
    "fr": "Passeport"
  },
  "paused": {
    "fa": "Paused",
    "ar": "متوقف مؤقتاً"
  },
  "payment": {
    "fa": "پرداخت",
    "ar": "الدفع"
  },
  "payment method": {
    "fa": "روش پرداخت",
    "ar": "طريقة الدفع"
  },
  "payout account": {
    "fa": "Payout account",
    "ar": "حساب الدفع"
  },
  "payout accounts": {
    "fa": "Payout accounts",
    "ar": "الدفع للمزوّد الحسابات"
  },
  "pending": {
    "fa": "درحال انتظار",
    "ar": "معلق",
    "tr": "Beklemede",
    "es": "Pendiente",
    "ku": "چاوەڕوان",
    "de": "Ausstehend",
    "fr": "En attente"
  },
  "pending payment": {
    "fa": "پرداخت در انتظار",
    "ar": "دفع معلّق"
  },
  "pending verification": {
    "fa": "در انتظار Verification",
    "ar": "بانتظار التحقق"
  },
  "period end": {
    "fa": "Period end",
    "ar": "الفترة end"
  },
  "period start": {
    "fa": "Period start",
    "ar": "الفترة بدء"
  },
  "phone": {
    "fa": "تلفن",
    "ar": "الهاتف",
    "tr": "Telefon",
    "es": "Teléfono",
    "ku": "تەلەفۆن",
    "de": "Telefon",
    "fr": "Téléphone"
  },
  "popular": {
    "fa": "محبوب",
    "ar": "شائع"
  },
  "preferences": {
    "fa": "Preferences",
    "ar": "التفضيلات"
  },
  "price": {
    "fa": "قیمت",
    "ar": "السعر",
    "tr": "Fiyat",
    "es": "Precio",
    "ku": "نرخ",
    "de": "Preis",
    "fr": "Prix"
  },
  "primary": {
    "fa": "اصلی",
    "ar": "أساسي"
  },
  "priority": {
    "fa": "اولویت",
    "ar": "الأولوية"
  },
  "procedure": {
    "fa": "فرآیند درمان",
    "ar": "الإجراء"
  },
  "processed": {
    "fa": "Processed",
    "ar": "تمت المعالجة"
  },
  "products": {
    "fa": "محصولات",
    "ar": "المنتجات"
  },
  "professional title": {
    "fa": "عنوان حرفه‌ای",
    "ar": "المسمى المهني"
  },
  "profile": {
    "fa": "پروفایل",
    "ar": "الملف الشخصي",
    "tr": "Profil",
    "es": "Perfil",
    "ku": "پرۆفایل",
    "de": "Profil",
    "fr": "Profil"
  },
  "profile image": {
    "fa": "پروفایل تصویر",
    "ar": "صورة الملف الشخصي"
  },
  "profile summary": {
    "fa": "پروفایل خلاصه",
    "ar": "ملخص الملف الشخصي"
  },
  "profile views": {
    "fa": "بازدیدهای پروفایل",
    "ar": "مشاهدات الملف"
  },
  "promise": {
    "fa": "Promise",
    "ar": "Promise"
  },
  "promotional offers for provider services.": {
    "fa": "Promotional offers for provider services.",
    "ar": "Promotional العروض لـ خدمات المزوّد."
  },
  "provider": {
    "fa": "ارائه دهنده",
    "ar": "المزوّد",
    "tr": "Sağlayıcı",
    "es": "Proveedor",
    "ku": "دابینکەر",
    "de": "Anbieter",
    "fr": "Prestataire"
  },
  "provider applications": {
    "fa": "ارائه‌دهنده Applications",
    "ar": "طلبات المزوّدين"
  },
  "provider id": {
    "fa": "شناسه ارائه‌دهنده",
    "ar": "المزوّد ID"
  },
  "provider media": {
    "fa": "Provider media",
    "ar": "المزوّد الوسائط"
  },
  "provider profile": {
    "fa": "Provider profile",
    "ar": "المزوّد الملف الشخصي"
  },
  "provider reviews": {
    "fa": "دیدگاه‌های ارائه‌دهنده",
    "ar": "المزوّد المراجعات"
  },
  "provider services": {
    "fa": "ارائه‌دهنده خدمات",
    "ar": "خدمات المزوّد"
  },
  "provider staff": {
    "fa": "ارائه‌دهنده کارکنان",
    "ar": "موظفو المزوّد"
  },
  "provider invoices": {
    "fa": "فاکتورهای ارائه‌دهنده",
    "ar": "المزوّد invoices"
  },
  "provider name": {
    "fa": "نام ارائه‌دهنده",
    "ar": "المزوّد الاسم",
    "tr": "Sağlayıcı Adı",
    "es": "Nombre del proveedor",
    "ku": "ناوی دابینکەر",
    "de": "Name des Anbieters",
    "fr": "Nom du prestataire"
  },
  "provider notes": {
    "fa": "یادداشت‌های ارائه‌دهنده",
    "ar": "ملاحظات المزوّد"
  },
  "provider operating hours": {
    "fa": "ساعات کاری ارائه‌دهنده",
    "ar": "المزوّد operating ساعات"
  },
  "provider payable": {
    "fa": "ارائه‌دهنده Payable",
    "ar": "مستحقات المزوّد"
  },
  "provider policies": {
    "fa": "سیاست‌های ارائه‌دهنده",
    "ar": "المزوّد السياسات"
  },
  "provider service": {
    "fa": "ارائه‌دهنده خدمت",
    "ar": "خدمة المزوّد"
  },
  "provider type": {
    "fa": "نوع ارائه‌دهنده",
    "ar": "نوع المزوّد",
    "tr": "Sağlayıcı Türü",
    "es": "Tipo de proveedor",
    "ku": "جۆری دابینکەر",
    "de": "Anbietertyp",
    "fr": "Type de prestataire"
  },
  "providers": {
    "fa": "ارائه‌دهندگان",
    "ar": "المزوّدون"
  },
  "public": {
    "fa": "عمومی",
    "ar": "عام"
  },
  "push": {
    "fa": "Push",
    "ar": "إشعار فوري"
  },
  "question": {
    "fa": "سؤال",
    "ar": "السؤال"
  },
  "rating": {
    "fa": "امتیاز",
    "ar": "التقييم",
    "tr": "Değerlendirme",
    "es": "Calificación",
    "ku": "هەڵسەنگاندن",
    "de": "Bewertung",
    "fr": "Évaluation"
  },
  "reason": {
    "fa": "دلیل",
    "ar": "السبب"
  },
  "referral code": {
    "fa": "کد دعوت",
    "ar": "رمز الدعوة"
  },
  "refund request": {
    "fa": "بازپرداخت درخواست",
    "ar": "طلب الاسترداد"
  },
  "reject": {
    "fa": "رد",
    "ar": "رفض",
    "tr": "Reddet",
    "es": "Rechazar",
    "ku": "ڕەتکردن",
    "de": "Ablehnen",
    "fr": "Refuser"
  },
  "rejected": {
    "fa": "رد شده",
    "ar": "مرفوض",
    "tr": "Reddedildi",
    "es": "Rechazado",
    "ku": "ڕەتکراو",
    "de": "Abgelehnt",
    "fr": "Refusé"
  },
  "replies": {
    "fa": "پاسخ‌ها",
    "ar": "الردود"
  },
  "reports": {
    "fa": "گزارش‌ها",
    "ar": "التقارير"
  },
  "request consultation": {
    "fa": "درخواست مشاوره",
    "ar": "طلب استشارة",
    "tr": "Danışmanlık Talebi",
    "es": "Solicitar consulta",
    "ku": "داوای ڕاوێژکردن",
    "de": "Beratung anfordern",
    "fr": "Demander une consultation"
  },
  "requested": {
    "fa": "requested",
    "ar": "مطلوب"
  },
  "required": {
    "fa": "الزامی",
    "ar": "مطلوب",
    "tr": "Required",
    "es": "Required",
    "ku": "Required",
    "de": "Required",
    "fr": "Required"
  },
  "requirements": {
    "fa": "الزامات",
    "ar": "المتطلبات",
    "tr": "Gereklilikler",
    "es": "Requisitos",
    "ku": "پێداویستییەکان",
    "de": "Anforderungen",
    "fr": "Exigences"
  },
  "resolved": {
    "fa": "حل‌شده",
    "ar": "تم الحل"
  },
  "resource": {
    "fa": "منبع",
    "ar": "المورد"
  },
  "resource id": {
    "fa": "شناسه منبع",
    "ar": "مورد ID"
  },
  "response": {
    "fa": "پاسخ‌گویی",
    "ar": "الاستجابة"
  },
  "result": {
    "fa": "نتیجه",
    "ar": "النتيجة"
  },
  "retry": {
    "fa": "تلاش مجدد",
    "ar": "إعادة المحاولة",
    "tr": "Yeniden Dene",
    "es": "Reintentar",
    "ku": "هەوڵدانەوە",
    "de": "Erneut versuchen",
    "fr": "Réessayer"
  },
  "review": {
    "fa": "بررسی",
    "ar": "مراجعة"
  },
  "review note": {
    "fa": "یادداشت بررسی",
    "ar": "ملاحظة المراجعة"
  },
  "reviews": {
    "fa": "نظرات",
    "ar": "المراجعات"
  },
  "revoke": {
    "fa": "لغو دسترسی",
    "ar": "إلغاء"
  },
  "role": {
    "fa": "نقش",
    "ar": "الدور"
  },
  "roles": {
    "fa": "نقش‌ها",
    "ar": "الأدوار"
  },
  "rules": {
    "fa": "قوانین",
    "ar": "القواعد",
    "tr": "Kurallar",
    "es": "Reglas",
    "ku": "یاساکان",
    "de": "Regeln",
    "fr": "Règles"
  },
  "sms": {
    "fa": "s MS",
    "ar": "SMS"
  },
  "swift": {
    "fa": "SWIFT",
    "ar": "SWIFT"
  },
  "save": {
    "fa": "ذخیره",
    "ar": "حفظ التغييرات",
    "tr": "Değişiklikleri Kaydet",
    "es": "Guardar cambios",
    "ku": "پاشەکەوتکردنی گۆڕانکارییەکان",
    "de": "Änderungen speichern",
    "fr": "Enregistrer les modifications"
  },
  "save preferences": {
    "fa": "ذخیره ترجیحات",
    "ar": "حفظ التفضيلات"
  },
  "save profile": {
    "fa": "Save profile",
    "ar": "حفظ الملف الشخصي"
  },
  "save service": {
    "fa": "ذخیره خدمت",
    "ar": "حفظ الخدمة"
  },
  "schedule": {
    "fa": "زمان‌بندی",
    "ar": "الجدولة"
  },
  "scheduled": {
    "fa": "Scheduled",
    "ar": "مجدول"
  },
  "scheduling": {
    "fa": "زمان‌بندی",
    "ar": "الجدولة"
  },
  "search...": {
    "fa": "جستجو...",
    "ar": "بحث...",
    "tr": "Ara...",
    "es": "Buscar...",
    "ku": "گەڕان...",
    "de": "Suchen...",
    "fr": "Rechercher..."
  },
  "section": {
    "fa": "بخش",
    "ar": "القسم"
  },
  "select city": {
    "fa": "انتخاب شهر",
    "ar": "اختر المدينة",
    "tr": "Bir şehir seçin",
    "es": "Selecciona una ciudad",
    "ku": "شارێك هەڵبژێرە",
    "de": "Stadt auswählen",
    "fr": "Sélectionner une ville"
  },
  "select country": {
    "fa": "انتخاب کشور",
    "ar": "اختر الدولة",
    "tr": "Bir ülke seçin",
    "es": "Selecciona un país",
    "ku": "وڵاتێك هەڵبژێرە",
    "de": "Land auswählen",
    "fr": "Sélectionner un pays"
  },
  "select currency": {
    "fa": "واحد پول را انتخاب کنید",
    "ar": "اختر العملة",
    "ku": "جۆری دراو هەڵبژێرە",
    "de": "Währung auswählen",
    "fr": "Sélectionner une devise"
  },
  "select provider": {
    "fa": "انتخاب ارائه‌دهنده",
    "ar": "اختر المزوّد"
  },
  "select service": {
    "fa": "انتخاب خدمت",
    "ar": "اختر الخدمة"
  },
  "send reply": {
    "fa": "ارسال پاسخ",
    "ar": "إرسال الرد"
  },
  "service": {
    "fa": "تعریف خدمت",
    "ar": "الخدمة",
    "tr": "Hizmet",
    "es": "Servicio",
    "ku": "خزمەت",
    "de": "Leistung",
    "fr": "Service"
  },
  "service description": {
    "fa": "توضیحات خدمت",
    "ar": "الخدمة الوصف",
    "tr": "Hizmet Açıklaması",
    "es": "Descripción del servicio",
    "ku": "پەسناسی خزمەت",
    "de": "Leistungsbeschreibung",
    "fr": "Description du service"
  },
  "services": {
    "fa": "خدمات",
    "ar": "الخدمات",
    "tr": "Hizmetler",
    "es": "Servicios",
    "ku": "خزمەتەکان",
    "de": "Leistungen",
    "fr": "Services"
  },
  "settings": {
    "fa": "تنظیمات",
    "ar": "الإعدادات",
    "tr": "Ayarlar",
    "es": "Configuración",
    "ku": "ڕێكخستنەکان",
    "de": "Einstellungen",
    "fr": "Paramètres"
  },
  "share": {
    "fa": "اشتراک‌گذاری",
    "ar": "مشاركة"
  },
  "share provider": {
    "fa": "اشتراک‌گذاری ارائه‌دهنده",
    "ar": "مشاركة مقدم الخدمة"
  },
  "slot interval": {
    "fa": "فاصله زمانی اسلات",
    "ar": "فترة interval"
  },
  "snapshot": {
    "fa": "نمای فوری",
    "ar": "لقطة"
  },
  "sort order": {
    "fa": "ترتیب نمایش",
    "ar": "ترتيب الفرز"
  },
  "source": {
    "fa": "منبع",
    "ar": "المصدر"
  },
  "specialties": {
    "fa": "تخصص‌ها",
    "ar": "التخصصات"
  },
  "specialty": {
    "fa": "تخصص",
    "ar": "التخصص"
  },
  "sponsored": {
    "fa": "اسپانسری",
    "ar": "مدعوم"
  },
  "staff": {
    "fa": "پرسنل",
    "ar": "الموظفون",
    "tr": "Personel",
    "es": "Personal",
    "ku": "کارمەندان",
    "de": "Mitarbeiter",
    "fr": "Personnel"
  },
  "staff profiles": {
    "fa": "پروفایل‌های کارکنان",
    "ar": "ملفات الموظفين"
  },
  "status": {
    "fa": "وضعیت",
    "ar": "الحالة",
    "tr": "Durum",
    "es": "Estado",
    "ku": "دۆخ",
    "de": "Status",
    "fr": "Statut"
  },
  "status:": {
    "fa": "وضعیت:",
    "ar": "الحالة:"
  },
  "step title": {
    "fa": "Step title",
    "ar": "خطوة العنوان"
  },
  "subject": {
    "fa": "موضوع",
    "ar": "الموضوع"
  },
  "submissions": {
    "fa": "ارسال‌ها",
    "ar": "الإرسالات"
  },
  "submit": {
    "fa": "ارسال",
    "ar": "إرسال",
    "tr": "Gönder",
    "es": "Enviar",
    "ku": "ناردن",
    "de": "Senden",
    "fr": "Envoyer"
  },
  "submit application": {
    "fa": "Submit application",
    "ar": "إرسال طلب"
  },
  "submit form": {
    "fa": "ارسال فرم",
    "ar": "إرسال النموذج"
  },
  "submitted": {
    "fa": "ارسال‌شده",
    "ar": "مُرسل"
  },
  "summary": {
    "fa": "خلاصه",
    "ar": "الملخص"
  },
  "support": {
    "fa": "پشتیبانی",
    "ar": "الدعم"
  },
  "support tickets": {
    "fa": "تیکت‌های پشتیبانی",
    "ar": "تذاكر الدعم"
  },
  "textarea": {
    "fa": "متن بلند",
    "ar": "منطقة نصية"
  },
  "target": {
    "fa": "Target",
    "ar": "الهدف"
  },
  "target country": {
    "fa": "target کشور",
    "ar": "الدولة المستهدفة"
  },
  "template key": {
    "fa": "قالب Key",
    "ar": "قالب المفتاح"
  },
  "templates": {
    "fa": "قالب‌ها",
    "ar": "القوالب"
  },
  "terms": {
    "fa": "شرایط",
    "ar": "الشروط"
  },
  "text": {
    "fa": "Text",
    "ar": "النص"
  },
  "this month": {
    "fa": "این ماه",
    "ar": "هذا الشهر"
  },
  "time": {
    "fa": "زمان",
    "ar": "الوقت"
  },
  "timeline": {
    "fa": "خط زمانی",
    "ar": "الخط الزمني"
  },
  "timezone": {
    "fa": "منطقه زمانی",
    "ar": "المنطقة الزمنية"
  },
  "title": {
    "fa": "عنوان",
    "ar": "العنوان",
    "tr": "Unvan",
    "es": "Cargo",
    "ku": "ناونیشان",
    "de": "Titel",
    "fr": "Titre"
  },
  "to": {
    "fa": "تا",
    "ar": "إلى"
  },
  "total": {
    "fa": "جمع کل",
    "ar": "الإجمالي"
  },
  "treatment": {
    "fa": "درمان",
    "ar": "العلاج"
  },
  "type": {
    "fa": "نوع",
    "ar": "النوع",
    "tr": "Tür",
    "es": "Tipo",
    "ku": "جۆر",
    "de": "Typ",
    "fr": "Type"
  },
  "unassigned": {
    "fa": "اختصاص‌نیافته",
    "ar": "غير مسند"
  },
  "unlimited": {
    "fa": "نامحدود",
    "ar": "غير محدود"
  },
  "update": {
    "fa": "به‌روزرسانی",
    "ar": "تحديث"
  },
  "update booking": {
    "fa": "به‌روزرسانی رزرو",
    "ar": "تحديث الحجز"
  },
  "update title": {
    "fa": "به‌روزرسانی عنوان",
    "ar": "عنوان التحديث"
  },
  "updated": {
    "fa": "updated",
    "ar": "تم التحديث"
  },
  "urgent": {
    "fa": "فوری",
    "ar": "عاجلة"
  },
  "usage": {
    "fa": "Usage",
    "ar": "الاستخدام"
  },
  "user": {
    "fa": "کاربر",
    "ar": "المستخدم"
  },
  "users": {
    "fa": "کاربران",
    "ar": "المستخدمون"
  },
  "value": {
    "fa": "مقدار",
    "ar": "القيمة",
    "tr": "Değer",
    "es": "Valor",
    "ku": "بەها",
    "de": "Wert",
    "fr": "Valeur"
  },
  "verified": {
    "fa": "Verified",
    "ar": "موثق"
  },
  "verified provider": {
    "fa": "ارائه‌دهنده تأییدشده",
    "ar": "موثق المزوّد"
  },
  "verify": {
    "fa": "تایید",
    "ar": "تحقق",
    "tr": "Doğrula",
    "es": "Verificar",
    "ku": "دڵنیاکردنەوە",
    "de": "Bestätigen",
    "fr": "Vérifier"
  },
  "video": {
    "fa": "Video",
    "ar": "فيديو"
  },
  "viewer": {
    "fa": "مشاهده‌گر",
    "ar": "مشاهد"
  },
  "visa": {
    "fa": "ویزا",
    "ar": "تأشيرة",
    "tr": "Vize",
    "es": "Visa",
    "ku": "ڤیزا",
    "de": "Visum",
    "fr": "Visa"
  },
  "website": {
    "fa": "وب‌سایت",
    "ar": "الموقع الإلكتروني",
    "tr": "Web Sitesi",
    "es": "Sitio web",
    "ku": "ماڵپەڕ",
    "de": "Webseite",
    "fr": "Site web"
  },
  "archived": {
    "fa": "آرشیو‌شده",
    "ar": "مؤرشف"
  },
  "blocked": {
    "fa": "Blocked",
    "ar": "محظور"
  },
  "documents": {
    "fa": "مدارک",
    "ar": "المستندات",
    "tr": "Belgeler",
    "es": "Documentos",
    "ku": "بەڵگەنامەکان",
    "de": "Dokumente",
    "fr": "Documents"
  },
  "escalated": {
    "fa": "ارجاع‌شده",
    "ar": "مصعّدة"
  },
  "failed": {
    "fa": "ناموفق",
    "ar": "فشل"
  },
  "hidden": {
    "fa": "مخفی",
    "ar": "مخفي"
  },
  "identity": {
    "fa": "Identity",
    "ar": "الهوية"
  },
  "language": {
    "fa": "زبان",
    "ar": "اللغة"
  },
  "loyalty": {
    "fa": "Loyalty",
    "ar": "الولاء"
  },
  "manual": {
    "fa": "دستی",
    "ar": "يدوي"
  },
  "medium": {
    "fa": "متوسط",
    "ar": "متوسط"
  },
  "membership": {
    "fa": "عضویت",
    "ar": "عضوية"
  },
  "new": {
    "fa": "جدید",
    "ar": "جديد"
  },
  "no contact": {
    "fa": "بدون اطلاعات تماس",
    "ar": "لا توجد معلومات اتصال"
  },
  "none": {
    "fa": "هیچ‌کدام",
    "ar": "لا شيء"
  },
  "parent": {
    "fa": "والد",
    "ar": "الأصل",
    "tr": "Üst",
    "es": "Principal",
    "ku": "باوان",
    "de": "Übergeordnet",
    "fr": "Parent"
  },
  "published": {
    "fa": "Published",
    "ar": "منشور"
  },
  "recovery": {
    "fa": "دوره نقاهت",
    "ar": "التعافي"
  },
  "recurring": {
    "fa": "تکراری",
    "ar": "متكرر",
    "tr": "Tekrarlı",
    "es": "Recurrente",
    "ku": "دووبارەبوو",
    "de": "Wiederkehrend",
    "fr": "Récurrent"
  },
  "refund": {
    "fa": "بازپرداخت",
    "ar": "استرداد"
  },
  "refunded": {
    "fa": "بازپرداخت‌شده",
    "ar": "تم ردّه"
  },
  "system": {
    "fa": "سیستم",
    "ar": "النظام"
  },
  "verification": {
    "fa": "تأیید",
    "ar": "التحقق"
  },
  "weekly": {
    "fa": "هفتگی",
    "ar": "أسبوعياً"
  },
  "· order": {
    "fa": "ترتیب",
    "ar": "الترتيب"
  }
};
