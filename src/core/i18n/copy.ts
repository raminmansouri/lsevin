import type { PortalLocale } from "./config";

type CoreCopyKey =
  | "portalName" | "portalSubtitle" | "providerTools" | "adminTools" | "quickSwitch"
  | "workspace" | "admin" | "support" | "noUser" | "configureAuth" | "language"
  | "providerPath" | "staffPath" | "continueWithLsevin";

const en: Record<CoreCopyKey, string> = {
  portalName: "Providers Portal",
  portalSubtitle: "Core-hosted modular CRM. Extended modules stay in one folder.",
  providerTools: "Provider tools",
  adminTools: "Admin tools",
  quickSwitch: "Quick switch",
  workspace: "Workspace",
  admin: "Admin",
  support: "Support",
  noUser: "No user",
  configureAuth: "Configure authentication",
  language: "Language",
  providerPath: "Provider path",
  staffPath: "Staff path",
  continueWithLsevin: "Continue with LSevin",
};

const dictionary: Partial<Record<PortalLocale, Partial<Record<CoreCopyKey, string>>>> = {
  fa: {
    portalName: "پرتال ارائه‌دهندگان",
    portalSubtitle: "سامانه ماژولار مدیریت ارائه‌دهندگان و کارکنان السوین",
    providerTools: "ابزارهای ارائه‌دهنده",
    adminTools: "ابزارهای مدیریت",
    quickSwitch: "دسترسی سریع",
    workspace: "محیط کار",
    admin: "مدیریت",
    support: "پشتیبانی",
    noUser: "کاربر شناسایی نشده",
    configureAuth: "احراز هویت را پیکربندی کنید",
    language: "زبان", providerPath: "مسیر ارائه‌دهنده", staffPath: "مسیر کارکنان", continueWithLsevin: "ادامه با السوین",
  },
  ar: { portalName: "بوابة مزوّدي الخدمة", portalSubtitle: "إدارة وحدات مزوّدي LSevin والموظفين", providerTools: "أدوات المزوّد", adminTools: "أدوات الإدارة", quickSwitch: "تبديل سريع", workspace: "مساحة العمل", admin: "الإدارة", support: "الدعم", noUser: "لم يتم التعرف على المستخدم", configureAuth: "إعداد المصادقة", language: "اللغة", providerPath: "مسار المزوّد", staffPath: "مسار الموظف", continueWithLsevin: "المتابعة مع LSevin" },
  tr: { portalName: "Sağlayıcı Portalı", portalSubtitle: "LSevin sağlayıcı ve personel modül yönetimi", providerTools: "Sağlayıcı araçları", adminTools: "Yönetim araçları", quickSwitch: "Hızlı geçiş", workspace: "Çalışma alanı", admin: "Yönetim", support: "Destek", noUser: "Kullanıcı tanımlanmadı", configureAuth: "Kimlik doğrulamayı yapılandır", language: "Dil", providerPath: "Sağlayıcı yolu", staffPath: "Personel yolu", continueWithLsevin: "LSevin ile devam et" },
  es: { portalName: "Portal de proveedores", portalSubtitle: "Gestión modular de proveedores y personal de LSevin", providerTools: "Herramientas del proveedor", adminTools: "Administración", quickSwitch: "Cambio rápido", workspace: "Espacio de trabajo", admin: "Administración", support: "Soporte", noUser: "Usuario no identificado", configureAuth: "Configurar autenticación", language: "Idioma", providerPath: "Ruta del proveedor", staffPath: "Ruta del personal", continueWithLsevin: "Continuar con LSevin" },
  ku: { portalName: "پۆرتاڵی پێشکەشکاران", portalSubtitle: "سیستەمی بەڕێوەبردنی پێشکەشکار و ستافی LSevin", providerTools: "ئامرازەکانی پێشکەشکار", adminTools: "ئامرازەکانی بەڕێوەبەر", quickSwitch: "گۆڕینی خێرا", workspace: "شوێنی کار", admin: "بەڕێوەبەرایەتی", support: "پشتیوانی", noUser: "بەکارهێنەر نەناسراوە", configureAuth: "ڕێکخستنی ناسنامە", language: "زمان", providerPath: "ڕێگای پێشکەشکار", staffPath: "ڕێگای ستاف", continueWithLsevin: "بە LSevin بەردەوام بە" },
  de: { portalName: "Anbieterportal", portalSubtitle: "Modulare Verwaltung für LSevin-Anbieter und Mitarbeiter", providerTools: "Anbieterfunktionen", adminTools: "Administration", quickSwitch: "Schnellwechsel", workspace: "Arbeitsbereich", admin: "Administration", support: "Support", noUser: "Benutzer nicht erkannt", configureAuth: "Authentifizierung konfigurieren", language: "Sprache", providerPath: "Anbieterpfad", staffPath: "Mitarbeiterpfad", continueWithLsevin: "Mit LSevin fortfahren" },
  fr: { portalName: "Portail des prestataires", portalSubtitle: "Gestion modulaire des prestataires et du personnel LSevin", providerTools: "Outils du prestataire", adminTools: "Administration", quickSwitch: "Accès rapide", workspace: "Espace de travail", admin: "Administration", support: "Assistance", noUser: "Utilisateur non identifié", configureAuth: "Configurer l’authentification", language: "Langue", providerPath: "Parcours prestataire", staffPath: "Parcours personnel", continueWithLsevin: "Continuer avec LSevin" },
};

export function coreCopy(locale: PortalLocale, key: CoreCopyKey) {
  return dictionary[locale]?.[key] ?? en[key];
}
