import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card } from "@core/ui/Card";
import { Input, Select, Textarea } from "@core/ui/Field";
import { CurrencySelect } from "@core/ui/CurrencySelect";
import { formatDateTime, formatMoney } from "@core/lib/format";
import { normalizePortalLocale } from "@core/i18n/config";
import { issueBookingPaymentInvoiceAction, updateBookingByProviderAction } from "../actions";
import type { ProviderBooking } from "../types";

function paymentVariant(paymentStatus: string | null) {
  return ["Paid", "paid", "captured", "succeeded", "authorized"].includes(paymentStatus ?? "") ? "success" as const : "warning" as const;
}

export function BookingsTable({ providerId, bookings, locale = "fa-IR" }: { providerId: string; bookings: ProviderBooking[]; locale?: string }) {
  const fa = normalizePortalLocale(locale).locale === "fa";
  const c = fa ? { pending: "در انتظار", update: "به‌روزرسانی رزرو", invoice: "صدور فاکتور", notes: "یادداشت ارائه‌دهنده", confirmed: "تأییدشده", cancelled: "لغوشده", completed: "تکمیل‌شده" } : { pending: "Pending", update: "Update booking", invoice: "Issue invoice", notes: "Provider notes", confirmed: "Confirmed", cancelled: "Cancelled", completed: "Completed" };
  return <Card className="overflow-hidden"><div className="divide-y divide-border">{bookings.map((booking) => <div key={booking.id} className="grid gap-3 p-4 xl:grid-cols-[1.2fr_.75fr_.75fr_1.3fr_.7fr] xl:items-center">
    <div><div className="font-bold text-slate-950">{booking.serviceName}</div><div className="text-xs text-muted-foreground">{formatDateTime(booking.createdAt, locale)}</div><div className="mt-1 font-mono text-xs text-muted-foreground">{booking.id}</div></div>
    <div>{booking.selectedDate ?? "—"} {booking.selectedTime ?? ""}</div>
    <div><Badge variant={paymentVariant(booking.paymentStatus)}>{booking.paymentStatus ?? c.pending}</Badge><div className="mt-1 text-xs">{formatMoney(booking.totalAmount, booking.currencyCode ?? "IRR", locale)}</div></div>
    <form action={updateBookingByProviderAction} className="grid gap-2"><input type="hidden" name="providerId" value={providerId} /><input type="hidden" name="bookingId" value={booking.id} />
      <Select name="bookingStatus" defaultValue={booking.bookingStatus}><option value="Confirmed">{c.confirmed}</option><option value="Pending">{c.pending}</option><option value="Cancelled">{c.cancelled}</option><option value="Completed">{c.completed}</option></Select>
      <Textarea name="providerNotes" aria-label={c.notes} defaultValue={booking.providerNotes ?? ""} className="min-h-16" /><Button type="submit" variant="secondary">{c.update}</Button>
    </form>
    <form action={issueBookingPaymentInvoiceAction} className="grid gap-2 rounded-lg bg-muted p-3"><input type="hidden" name="providerId" value={providerId} /><input type="hidden" name="bookingId" value={booking.id} /><input type="hidden" name="locale" value={locale} />
      <Input name="amount" type="number" step="0.01" defaultValue={booking.totalAmount ?? "0"} aria-label="Invoice amount" />
      <CurrencySelect name="currencyCode" value={booking.currencyCode ?? "IRR"} locale={locale} required />
      <Button type="submit">{c.invoice}</Button>
    </form>
  </div>)}</div></Card>;
}
