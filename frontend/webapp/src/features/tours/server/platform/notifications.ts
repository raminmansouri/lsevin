import { formatInstant, type CalendarId } from "../../domain/calendar";
import { contentLocaleFor } from "../../domain/content";
import { isolate } from "../../domain/text";

/**
 * Transactional tour messages rendered in the traveler's saved language and
 * calendar (C-105, S-058, AT-46). Every rendering of the same event carries the
 * same instant, voucher and facts; only wording and date presentation differ.
 * Unknown languages fall back to English, never to a raw key.
 */
type Ctx = { locale: string; calendar: CalendarId; timeZone: string; startsAt: Date; voucher: string; tourTitle: string };

const T: Record<string, Record<string, [string, string]>> = {
  en: {
    created: ["Booking received", "{tour} on {when}. Complete payment to confirm. Ref {ref}."],
    requested: ["Booking request sent", "{tour} on {when}. The operator will reply soon. Ref {ref}."],
    accepted: ["Request accepted", "{tour} on {when} was accepted. Complete payment to confirm. Ref {ref}."],
    declined: ["Request declined", "The operator could not accept {tour} on {when}. Ref {ref}."],
    confirmed: ["Booking confirmed", "{tour} on {when} is confirmed. Your voucher: {ref}."],
    cancelled: ["Booking cancelled", "{tour} on {when} was cancelled. Ref {ref}."],
    request_expired: ["Request expired", "No reply was received for {tour} on {when}. Nothing was charged. Ref {ref}."],
    reminder: ["Upcoming tour", "{tour} starts {when}. Ref {ref}."],
  },
  fa: {
    created: ["رزرو ثبت شد", "{tour} — {when}. برای قطعی شدن، پرداخت را تکمیل کنید. کد {ref}."],
    requested: ["درخواست رزرو ارسال شد", "{tour} — {when}. برگزارکننده به‌زودی پاسخ می‌دهد. کد {ref}."],
    accepted: ["درخواست پذیرفته شد", "{tour} — {when} پذیرفته شد. برای قطعی شدن پرداخت کنید. کد {ref}."],
    declined: ["درخواست رد شد", "برگزارکننده امکان پذیرش {tour} — {when} را نداشت. کد {ref}."],
    confirmed: ["رزرو قطعی شد", "{tour} — {when} قطعی شد. کد واچر: {ref}."],
    cancelled: ["رزرو لغو شد", "{tour} — {when} لغو شد. کد {ref}."],
    request_expired: ["مهلت درخواست تمام شد", "پاسخی برای {tour} — {when} دریافت نشد. مبلغی کسر نشده است. کد {ref}."],
    reminder: ["یادآوری تور", "{tour} در {when} آغاز می‌شود. کد {ref}."],
  },
  ar: {
    created: ["تم استلام الحجز", "{tour} في {when}. أكمل الدفع للتأكيد. المرجع {ref}."],
    requested: ["تم إرسال طلب الحجز", "{tour} في {when}. سيرد المنظم قريباً. المرجع {ref}."],
    accepted: ["تم قبول الطلب", "تم قبول {tour} في {when}. أكمل الدفع للتأكيد. المرجع {ref}."],
    declined: ["تم رفض الطلب", "تعذر على المنظم قبول {tour} في {when}. المرجع {ref}."],
    confirmed: ["تم تأكيد الحجز", "تم تأكيد {tour} في {when}. القسيمة: {ref}."],
    cancelled: ["تم إلغاء الحجز", "تم إلغاء {tour} في {when}. المرجع {ref}."],
    request_expired: ["انتهت مهلة الطلب", "لم يصل رد بخصوص {tour} في {when}. لم يتم خصم أي مبلغ. المرجع {ref}."],
    reminder: ["تذكير بالجولة", "تبدأ {tour} في {when}. المرجع {ref}."],
  },
  tr: {
    created: ["Rezervasyon alındı", "{tour}, {when}. Onay için ödemeyi tamamlayın. Ref {ref}."],
    requested: ["Rezervasyon talebi gönderildi", "{tour}, {when}. Operatör yakında yanıt verecek. Ref {ref}."],
    accepted: ["Talep kabul edildi", "{tour}, {when} kabul edildi. Onay için ödeme yapın. Ref {ref}."],
    declined: ["Talep reddedildi", "Operatör {tour}, {when} talebini kabul edemedi. Ref {ref}."],
    confirmed: ["Rezervasyon onaylandı", "{tour}, {when} onaylandı. Kupon: {ref}."],
    cancelled: ["Rezervasyon iptal edildi", "{tour}, {when} iptal edildi. Ref {ref}."],
    request_expired: ["Talep süresi doldu", "{tour}, {when} için yanıt gelmedi. Ücret alınmadı. Ref {ref}."],
    reminder: ["Yaklaşan tur", "{tour} {when} başlıyor. Ref {ref}."],
  },
};

export function renderBookingNotice(kind: string, ctx: Ctx): { title: string; body: string; localeUsed: string; fellBack: boolean } {
  const base = ctx.locale.toLowerCase().split("-")[0];
  const dict = T[base] ?? T.en;
  const fellBack = !T[base];
  const [title, body] = dict[kind] ?? T.en[kind] ?? [kind, ""];
  const when = formatInstant(ctx.startsAt, { locale: fellBack ? "en" : base, calendar: ctx.calendar, timeZone: ctx.timeZone, withZone: true });
  const fill = (s: string) => s.replace("{tour}", isolate(ctx.tourTitle || "—")).replace("{when}", isolate(when)).replace("{ref}", isolate(ctx.voucher));
  return { title: fill(title), body: fill(body), localeUsed: fellBack ? "en-US" : contentLocaleFor(base), fellBack };
}
