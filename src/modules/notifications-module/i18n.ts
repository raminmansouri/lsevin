import type { PortalLocaleHeader } from "@core/i18n/config";

const COPY = {
  "fa-IR": { title:"اعلان‌های من", description:"اعلان‌های عملیاتی مرتبط با رزروها و فعالیت‌های حساب شما.", inbox:"صندوق اعلان‌ها", unread:"خوانده‌نشده", read:"خوانده‌شده", markRead:"علامت‌گذاری به‌عنوان خوانده‌شده", empty:"اعلانی برای شما وجود ندارد." },
  "en-US": { title:"My notifications", description:"Operational notifications for your bookings and account activity.", inbox:"Notification inbox", unread:"Unread", read:"Read", markRead:"Mark as read", empty:"You have no notifications." },
  "ar-SA": { title:"إشعاراتي", description:"إشعارات تشغيلية مرتبطة بحجوزاتك ونشاط حسابك.", inbox:"صندوق الإشعارات", unread:"غير مقروء", read:"مقروء", markRead:"تحديد كمقروء", empty:"لا توجد إشعارات لك." },
  "tr-TR": { title:"Bildirimlerim", description:"Rezervasyonlarınız ve hesap etkinliğinizle ilgili operasyonel bildirimler.", inbox:"Bildirim kutusu", unread:"Okunmadı", read:"Okundu", markRead:"Okundu olarak işaretle", empty:"Bildiriminiz yok." },
  "es-ES": { title:"Mis notificaciones", description:"Notificaciones operativas sobre tus reservas y actividad de cuenta.", inbox:"Bandeja de notificaciones", unread:"No leída", read:"Leída", markRead:"Marcar como leída", empty:"No tienes notificaciones." },
  "ku-KU": { title:"ئاگادارکردنەوەکانم", description:"ئاگادارکردنەوەکانی کارگێڕی بۆ حجز و چالاکی هەژمارەکەت.", inbox:"سندووقی ئاگادارکردنەوە", unread:"نەخوێندراوە", read:"خوێندراوە", markRead:"وەک خوێندراوە نیشان بدە", empty:"هیچ ئاگادارکردنەوەیەکت نییە." },
  "de-DE": { title:"Meine Benachrichtigungen", description:"Betriebliche Benachrichtigungen zu Buchungen und Kontoaktivitäten.", inbox:"Benachrichtigungseingang", unread:"Ungelesen", read:"Gelesen", markRead:"Als gelesen markieren", empty:"Sie haben keine Benachrichtigungen." },
  "fr-FR": { title:"Mes notifications", description:"Notifications opérationnelles liées à vos réservations et à votre compte.", inbox:"Boîte de notifications", unread:"Non lue", read:"Lue", markRead:"Marquer comme lue", empty:"Vous n’avez aucune notification." },
} as const;

export function notificationsCopy(locale: PortalLocaleHeader) {
  return COPY[locale] ?? COPY["en-US"];
}
