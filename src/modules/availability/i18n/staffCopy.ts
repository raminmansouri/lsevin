import { normalizePortalLocale, type PortalLocale } from "@core/i18n/config";

type StaffAvailabilityCopy = {
  pageTitle: string;
  pageDescription: string;
  providerManagedHint: string;
  personalRules: string;
  noRules: string;
  addRule: string;
  deleteConfirm: string;
  providerRequired: string;
  staffNotLinked: string;
};

const en: StaffAvailabilityCopy = {
  pageTitle: "My availability",
  pageDescription: "Manage only your own recurring and date-specific availability for bookings assigned to your approved staff profile.",
  providerManagedHint: "Your provider can also manage staff availability. Changes here use the same LSevin scheduling rules.",
  personalRules: "My availability rules",
  noRules: "No personal availability rules have been configured yet.",
  addRule: "Add personal availability",
  deleteConfirm: "Delete this personal availability rule? This action cannot be undone.",
  providerRequired: "Your approved staff ownership claim is not linked to a provider.",
  staffNotLinked: "Your staff profile is not active for this provider.",
};

const dictionaries: Record<PortalLocale, StaffAvailabilityCopy> = {
  en,
  fa: {
    pageTitle: "دسترسی من",
    pageDescription: "دسترسی تکرارشونده و تاریخ‌محور خودتان را برای رزروهای منتسب به پروفایل پرسنلی تأییدشده مدیریت کنید.",
    providerManagedHint: "ارائه‌دهنده نیز می‌تواند دسترسی پرسنل را مدیریت کند. تغییرات این صفحه از همان قواعد زمان‌بندی السوین استفاده می‌کند.",
    personalRules: "قواعد دسترسی من",
    noRules: "هنوز قاعده دسترسی شخصی ثبت نشده است.",
    addRule: "افزودن دسترسی شخصی",
    deleteConfirm: "این قاعده دسترسی شخصی حذف شود؟ این عملیات قابل بازگشت نیست.",
    providerRequired: "مالکیت تأییدشده پروفایل پرسنلی شما به ارائه‌دهنده‌ای متصل نیست.",
    staffNotLinked: "پروفایل پرسنلی شما برای این ارائه‌دهنده فعال نیست.",
  },
  ar: {
    pageTitle: "توفري",
    pageDescription: "أدر توفرك المتكرر أو المرتبط بتاريخ محدد للحجوزات المسندة إلى ملف الموظف المعتمد الخاص بك.",
    providerManagedHint: "يمكن لمقدم الخدمة أيضاً إدارة توفر الموظفين. تستخدم التغييرات هنا قواعد الجدولة نفسها في LSevin.",
    personalRules: "قواعد توفري",
    noRules: "لا توجد قواعد توفر شخصية حتى الآن.",
    addRule: "إضافة توفر شخصي",
    deleteConfirm: "حذف قاعدة التوفر الشخصية هذه؟ لا يمكن التراجع عن الإجراء.",
    providerRequired: "مطالبة ملكية ملف الموظف المعتمدة غير مرتبطة بمقدم خدمة.",
    staffNotLinked: "ملف الموظف الخاص بك غير نشط لدى مقدم الخدمة هذا.",
  },
  tr: {
    pageTitle: "Uygunluğum",
    pageDescription: "Onaylı personel profilinize atanmış rezervasyonlar için kendi yinelenen ve tarih bazlı uygunluğunuzu yönetin.",
    providerManagedHint: "Sağlayıcınız personel uygunluğunu da yönetebilir. Buradaki değişiklikler aynı LSevin zamanlama kurallarını kullanır.",
    personalRules: "Uygunluk kurallarım",
    noRules: "Henüz kişisel uygunluk kuralı tanımlanmadı.",
    addRule: "Kişisel uygunluk ekle",
    deleteConfirm: "Bu kişisel uygunluk kuralı silinsin mi? İşlem geri alınamaz.",
    providerRequired: "Onaylı personel profil sahipliğiniz bir sağlayıcıya bağlı değil.",
    staffNotLinked: "Personel profiliniz bu sağlayıcı için aktif değil.",
  },
  es: {
    pageTitle: "Mi disponibilidad",
    pageDescription: "Gestiona únicamente tu disponibilidad recurrente y por fecha para las reservas asignadas a tu perfil de personal aprobado.",
    providerManagedHint: "Tu proveedor también puede gestionar la disponibilidad del personal. Los cambios usan las mismas reglas de programación de LSevin.",
    personalRules: "Mis reglas de disponibilidad",
    noRules: "Aún no hay reglas de disponibilidad personal.",
    addRule: "Añadir disponibilidad personal",
    deleteConfirm: "¿Eliminar esta regla de disponibilidad personal? No se puede deshacer.",
    providerRequired: "La titularidad aprobada de tu perfil de personal no está vinculada a un proveedor.",
    staffNotLinked: "Tu perfil de personal no está activo para este proveedor.",
  },
  ku: {
    pageTitle: "بەردەستبوونی من",
    pageDescription: "بەردەستبوونی دووبارەبوو و بەرواری تایبەتی خۆت بۆ رزێرڤە دیاریکراوەکانی پرۆفایلی ستافی پەسەندکراوت بەڕێوەببە.",
    providerManagedHint: "پێشکەشکارەکەت دەتوانێت بەردەستبوونی ستافیش بەڕێوەببات. گۆڕانکارییەکان هەمان یاساکانی خشتەی LSevin بەکاردەهێنن.",
    personalRules: "یاساکانی بەردەستبوونی من",
    noRules: "هێشتا یاسای بەردەستبوونی کەسی دانەنراوە.",
    addRule: "زیادکردنی بەردەستبوونی کەسی",
    deleteConfirm: "ئەم یاسای بەردەستبوونە بسڕدرێتەوە؟ گەڕاندنەوەی نییە.",
    providerRequired: "داواکاری خاوەندارێتی پرۆفایلی ستافی پەسەندکراوت بە پێشکەشکارێکەوە نەبەستراوە.",
    staffNotLinked: "پرۆفایلی ستافەکەت بۆ ئەم پێشکەشکارە چالاک نییە.",
  },
  de: {
    pageTitle: "Meine Verfügbarkeit",
    pageDescription: "Verwalten Sie ausschließlich Ihre eigene wiederkehrende und datumsbezogene Verfügbarkeit für Buchungen Ihres bestätigten Mitarbeiterprofils.",
    providerManagedHint: "Ihr Anbieter kann die Mitarbeiterverfügbarkeit ebenfalls verwalten. Änderungen verwenden dieselben LSevin-Planungsregeln.",
    personalRules: "Meine Verfügbarkeitsregeln",
    noRules: "Noch keine persönlichen Verfügbarkeitsregeln eingerichtet.",
    addRule: "Persönliche Verfügbarkeit hinzufügen",
    deleteConfirm: "Diese persönliche Verfügbarkeitsregel löschen? Der Vorgang kann nicht rückgängig gemacht werden.",
    providerRequired: "Ihre bestätigte Mitarbeiterprofil-Inhaberschaft ist keinem Anbieter zugeordnet.",
    staffNotLinked: "Ihr Mitarbeiterprofil ist für diesen Anbieter nicht aktiv.",
  },
  fr: {
    pageTitle: "Mes disponibilités",
    pageDescription: "Gérez uniquement vos propres disponibilités récurrentes et datées pour les réservations affectées à votre profil de membre du personnel approuvé.",
    providerManagedHint: "Votre prestataire peut aussi gérer la disponibilité du personnel. Les changements utilisent les mêmes règles de planification LSevin.",
    personalRules: "Mes règles de disponibilité",
    noRules: "Aucune règle de disponibilité personnelle n’est encore configurée.",
    addRule: "Ajouter une disponibilité personnelle",
    deleteConfirm: "Supprimer cette règle de disponibilité personnelle ? Cette action est irréversible.",
    providerRequired: "La propriété approuvée de votre profil de personnel n’est liée à aucun prestataire.",
    staffNotLinked: "Votre profil de personnel n’est pas actif pour ce prestataire.",
  },
};

export function staffAvailabilityCopy(locale?: string | null) {
  return dictionaries[normalizePortalLocale(locale).locale] ?? en;
}
