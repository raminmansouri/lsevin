import "server-only";

import { db } from "@/features/booking-admin-shared/server/db";
import { applyPayInPlacePlan, isPayInPlacePlanId } from "@/features/booking-pro/utils/pay-in-place-plans";
import { calculateBookingPaymentTerms, resolveBookingPaymentPolicy } from "@/features/commercial/lib/server/payment-policy-engine";

/**
 * Read-only pre-invoice (پیش‌فاکتور) for an admin looking at a booking draft.
 *
 * Every amount comes from what the booking flow already stored on the draft
 * (subtotal_amount / addons_amount / total_amount, the applied discount in
 * metadata, the add-on and child-booking rows). Nothing is recalculated or
 * written back: recalculateDraftTotals() persists, and an admin opening a
 * preview must never change the customer's draft. The amount due now is the
 * one figure that is not stored on a draft; it is derived with the same
 * payment-policy engine checkout uses, so it is an estimate until checkout.
 */

export type PreInvoiceLine = {
  key: string;
  kind: "main" | "child" | "addon";
  name: string | null;
  /** Provider type of a child booking (hotel, transfer, ...) or the add-on kind. */
  category: string | null;
  provider: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  time: string | null;
  nights: number | null;
  adults: number | null;
  children: number | null;
  infants: number | null;
  rooms: number | null;
  quantity: number;
  unitPrice: number | null;
  amount: number | null;
  currency: string;
  status: string | null;
};

export type BookingDraftPreInvoice = {
  id: string;
  status: string | null;
  currentStep: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  submittedAt: string | null;
  customer: { name: string | null; phone: string | null; email: string | null };
  providerName: string | null;
  serviceName: string | null;
  specialistName: string | null;
  bookingUiMode: string | null;
  selectedDate: string | null;
  selectedDateFrom: string | null;
  selectedDateTo: string | null;
  selectedTime: string | null;
  selectedTimeFrom: string | null;
  selectedTimeTo: string | null;
  nights: number | null;
  adults: number | null;
  children: number | null;
  infants: number | null;
  rooms: number | null;
  paymentMethod: string | null;
  payInPlacePlan: string | null;
  notes: string | null;
  currency: string;
  lines: PreInvoiceLine[];
  subtotalAmount: number;
  addonsAmount: number;
  grossAmount: number;
  discount: { amount: number; code: string | null; title: string | null; type: string | null; value: number | null } | null;
  surcharge: { amount: number; percent: number } | null;
  totalAmount: number;
  dueNowAmount: number | null;
  remainingAmount: number | null;
  /**
   * Where the due-now split came from: the customer's pay-in-place plan, an active
   * commercial.booking_payment_policies row, the engine default (no policy at any
   * scope -> full payment now), or unavailable (the lookup failed).
   */
  paymentTermsSource: "payInPlace" | "policy" | "default" | "unavailable";
  /** The engine's normalized collection mode (full, percent, fixed, free, provider_collects). */
  collectionMode: string | null;
};

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function int(value: unknown): number | null {
  const n = num(value);
  return n === null ? null : Math.trunc(n);
}

function str(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = value instanceof Date ? value.toISOString() : String(value).trim();
  return s ? s : null;
}

function dateOnly(value: unknown): string | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  const s = str(value);
  return s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
}

function timeOnly(value: unknown): string | null {
  const s = str(value);
  return s && /^\d{2}:\d{2}/.test(s) ? s.slice(0, 5) : null;
}

/** Same rule as the booking flow: check-out day minus check-in day, never less than 1. */
function nightsBetween(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(1, Math.round((b - a) / 86400000));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export async function getBookingDraftPreInvoice(draftId: string, locale = "fa-IR"): Promise<BookingDraftPreInvoice | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draftId)) return null;

  const [d] = await db<any[]>`
    select
      d.id,
      d.status,
      d.current_step,
      d.created_at,
      d.updated_at,
      d.submitted_at,
      d.selected_date,
      d.selected_time,
      d.selected_time_from,
      d.selected_time_to,
      d.payment_method,
      d.currency,
      d.subtotal_amount::text as subtotal_amount,
      d.addons_amount::text as addons_amount,
      d.total_amount::text as total_amount,
      d.notes,
      coalesce(d.metadata, '{}'::jsonb) as metadata,
      d.provider_id,
      d.service_id,
      ps.service_definition_id,
      sp.provider_type_id,
      coalesce(sd.booking_ui_mode, d.metadata ->> 'bookingUiMode') as booking_ui_mode,
      common.get_translation_t(sp.name_translations, ${locale}, 'en-US') as provider_name,
      coalesce(nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'en-US'), ''), common.get_translation_t(sd.name_translations, ${locale}, 'en-US')) as service_name,
      common.get_translation_t(st.name_translations, ${locale}, 'en-US') as specialist_name,
      trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))) as customer_name,
      nullif(trim(concat(coalesce(u.phone_number_country_code, ''), ' ', coalesce(u.phone_number, ''))), '') as customer_phone,
      u.email as customer_email
    from booking.booking_drafts d
    left join category.service_providers sp on sp.id = d.provider_id
    left join category.provider_services ps on ps.id = d.service_id
    left join category.service_definitions sd on sd.id = ps.service_definition_id
    left join category.staff st on st.id = d.specialist_id
    left join identity.asp_net_users u on u.id = d.user_id
    where d.id = ${draftId}
    limit 1
  `;
  if (!d) return null;

  const [childRows, addonRows] = await Promise.all([
    db<any[]>`
      select
        c.id,
        c.status,
        c.selected_date,
        c.selected_date_from,
        c.selected_date_to,
        c.selected_time,
        c.selected_time_from,
        c.adults,
        c.children,
        c.infants,
        c.rooms,
        c.booking_ui_mode,
        c.subtotal_amount::text as subtotal_amount,
        c.currency,
        common.get_translation_t(pt.name_translations, ${locale}, 'en-US') as provider_type_name,
        common.get_translation_t(sp.name_translations, ${locale}, 'en-US') as provider_name,
        coalesce(nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'en-US'), ''), common.get_translation_t(csd.name_translations, ${locale}, 'en-US')) as service_name
      from booking.booking_draft_child_bookings c
      left join category.provider_types pt on pt.id = c.provider_type_id
      left join category.service_providers sp on sp.id = c.provider_id
      left join category.provider_services ps on ps.id = c.service_id
      left join category.service_definitions csd on csd.id = ps.service_definition_id
      where c.parent_draft_id = ${draftId}
      order by c.create_date asc
    `,
    db<any[]>`
      select a.addon_id, a.addon_kind, a.source_type, a.quantity, a.unit_price::text as unit_price, a.currency_code, a.config
      from booking.booking_draft_addons a
      where a.draft_id = ${draftId}
      order by a.created_at asc
    `,
  ]);

  const metadata: Record<string, any> = d.metadata && typeof d.metadata === "object" ? d.metadata : {};
  const currency = String(d.currency || "USD").toUpperCase();
  const bookingUiMode = str(d.booking_ui_mode);
  const selectedDateFrom = dateOnly(metadata.selectedDateFrom);
  const selectedDateTo = dateOnly(metadata.selectedDateTo);
  const nights = bookingUiMode === "date_range" ? nightsBetween(selectedDateFrom, selectedDateTo) : null;

  const subtotalAmount = num(d.subtotal_amount) ?? 0;
  const addonsAmount = num(d.addons_amount) ?? 0;
  const totalAmount = num(d.total_amount) ?? 0;
  const grossAmount = round2(subtotalAmount + addonsAmount);

  const discountAmount = num(metadata.appliedDiscountAmount) ?? 0;
  const discount = discountAmount > 0
    ? {
        amount: discountAmount,
        code: str(metadata.appliedCouponCode),
        title: str(metadata.couponTitle),
        type: str(metadata.appliedDiscountType),
        value: num(metadata.appliedDiscountValue),
      }
    : null;

  const payInPlacePlan = isPayInPlacePlanId(metadata.payInPlacePlan) ? metadata.payInPlacePlan : null;
  const payInPlace = d.payment_method === "pay_on_delivery" && payInPlacePlan
    ? applyPayInPlacePlan(Math.max(0, grossAmount - discountAmount), currency, payInPlacePlan)
    : null;
  const surcharge = payInPlace && payInPlace.surchargeAmount > 0
    ? { amount: payInPlace.surchargeAmount, percent: payInPlace.surchargePercent }
    : null;

  // Amount due now: the pay-in-place plan when one is chosen, otherwise the same
  // policy lookup checkout runs. Never fatal: if the lookup fails the lines show "—".
  // With no active policy at any scope, checkout's engine defaults to collecting the
  // full total now; `paymentTermsSource: "default"` lets the page say so.
  let dueNowAmount: number | null = null;
  let remainingAmount: number | null = null;
  let paymentTermsSource: BookingDraftPreInvoice["paymentTermsSource"] = "unavailable";
  let collectionMode: string | null = null;
  if (payInPlace) {
    dueNowAmount = payInPlace.dueNowAmount;
    remainingAmount = payInPlace.dueLaterAmount;
    paymentTermsSource = "payInPlace";
    collectionMode = "percent";
  } else {
    try {
      const policy = await resolveBookingPaymentPolicy({
        providerTypeId: d.provider_type_id ?? null,
        providerId: d.provider_id ?? null,
        serviceDefinitionId: d.service_definition_id ?? null,
        providerServiceId: d.service_id ?? null,
      });
      const terms = calculateBookingPaymentTerms(totalAmount, currency, policy);
      dueNowAmount = num(terms.dueNowAmount);
      remainingAmount = num(terms.dueLaterAmount);
      paymentTermsSource = policy ? "policy" : "default";
      collectionMode = str(terms.collectionMode);
    } catch (error) {
      console.error("[booking-drafts-admin] pre-invoice payment terms failed for draft", draftId, error);
    }
  }

  const adults = int(metadata.adults);
  const children = int(metadata.children);
  const infants = int(metadata.infants);
  const rooms = int(metadata.rooms);

  const lines: PreInvoiceLine[] = [];
  if (d.service_id || subtotalAmount > 0) {
    const qty = nights ?? 1;
    lines.push({
      key: "main",
      kind: "main",
      name: str(d.service_name),
      category: str(metadata.mealPlan),
      provider: str(d.provider_name),
      dateFrom: selectedDateFrom ?? dateOnly(d.selected_date),
      dateTo: selectedDateTo,
      time: timeOnly(d.selected_time) ?? timeOnly(d.selected_time_from),
      nights,
      adults,
      children,
      infants,
      rooms,
      quantity: qty,
      unitPrice: round2(subtotalAmount / qty),
      amount: subtotalAmount,
      currency,
      status: null,
    });
  }

  for (const c of childRows) {
    const from = dateOnly(c.selected_date_from) ?? dateOnly(c.selected_date);
    const to = dateOnly(c.selected_date_to);
    const childNights = c.booking_ui_mode === "date_range" ? nightsBetween(from, to) : null;
    const unit = num(c.subtotal_amount);
    const qty = childNights ?? 1;
    lines.push({
      key: `child-${c.id}`,
      kind: "child",
      name: str(c.service_name),
      category: str(c.provider_type_name),
      provider: str(c.provider_name),
      dateFrom: from,
      dateTo: to,
      time: timeOnly(c.selected_time) ?? timeOnly(c.selected_time_from),
      nights: childNights,
      adults: int(c.adults),
      children: int(c.children),
      infants: int(c.infants),
      rooms: int(c.rooms),
      quantity: qty,
      // The child row stores the provider's own price per unit/night. A zero means
      // the flow never priced it, which is shown as missing rather than as free.
      unitPrice: unit && unit > 0 ? unit : null,
      amount: unit && unit > 0 ? round2(unit * qty) : null,
      currency: String(c.currency || currency).toUpperCase(),
      status: str(c.status),
    });
  }

  addonRows.forEach((a, index) => {
    const config: Record<string, any> = a.config && typeof a.config === "object" ? a.config : {};
    const qty = int(a.quantity) ?? 1;
    const unit = num(a.unit_price);
    lines.push({
      key: `addon-${a.addon_id}-${index}`,
      kind: "addon",
      name: str(config.name) ?? str(config.title) ?? str(config.label) ?? str(a.addon_id),
      category: str(a.addon_kind),
      provider: null,
      dateFrom: dateOnly(config.date ?? config.selectedDate ?? config.dateFrom),
      dateTo: dateOnly(config.dateTo),
      time: timeOnly(config.time ?? config.selectedTime),
      nights: null,
      adults: null,
      children: null,
      infants: null,
      rooms: null,
      quantity: qty,
      unitPrice: unit,
      amount: unit === null ? null : round2(unit * qty),
      currency: String(a.currency_code || currency).toUpperCase(),
      status: null,
    });
  });

  return {
    id: String(d.id),
    status: str(d.status),
    currentStep: int(d.current_step),
    createdAt: str(d.created_at),
    updatedAt: str(d.updated_at),
    submittedAt: str(d.submitted_at),
    customer: { name: str(d.customer_name), phone: str(d.customer_phone), email: str(d.customer_email) },
    providerName: str(d.provider_name),
    serviceName: str(d.service_name),
    specialistName: str(d.specialist_name),
    bookingUiMode,
    selectedDate: dateOnly(d.selected_date),
    selectedDateFrom,
    selectedDateTo,
    selectedTime: timeOnly(d.selected_time),
    selectedTimeFrom: timeOnly(d.selected_time_from),
    selectedTimeTo: timeOnly(d.selected_time_to),
    nights,
    adults,
    children,
    infants,
    rooms,
    paymentMethod: str(d.payment_method),
    payInPlacePlan,
    notes: str(d.notes),
    currency,
    lines,
    subtotalAmount,
    addonsAmount,
    grossAmount,
    discount,
    surcharge,
    totalAmount,
    dueNowAmount,
    remainingAmount,
    paymentTermsSource,
    collectionMode,
  };
}
