import { assertNoUndefinedRecord, pgNumber, pgString } from './checkout-null-safety';

// Drop this block immediately before the tx`update booking.bookings b ...` query
// inside checkoutDraft, especially before the existingPending update branch.
const safePaymentMethod = pgString(paymentMethod, draft.payment_method ?? 'gateway_card')!;
const safePaymentStatus = pgString(
  (paymentTerms as any)?.paymentStatus ??
    (paymentTerms as any)?.bookingPaymentStatus ??
    (paymentTerms as any)?.status,
  safePaymentMethod === 'gateway_card' ? 'Pending' : 'Paid',
)!;
const safePaidAmount = pgNumber(
  (paymentTerms as any)?.paidAmount ?? (paymentTerms as any)?.payNowAmount,
  safePaymentMethod === 'gateway_card' ? 0 : Number(draft.total_amount ?? draft.display_total_amount ?? 0),
)!;
const safePaymentReference = pgString((paymentTerms as any)?.paymentReference ?? null);
const safeWalletPaymentIntentId = pgString((paymentTerms as any)?.walletPaymentIntentId ?? null);
const safeAppliedCouponId = pgString((paymentTerms as any)?.appliedCouponId ?? draft.applied_coupon_id ?? null);
const safeAppliedDiscountType = pgString((paymentTerms as any)?.appliedDiscountType ?? null);
const safeAppliedDiscountValue = pgNumber((paymentTerms as any)?.appliedDiscountValue ?? null);
const safeAppliedDiscountAmount = pgNumber((paymentTerms as any)?.appliedDiscountAmount ?? null, 0)!;

assertNoUndefinedRecord(
  {
    bookingId,
    draftId,
    userId,
    safePaymentMethod,
    safePaymentStatus,
    safePaidAmount,
    safePaymentReference,
    safeWalletPaymentIntentId,
    safeAppliedCouponId,
    safeAppliedDiscountType,
    safeAppliedDiscountValue,
    safeAppliedDiscountAmount,
  },
  'checkoutDraft update booking.bookings',
);

// Replace only the existingPending update query around repository.ts:709 with this shape.
// It avoids passing optional draft fields from JavaScript; most values come from SQL columns.
await tx`
  update booking.bookings b
  set provider_id = d.provider_id,
      service_id = d.service_id,
      specialist_id = d.specialist_id,
      selected_date = d.selected_date,
      selected_date_from = d.selected_date_from,
      selected_date_to = d.selected_date_to,
      selected_time = d.selected_time,
      selected_time_from = d.selected_time_from,
      selected_time_to = d.selected_time_to,
      payment_method = ${safePaymentMethod}::text,
      add_ons = coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'addon_id', a.addon_id,
            'source_type', a.source_type,
            'addon_kind', a.addon_kind,
            'quantity', a.quantity,
            'unit_price', a.unit_price,
            'currency_code', a.currency_code,
            'config', a.config
          ) order by a.created_at asc
        )
        from booking.booking_draft_addons a
        where a.draft_id = d.id
      ), '[]'::jsonb),
      upload_files = coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', doc.id,
            'requirement_id', doc.requirement_id,
            'title', doc.title,
            'file_name', doc.file_name,
            'file_url', doc.file_url,
            'mime_type', doc.mime_type,
            'size_bytes', doc.size_bytes
          ) order by doc.created_at asc
        )
        from booking.booking_draft_documents doc
        where doc.draft_id = d.id
      ), '[]'::jsonb),
      additional_services = null,
      payment_status = ${safePaymentStatus}::varchar,
      confirmation_code = coalesce(b.confirmation_code, upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
      booking_status = 'Pending',
      last_modified_date = now(),
      user_id = d.user_id,
      currency_code = coalesce(nullif(d.payment_currency_code, ''), nullif(d.display_currency_code, ''), nullif(d.currency, ''), 'USD'),
      total_amount = coalesce(d.total_amount, d.display_total_amount, d.source_total_amount, 0),
      paid_amount = ${safePaidAmount}::numeric,
      payment_reference = ${safePaymentReference}::varchar,
      wallet_payment_intent_id = ${safeWalletPaymentIntentId}::uuid,
      applied_coupon_id = ${safeAppliedCouponId}::uuid,
      applied_discount_type = ${safeAppliedDiscountType}::varchar,
      applied_discount_value = ${safeAppliedDiscountValue}::numeric,
      applied_discount_amount = ${safeAppliedDiscountAmount}::numeric,
      booking_ui_mode = coalesce(d.booking_ui_mode, 'default_slot'),
      form_submission_id = d.form_submission_id,
      metadata = coalesce(d.metadata, '{}'::jsonb) || jsonb_build_object(
        'payment_method', ${safePaymentMethod}::text,
        'payment_status', ${safePaymentStatus}::text,
        'source_draft_id', d.id::text
      ),
      source_draft_id = d.id,
      source_currency_code = d.source_currency_code,
      display_currency_code = d.display_currency_code,
      payment_currency_code = d.payment_currency_code,
      settlement_currency_code = d.settlement_currency_code,
      source_subtotal_amount = d.source_subtotal_amount,
      source_addons_amount = d.source_addons_amount,
      source_total_amount = d.source_total_amount,
      display_subtotal_amount = d.display_subtotal_amount,
      display_addons_amount = d.display_addons_amount,
      display_total_amount = d.display_total_amount,
      exchange_rate = d.exchange_rate,
      exchange_rate_ids = coalesce(d.exchange_rate_ids, array[]::uuid[]),
      fx_quote_id = d.fx_quote_id,
      pricing_snapshot = coalesce(d.pricing_snapshot, '{}'::jsonb)
  from booking.booking_drafts d
  where b.id = ${bookingId}::uuid
    and d.id = ${draftId}::uuid
    and d.user_id = ${userId}::uuid
`;
