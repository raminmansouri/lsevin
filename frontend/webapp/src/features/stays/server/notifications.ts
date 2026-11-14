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
