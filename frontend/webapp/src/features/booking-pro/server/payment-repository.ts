
import 'server-only';

import db from '@/config/database/db';
import { listEnabledPaymentGatewayOptions } from '@/payment/server/payment-gateway.repository';
import { initiateBookingPayment } from '@/payment/server/payment.service';

export interface PaymentMethodItem {
  code: string;
  name: string;
  description?: string | null;
  provider?: string | null;
  supportsAuthorize?: boolean;
  supportsCapture?: boolean;
  supportsRefund?: boolean;
  configuration?: Record<string, unknown>;
  isWallet?: boolean;
}

function pickJsonTranslation(value: any, fallback: string) {
  if (!value) return fallback;
  return value['en-US'] ?? value.en ?? Object.values(value)[0] ?? fallback;
}

function normalizePaymentStatus(status?: string | null) {
  const value = (status ?? '').toLowerCase();
  if (['succeeded', 'success', 'captured', 'paid'].includes(value)) return 'Succeeded';
  if (['failed', 'failure'].includes(value)) return 'Failed';
  if (['processing'].includes(value)) return 'Processing';
  if (['cancelled'].includes(value)) return 'Cancelled';
  return 'Pending';
}

export async function listPaymentMethodsForUser(userId: string): Promise<PaymentMethodItem[]> {
  const rows = await db`
    select code, provider, description_translations, name_translations,
           supports_authorize, supports_capture, supports_refund, configuration
    from shop.payment_methods
    where is_active = true
    order by sort_order asc, create_date asc
  `;

  const methods: PaymentMethodItem[] = rows.map((row: any) => ({
    code: row.code,
    name: pickJsonTranslation(row.name_translations, row.code),
    description: pickJsonTranslation(row.description_translations, row.code),
    provider: row.provider,
    supportsAuthorize: row.supports_authorize,
    supportsCapture: row.supports_capture,
    supportsRefund: row.supports_refund,
    configuration: row.configuration ?? {},
  }));

  const walletRows = await db`
    select id
    from customer.wallet_accounts
    where user_id = ${userId} and is_active = true
    limit 1
  `;

  if (walletRows.length && !methods.some((x) => x.code === 'wallet')) {
    methods.unshift({
      code: 'wallet',
      name: 'Wallet',
      description: 'Pay instantly from available wallet balance',
      provider: 'internal_wallet',
      supportsAuthorize: false,
      supportsCapture: true,
      supportsRefund: true,
      configuration: {},
      isWallet: true,
    });
  }

  if (!methods.some((x) => x.code === 'bank')) {
    methods.push({
      code: 'bank',
      name: 'Bank transfer',
      description: 'Manual bank transfer / card-to-card confirmation flow',
      provider: 'manual',
      supportsAuthorize: false,
      supportsCapture: false,
      supportsRefund: false,
      configuration: {
        instructions: 'Replace this with your real bank or card-to-card instructions.',
      },
    });
  }

  return methods;
}

export async function createBookingPaymentIntent(params: {
  bookingId: string;
  userId: string;
  paymentMethodCode: string;
  returnUrl?: string | null;
}) {
  const [booking] = await db<any[]>`
    with latest_payment as (
      select p.*
      from booking.payments p
      where p.booking_id = ${params.bookingId}
      order by p.created_at desc nulls last
      limit 1
    )
    select b.id, b.user_id, b.total_amount, b.currency_code, b.payment_status, b.booking_status, b.paid_amount,
           lp.id as payment_id, lp.amount as payment_amount, lp.currency as payment_currency, lp.gateway_payload,
           pt.id as payment_terms_id, pt.due_now_amount, pt.due_later_amount, pt.payment_currency_code, pt.collection_mode
    from booking.bookings b
    left join latest_payment lp on true
    left join commercial.booking_payment_terms pt on pt.booking_id = b.id
    where b.id = ${params.bookingId} and b.user_id = ${params.userId}
    limit 1
  `;

  if (!booking) throw new Error('Booking not found');

  const amount = Number(booking.payment_amount ?? booking.due_now_amount ?? booking.total_amount ?? 0);
  const currency = booking.payment_currency ?? booking.payment_currency_code ?? booking.currency_code ?? 'USD';
  const normalizedMethodCode = String(params.paymentMethodCode || '').trim().toLowerCase();

  if (amount <= 0) {
    return {
      paymentId: booking.payment_id ?? null,
      bookingId: params.bookingId,
      method: params.paymentMethodCode,
      status: 'not_required',
      completed: true,
      amount,
      currency,
    };
  }

  if (['card', 'gateway_card', 'zarinpal'].includes(normalizedMethodCode)) {
    const enabledGateways = await listEnabledPaymentGatewayOptions({ context: 'booking_online_card' });
    const requestedGateway = normalizedMethodCode === 'zarinpal' ? 'zarinpal' : enabledGateways[0]?.code;
    const gateway = enabledGateways.find((item) => item.code === requestedGateway);

    if (!gateway) {
      throw new Error('No online card payment gateway is enabled. Enable Zarinpal from Admin > Payment Gateways.');
    }

    const gatewayResult = await initiateBookingPayment({
      bookingId: params.bookingId,
      userId: params.userId,
      gateway: gateway.code as any,
      locale: 'en',
    });

    return {
      paymentId: gatewayResult.paymentId,
      bookingId: params.bookingId,
      method: gateway.code,
      status: 'requires_action',
      completed: false,
      amount: gatewayResult.amount,
      currency: gatewayResult.currency,
      externalReference: gatewayResult.authority ?? null,
      actionUrl: gatewayResult.redirectUrl,
      gateway: gateway.code,
    };
  }

  const methods = await listPaymentMethodsForUser(params.userId);
  const method = methods.find((x) => x.code === params.paymentMethodCode);
  if (!method) throw new Error('Payment method is not available');

  const paymentId = booking.payment_id ?? (await db`
    insert into booking.payments (booking_id, user_id, payment_method, gateway, amount, currency, status)
    values (${params.bookingId}, ${params.userId}, ${params.paymentMethodCode}, ${method.provider ?? null}, ${amount}, ${currency}, 'Pending')
    returning id
  `)[0].id;

  if (params.paymentMethodCode === 'wallet') {
    const [wallet] = await db<any[]>`
      select wb.wallet_account_id, wb.available_amount
      from customer.wallet_balances wb
      join customer.wallet_accounts wa on wa.id = wb.wallet_account_id and wa.is_active = true
      where wb.user_id = ${params.userId} and wb.currency_code = ${currency}
      limit 1
    `;

    if (!wallet || Number(wallet.available_amount ?? 0) < amount) {
      return { paymentId, bookingId: params.bookingId, method: 'wallet', status: 'insufficient_balance', availableAmount: Number(wallet?.available_amount ?? 0), amount, currency };
    }

    const [intent] = await db<any[]>`
      insert into customer.wallet_payment_intents (
        wallet_account_id, user_id, booking_id, intent_type, payment_method,
        currency_code, amount, status, metadata
      ) values (
        ${wallet.wallet_account_id}, ${params.userId}, ${params.bookingId}, 'booking_payment', 'wallet',
        ${currency}, ${amount}, 'succeeded', ${ { source: 'booking-payment', bookingId: params.bookingId, paymentId } as any }
      ) returning id
    `;

    await db.begin(async (tx) => {
      await tx`
        insert into customer.wallet_transactions (
          wallet_account_id, user_id, booking_id, payment_intent_id,
          transaction_type, direction, status, payment_method,
          title, subtitle, currency_code, amount, metadata
        ) values (
          ${wallet.wallet_account_id}, ${params.userId}, ${params.bookingId}, ${intent.id},
          'booking_payment', 'debit', 'completed', 'wallet',
          'Booking payment', 'Combined parent checkout', ${currency}, ${-Math.abs(amount)}, ${ { bookingId: params.bookingId, paymentId } as any }
        )
      `;

      const [current] = await tx<any[]>`
        select b.total_amount,
               coalesce(b.paid_amount,0) as paid_amount,
               coalesce(pt.due_now_amount, b.total_amount, 0) as lsevin_due_now_amount
        from booking.bookings b
        left join commercial.booking_payment_terms pt on pt.booking_id = b.id
        where b.id = ${params.bookingId}
        limit 1
      `;
      const newPaid = Number(current?.paid_amount ?? 0) + amount;
      const requiredByLsevin = Number(current?.lsevin_due_now_amount ?? current?.total_amount ?? 0);
      const lsevinPaid = newPaid >= requiredByLsevin;

      await tx`
        update booking.bookings
        set wallet_payment_intent_id = ${intent.id},
            payment_method = 'wallet',
            payment_status = ${lsevinPaid ? 'Paid' : 'PartiallyPaid'},
            booking_status = ${lsevinPaid ? 'Confirmed' : 'Pending'},
            paid_amount = ${newPaid},
            payment_reference = ${intent.id}
        where id = ${params.bookingId}
      `;

      await tx`
        update booking.payments
        set payment_method = 'wallet', gateway = 'internal_wallet', status = 'Succeeded',
            external_reference = ${intent.id},
            gateway_payload = coalesce(gateway_payload, '{}'::jsonb) || ${ { flow: 'wallet', settled: true } as any }
        where id = ${paymentId}
      `;
    });

    return { paymentId, bookingId: params.bookingId, method: 'wallet', status: 'succeeded', completed: true, amount, currency, externalReference: intent.id };
  }

  if (params.paymentMethodCode === 'bank') {
    const instructions = String((method.configuration ?? {}).instructions ?? 'Replace this with your bank details.');
    const externalReference = `BANK-${Date.now()}`;
    await db`
      update booking.payments
      set payment_method = 'bank', gateway = 'manual', status = 'Pending',
          external_reference = ${externalReference},
          gateway_payload = coalesce(gateway_payload, '{}'::jsonb) || ${ { instructions, returnUrl: params.returnUrl ?? null, method: 'bank' } as any }
      where id = ${paymentId}
    `;
    return { paymentId, bookingId: params.bookingId, method: 'bank', status: 'pending_manual_confirmation', completed: false, amount, currency, externalReference, instructions };
  }

  const externalReference = `PAY-${Date.now()}`;
  const actionUrl = params.returnUrl ?? `/payment/${externalReference}`;
  await db`
    update booking.payments
    set payment_method = ${params.paymentMethodCode}, gateway = ${method.provider ?? params.paymentMethodCode}, status = 'Pending',
        external_reference = ${externalReference},
        gateway_payload = coalesce(gateway_payload, '{}'::jsonb) || ${ { actionUrl, returnUrl: params.returnUrl ?? null, method: params.paymentMethodCode } as any }
    where id = ${paymentId}
  `;

  return { paymentId, bookingId: params.bookingId, method: params.paymentMethodCode, status: 'requires_action', completed: false, amount, currency, externalReference, actionUrl, note: 'Replace actionUrl creation with your real gateway implementation.' };
}

export async function confirmBookingPayment(params: {
  bookingId: string;
  paymentId: string;
  status: string;
  externalReference?: string | null;
  payload?: Record<string, unknown>;
}) {
  const normalized = normalizePaymentStatus(params.status);

  await db.begin(async (tx) => {
    const [payment] = await tx<any[]>`
      select id, amount, status
      from booking.payments
      where id = ${params.paymentId} and booking_id = ${params.bookingId}
      limit 1
      for update
    `;

    if (!payment) throw new Error('Payment not found');

    await tx`
      update booking.payments
      set status = ${normalized},
          external_reference = coalesce(${params.externalReference ?? null}, external_reference),
          gateway_payload = coalesce(gateway_payload, '{}'::jsonb) || ${params.payload ?? {} as any}
      where id = ${params.paymentId} and booking_id = ${params.bookingId}
    `;

    if (normalized === 'Succeeded' && payment.status !== 'Succeeded') {
      const [booking] = await tx<any[]>`
        select b.total_amount,
               coalesce(b.paid_amount,0) as paid_amount,
               coalesce(pt.due_now_amount, b.total_amount, 0) as lsevin_due_now_amount
        from booking.bookings b
        left join commercial.booking_payment_terms pt on pt.booking_id = b.id
        where b.id = ${params.bookingId}
        limit 1
      `;
      const newPaid = Number(booking?.paid_amount ?? 0) + Number(payment.amount ?? 0);
      const requiredByLsevin = Number(booking?.lsevin_due_now_amount ?? booking?.total_amount ?? 0);
      const lsevinPaid = newPaid >= requiredByLsevin;
      await tx`
        update booking.bookings
        set payment_status = ${lsevinPaid ? 'Paid' : 'PartiallyPaid'},
            booking_status = ${lsevinPaid ? 'Confirmed' : 'Pending'},
            paid_amount = ${newPaid},
            payment_reference = coalesce(${params.externalReference ?? null}, payment_reference)
        where id = ${params.bookingId}
      `;

      await tx`
        update marketing.user_discount_coupons udc
        set status = 'redeemed',
            redeemed_at = coalesce(redeemed_at, now())
        from booking.bookings b
        where b.id = ${params.bookingId}
          and b.applied_coupon_id = udc.id
          and udc.status = 'reserved'
      `;
    } else if (normalized === 'Failed') {
      await tx`
        update booking.bookings
        set payment_status = 'Failed'
        where id = ${params.bookingId}
      `;
    }
  });

  return { ok: true, status: normalized };
}
