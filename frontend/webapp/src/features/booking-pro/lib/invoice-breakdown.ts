import type { BookingRecord } from '@/features/service-providers/types';

function amount(value: unknown): number | null {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

/** Legacy records can lack a main-service snapshot. Only derive it when every
 * component is known in the invoice currency; never add unlike currencies. */
export function invoiceBreakdown(booking: Pick<BookingRecord,
  'price' | 'currency' | 'mainSubtotal' | 'discountAmount' | 'addons' | 'childBookings'
  | 'payInPlaceSurcharge' | 'payInPlaceSurchargePercent'>) {
  const currency = (booking.currency || 'USD').toUpperCase();
  const discount = amount(booking.discountAmount);
  // Pay-in-place plans add a percentage on top of the (discounted) bill; it is in the
  // total but in no line, so it gets its own invoice line and is left out of `main`.
  const surchargeValue = amount(booking.payInPlaceSurcharge);
  const surcharge = surchargeValue !== null && surchargeValue > 0 ? surchargeValue : null;
  const surchargePercent = surcharge === null ? null : amount(booking.payInPlaceSurchargePercent);
  let main = amount(booking.mainSubtotal);
  const extras = [
    ...(booking.addons || []).map(line => ({
      currency: line.currency || currency,
      value: amount(line.unitPrice) !== null && amount(line.quantity) !== null
        ? Number(line.unitPrice) * Number(line.quantity) : null,
    })),
    ...(booking.childBookings || []).map(line => ({ currency: line.currency || currency, value: amount(line.subtotal) })),
  ];
  if (main === null && discount !== null && amount(booking.price) !== null &&
      extras.every(line => line.currency.toUpperCase() === currency && line.value !== null && Number.isFinite(line.value))) {
    const remainder = booking.price - (surcharge ?? 0) + discount - extras.reduce((sum, line) => sum + line.value!, 0);
    main = remainder >= -0.000001 ? Math.max(0, remainder) : null;
  }
  return { main, discount, surcharge, surchargePercent };
}
