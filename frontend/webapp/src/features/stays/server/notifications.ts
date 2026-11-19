import { formatIsoDate, type CalendarId } from "@/features/tours/domain/calendar";
import { isolate } from "@/features/tours/domain/text";

/**
 * Transactional stay messages in the guest's booking language and calendar.
 * Every language carries the same facts (property, dates, voucher); unknown
 * languages fall back to English, never to a raw key.
 */
export type StayNoticeKind = "created" | "requested" | "accepted" | "declined" | "confirmed" | "cancelled" | "request_expired" | "expired";

const T: Record<string, Record<StayNoticeKind, [string, string]>> = {
  en: {
    created: ["Booking received", "{stay}, {dates}. Complete payment to confirm. Ref {ref}."],
    requested: ["Booking request sent", "{stay}, {dates}. The host will reply soon; nothing is charged until they accept. Ref {ref}."],
    accepted: ["Request accepted", "{stay}, {dates} was accepted. Complete payment to confirm. Ref {ref}."],
    declined: ["Request declined", "The host could not accept {stay}, {dates}. Nothing was charged. Ref {ref}."],
    confirmed: ["Stay confirmed", "{stay}, {dates} is confirmed. Your voucher: {ref}."],
    cancelled: ["Booking cancelled", "{stay}, {dates} was cancelled. Ref {ref}."],
    request_expired: ["Request expired", "No reply was received for {stay}, {dates}. Nothing was charged. Ref {ref}."],
    expired: ["Booking expired", "Payment for {stay}, {dates} was not completed in time. Ref {ref}."],
  },
  fa: {
    created: ["رزرو ثبت شد", "{stay}، {dates}. برای قطعی شدن، پرداخت را تکمیل کنید. کد {ref}."],
    requested: ["درخواست رزرو ارسال شد", "{stay}، {dates}. میزبان به‌زودی پاسخ می‌دهد؛ تا پذیرش، مبلغی کسر نمی‌شود. کد {ref}."],
    accepted: ["درخواست پذیرفته شد", "{stay}، {dates} پذیرفته شد. برای قطعی شدن پرداخت کنید. کد {ref}."],
    declined: ["درخواست رد شد", "میزبان امکان پذیرش {stay}، {dates} را نداشت. مبلغی کسر نشده است. کد {ref}."],
    confirmed: ["اقامت قطعی شد", "{stay}، {dates} قطعی شد. کد واچر: {ref}."],
    cancelled: ["رزرو لغو شد", "{stay}، {dates} لغو شد. کد {ref}."],
    request_expired: ["مهلت درخواست تمام شد", "پاسخی برای {stay}، {dates} دریافت نشد. مبلغی کسر نشده است. کد {ref}."],
    expired: ["مهلت پرداخت تمام شد", "پرداخت {stay}، {dates} به‌موقع انجام نشد. کد {ref}."],
  },
  ar: {
    created: ["تم استلام الحجز", "{stay}، {dates}. أكمل الدفع للتأكيد. المرجع {ref}."],
    requested: ["تم إرسال طلب الحجز", "{stay}، {dates}. سيرد المضيف قريباً، ولن يُخصم أي مبلغ قبل القبول. المرجع {ref}."],
    accepted: ["تم قبول الطلب", "تم قبول {stay}، {dates}. أكمل الدفع للتأكيد. المرجع {ref}."],
    declined: ["تم رفض الطلب", "تعذر على المضيف قبول {stay}، {dates}. لم يُخصم أي مبلغ. المرجع {ref}."],
    confirmed: ["تم تأكيد الإقامة", "تم تأكيد {stay}، {dates}. القسيمة: {ref}."],
    cancelled: ["تم إلغاء الحجز", "تم إلغاء {stay}، {dates}. المرجع {ref}."],
    request_expired: ["انتهت مهلة الطلب", "لم يصل رد بخصوص {stay}، {dates}. لم يُخصم أي مبلغ. المرجع {ref}."],
    expired: ["انتهت مهلة الدفع", "لم يكتمل دفع {stay}، {dates} في الوقت المحدد. المرجع {ref}."],
  },
  tr: {
    created: ["Rezervasyon alındı", "{stay}, {dates}. Onaylamak için ödemeyi tamamlayın. Ref. {ref}."],
    requested: ["Rezervasyon talebi gönderildi", "{stay}, {dates}. Tesis yakında yanıt verecek; kabul edilene kadar ücret alınmaz. Ref. {ref}."],
    accepted: ["Talebiniz kabul edildi", "{stay}, {dates} kabul edildi. Onaylamak için ödemeyi tamamlayın. Ref. {ref}."],
    declined: ["Talep reddedildi", "Tesis {stay}, {dates} talebini kabul edemedi. Ücret alınmadı. Ref. {ref}."],
    confirmed: ["Konaklamanız onaylandı", "{stay}, {dates} onaylandı. Voucher: {ref}."],
    cancelled: ["Rezervasyon iptal edildi", "{stay}, {dates} iptal edildi. Ref. {ref}."],
    request_expired: ["Talebin süresi doldu", "{stay}, {dates} için yanıt gelmedi. Ücret alınmadı. Ref. {ref}."],
    expired: ["Ödeme süresi doldu", "{stay}, {dates} için ödeme zamanında tamamlanmadı. Ref. {ref}."],
  },
  es: {
    created: ["Reserva recibida", "{stay}, {dates}. Complete el pago para confirmarla. Ref. {ref}."],
    requested: ["Solicitud de reserva enviada", "{stay}, {dates}. El alojamiento responderá pronto; no se cobra nada hasta que acepte. Ref. {ref}."],
    accepted: ["Solicitud aceptada", "{stay}, {dates} fue aceptada. Complete el pago para confirmarla. Ref. {ref}."],
    declined: ["Solicitud rechazada", "El alojamiento no pudo aceptar {stay}, {dates}. No se ha cobrado nada. Ref. {ref}."],
    confirmed: ["Estancia confirmada", "{stay}, {dates} está confirmada. Su bono: {ref}."],
    cancelled: ["Reserva cancelada", "{stay}, {dates} fue cancelada. Ref. {ref}."],
    request_expired: ["Solicitud vencida", "No hubo respuesta para {stay}, {dates}. No se ha cobrado nada. Ref. {ref}."],
    expired: ["Plazo de pago vencido", "El pago de {stay}, {dates} no se completó a tiempo. Ref. {ref}."],
  },
  ku: {
    created: ["حجزەکە وەرگیرا", "{stay}، {dates}. بۆ پشتڕاستکردنەوە پارەدان تەواو بکە. کۆد {ref}."],
    requested: ["داواکاریی حجز نێردرا", "{stay}، {dates}. خانەخوێ بەم زووانە وەڵام دەداتەوە؛ تا وەرگرتن هیچ پارەیەک ناگیرێت. کۆد {ref}."],
    accepted: ["داواکارییەکەت وەرگیرا", "{stay}، {dates} وەرگیرا. بۆ پشتڕاستکردنەوە پارە بدە. کۆد {ref}."],
    declined: ["داواکارییەکە ڕەتکرایەوە", "خانەخوێ نەیتوانی {stay}، {dates} وەربگرێت. هیچ پارەیەک نەگیراوە. کۆد {ref}."],
    confirmed: ["مانەوەکەت پشتڕاستکرایەوە", "{stay}، {dates} پشتڕاستکرایەوە. پسوولە: {ref}."],
    cancelled: ["حجزەکە هەڵوەشێنرایەوە", "{stay}، {dates} هەڵوەشێنرایەوە. کۆد {ref}."],
    request_expired: ["ماوەی داواکاری تەواو بوو", "هیچ وەڵامێک بۆ {stay}، {dates} نەهات. هیچ پارەیەک نەگیراوە. کۆد {ref}."],
    expired: ["ماوەی پارەدان تەواو بوو", "پارەدانی {stay}، {dates} لە کاتی خۆیدا تەواو نەبوو. کۆد {ref}."],
  },
  de: {
    created: ["Buchung eingegangen", "{stay}, {dates}. Schließen Sie die Zahlung ab, um zu bestätigen. Ref. {ref}."],
    requested: ["Buchungsanfrage gesendet", "{stay}, {dates}. Die Unterkunft antwortet bald; bis zur Annahme wird nichts berechnet. Ref. {ref}."],
    accepted: ["Anfrage angenommen", "{stay}, {dates} wurde angenommen. Bitte zahlen Sie, um zu bestätigen. Ref. {ref}."],
    declined: ["Anfrage abgelehnt", "Die Unterkunft konnte {stay}, {dates} nicht annehmen. Es wurde nichts berechnet. Ref. {ref}."],
    confirmed: ["Aufenthalt bestätigt", "{stay}, {dates} ist bestätigt. Ihr Voucher: {ref}."],
    cancelled: ["Buchung storniert", "{stay}, {dates} wurde storniert. Ref. {ref}."],
    request_expired: ["Anfrage abgelaufen", "Für {stay}, {dates} kam keine Antwort. Es wurde nichts berechnet. Ref. {ref}."],
    expired: ["Zahlungsfrist abgelaufen", "Die Zahlung für {stay}, {dates} wurde nicht rechtzeitig abgeschlossen. Ref. {ref}."],
  },
  fr: {
    created: ["Réservation reçue", "{stay}, {dates}. Finalisez le paiement pour confirmer. Réf. {ref}."],
    requested: ["Demande de réservation envoyée", "{stay}, {dates}. L’établissement répondra bientôt ; rien n’est débité avant son accord. Réf. {ref}."],
    accepted: ["Demande acceptée", "{stay}, {dates} a été acceptée. Payez pour confirmer. Réf. {ref}."],
    declined: ["Demande refusée", "L’établissement n’a pas pu accepter {stay}, {dates}. Rien n’a été débité. Réf. {ref}."],
    confirmed: ["Séjour confirmé", "{stay}, {dates} est confirmé. Votre bon : {ref}."],
    cancelled: ["Réservation annulée", "{stay}, {dates} a été annulée. Réf. {ref}."],
    request_expired: ["Demande expirée", "Aucune réponse pour {stay}, {dates}. Rien n’a été débité. Réf. {ref}."],
    expired: ["Délai de paiement expiré", "Le paiement de {stay}, {dates} n’a pas été finalisé à temps. Réf. {ref}."],
  },
  ru: {
    created: ["Бронирование получено", "{stay}, {dates}. Завершите оплату, чтобы подтвердить. Номер {ref}."],
    requested: ["Запрос на бронирование отправлен", "{stay}, {dates}. Объект скоро ответит; до подтверждения деньги не списываются. Номер {ref}."],
    accepted: ["Запрос принят", "{stay}, {dates}: запрос принят. Оплатите, чтобы подтвердить. Номер {ref}."],
    declined: ["Запрос отклонён", "Объект не смог принять {stay}, {dates}. Деньги не списаны. Номер {ref}."],
    confirmed: ["Проживание подтверждено", "{stay}, {dates}: проживание подтверждено. Ваучер: {ref}."],
    cancelled: ["Бронирование отменено", "{stay}, {dates}: бронирование отменено. Номер {ref}."],
    request_expired: ["Срок запроса истёк", "Ответа по {stay}, {dates} не поступило. Деньги не списаны. Номер {ref}."],
    expired: ["Срок оплаты истёк", "Оплата {stay}, {dates} не была завершена вовремя. Номер {ref}."],
  },
  tg: {
    created: ["Брон қабул шуд", "{stay}, {dates}. Барои тасдиқ пардохтро анҷом диҳед. Рамз {ref}."],
    requested: ["Дархости брон фиристода шуд", "{stay}, {dates}. Мизбон ба наздикӣ ҷавоб медиҳад; то қабул ҳеҷ маблағ гирифта намешавад. Рамз {ref}."],
    accepted: ["Дархост қабул шуд", "{stay}, {dates} қабул шуд. Барои тасдиқ пардохт кунед. Рамз {ref}."],
    declined: ["Дархост рад шуд", "Мизбон дархости {stay}, {dates}-ро қабул карда натавонист. Ҳеҷ маблағ гирифта нашуд. Рамз {ref}."],
    confirmed: ["Иқомат тасдиқ шуд", "{stay}, {dates} тасдиқ шуд. Ваучер: {ref}."],
    cancelled: ["Брон бекор шуд", "{stay}, {dates} бекор шуд. Рамз {ref}."],
    request_expired: ["Мӯҳлати дархост гузашт", "Барои {stay}, {dates} ҷавоб нарасид. Ҳеҷ маблағ гирифта нашуд. Рамз {ref}."],
    expired: ["Мӯҳлати пардохт гузашт", "Пардохти {stay}, {dates} сари вақт анҷом наёфт. Рамз {ref}."],
  },
  zh: {
    created: ["已收到预订", "{stay}，{dates}。请完成付款以确认。编号 {ref}。"],
    requested: ["预订申请已发送", "{stay}，{dates}。商家将尽快回复；接受前不会扣款。编号 {ref}。"],
    accepted: ["申请已接受", "{stay}，{dates} 已被接受。请付款以确认。编号 {ref}。"],
    declined: ["申请被拒绝", "商家无法接受 {stay}，{dates}。未扣任何费用。编号 {ref}。"],
    confirmed: ["住宿已确认", "{stay}，{dates} 已确认。凭证：{ref}。"],
    cancelled: ["预订已取消", "{stay}，{dates} 已取消。编号 {ref}。"],
    request_expired: ["申请已过期", "{stay}，{dates} 未收到回复。未扣任何费用。编号 {ref}。"],
    expired: ["付款期限已过", "{stay}，{dates} 未按时完成付款。编号 {ref}。"],
  },
};

export function renderStayNotice(
  kind: StayNoticeKind,
  ctx: { locale: string; calendar: CalendarId; checkIn: string; checkOut: string; voucher: string; propertyName: string },
): { title: string; body: string } {
  const base = ctx.locale.toLowerCase().split("-")[0];
  const dict = T[base] ?? T.en;
  const lang = T[base] ? base : "en";
  const [title, body] = dict[kind];
  const fmt = (iso: string) => formatIsoDate(iso, { locale: lang, calendar: ctx.calendar, style: "medium" });
  const dates = `${fmt(ctx.checkIn)} – ${fmt(ctx.checkOut)}`;
  const fill = (s: string) => s.replace("{stay}", isolate(ctx.propertyName || "—")).replace("{dates}", isolate(dates)).replace("{ref}", isolate(ctx.voucher));
  return { title: fill(title), body: fill(body) };
}
