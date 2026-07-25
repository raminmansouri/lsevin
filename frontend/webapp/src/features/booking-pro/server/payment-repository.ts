
import 'server-only';

import { mirrorBookingWalletPayment } from '@/accounting/server/legacy-bridge';
import db from '@/config/database/db';
import { filterGatewaysForRegion, resolveUserPaymentRegion } from '@/payment/server/gateway-eligibility';
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

  // No hardcoded "bank transfer" fallback. It used to be appended unconditionally, so a
  // method nobody had configured always appeared at checkout — carrying the literal
  // placeholder "Replace this with your real bank or card-to-card instructions." Which
  // methods exist is shop.payment_methods' job; the wallet above is the only exception,
  // because it is derived from the user's own account rather than configured.
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

  // Only the rail this customer's region allows is ever a candidate, so a
  // generic method code ('card', 'gateway_card') resolves to Zarinpal for an
  // Iranian account and to BTCPay for everyone else.
  const region = await resolveUserPaymentRegion(params.userId);
  const enabledGateways = filterGatewaysForRegion(
    await listEnabledPaymentGatewayOptions({ context: 'booking_online_card' }),
    region
  );
  const selectedEnabledGateway = enabledGateways.find((item) => item.code.toLowerCase() === normalizedMethodCode);
  const shouldUseOnlineGateway =
    ['card', 'gateway_card', 'online_card', 'zarinpal', 'btcpay', 'crypto'].includes(normalizedMethodCode) ||
    Boolean(selectedEnabledGateway);

  if (shouldUseOnlineGateway) {
    const gateway = selectedEnabledGateway ?? enabledGateways[0];

    // No cross-region fallback: an Iranian customer is never handed crypto
    // because Zarinpal is down, and vice versa. Surface the outage instead.
    if (!gateway) {
      throw new Error(
        region === 'iran'
          ? 'Online payment is temporarily unavailable. Enable Zarinpal from Admin > Payment Gateways.'
          : 'Online payment is temporarily unavailable. Enable the crypto gateway from Admin > Payment Gateways.'
      );
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
    // The balance check and the debit used to be two separate round trips with the
    // debit in its own transaction, so two concurrent checkouts both read the same
    // funds and both spent them — the wallet went negative and both bookings were
    // confirmed. They are one transaction now.
    //
    // Lock order is booking.payments -> booking.bookings -> customer.wallet_accounts,
    // which is the order the rest of the money code already implies (confirmBookingPayment
    // below locks payments then bookings; approveRefundToWallet locks bookings and then
    // reaches wallet_accounts through the wallet_transactions FK). Taking the wallet
    // first would close a cycle with the refund flow and deadlock a money path.
    const settlement = await db.begin(async (tx) => {
      await tx`
        select id
        from booking.payments
        where id = ${paymentId}
        limit 1
        for no key update
      `;

      // `of b` is required: pt is the nullable side of an outer join and Postgres refuses
      // to lock it. `no key update` rather than `for update` so this never blocks the key
      // share locks other writers take on this row through their foreign keys.
      const [current] = await tx<any[]>`
        select b.total_amount,
               coalesce(b.paid_amount,0) as paid_amount,
               b.payment_status,
               coalesce(pt.due_now_amount, b.total_amount, 0) as lsevin_due_now_amount
        from booking.bookings b
        left join commercial.booking_payment_terms pt on pt.booking_id = b.id
        where b.id = ${params.bookingId}
        limit 1
        for no key update of b
      `;

      // Serialising the debits is not the same as making them idempotent, so both
      // guards below run under the booking row lock. Keyed on the booking rather than
      // on booking.payments.status because two simultaneous submits get two different
      // payments rows and neither can see the other's.
      if (String(current?.payment_status ?? '') === 'Paid') {
        return { status: 'already_paid' as const, availableAmount: 0, externalReference: null };
      }

      const [settled] = await tx<any[]>`
        select payment_intent_id
        from customer.wallet_transactions
        where booking_id = ${params.bookingId}
          and transaction_type = 'booking_payment'
          and status = 'completed'
        limit 1
      `;

      if (settled) {
        return {
          status: 'already_paid' as const,
          availableAmount: 0,
          externalReference: (settled.payment_intent_id ?? null) as string | null,
        };
      }

      // Lock this user's active wallet accounts, then compute the balance under that
      // lock. Every wallet debit in the codebase is the insert below and every other
      // writer of customer.wallet_transactions only ever credits, so the lock is what
      // makes the sum that follows exact.
      //
      // The balance is summed from the ledger rather than read from the
      // customer.wallet_balances view on purpose: that view CROSS JOINs a hardcoded
      // (USD, EUR, GBP, AED) currency list, so it has no row at all for IRR or IRT.
      // Reading it meant a Rial booking always resolved to "no wallet" and could never
      // be paid from a funded wallet — while the wallet screen, which does its own sum
      // over six currencies, cheerfully displayed that unusable balance. Summing here
      // matches what the customer is shown.
      // Two statements because Postgres rejects a locking clause on an aggregate query.
      // `order by id` makes the choice deterministic; the other wallet code paths pick
      // an account with an unordered LIMIT 1, so a user with two accounts can otherwise
      // be credited on one and debited from the other.
      const [walletAccount] = await tx<any[]>`
        select id
        from customer.wallet_accounts
        where user_id = ${params.userId}
          and is_active = true
        order by id
        limit 1
        for no key update
      `;

      const [wallet] = walletAccount
        ? await tx<any[]>`
            select ${walletAccount.id}::uuid as wallet_account_id,
                   coalesce(sum(amount) filter (where status = 'completed'), 0) as available_amount
            from customer.wallet_transactions
            where wallet_account_id = ${walletAccount.id}
              and currency_code = ${currency}
          `
        : [];

      if (!wallet || Number(wallet.available_amount ?? 0) < amount) {
        return {
          status: 'insufficient_balance' as const,
          availableAmount: Number(wallet?.available_amount ?? 0),
          externalReference: null as string | null,
        };
      }

      // Moved inside the transaction: this used to be written as 'succeeded' before any
      // money moved, so a failed debit left a phantom intent in /admin/wallet-payment-intents.
      const [intent] = await tx<any[]>`
        insert into customer.wallet_payment_intents (
          wallet_account_id, user_id, booking_id, intent_type, payment_method,
          currency_code, amount, status, metadata
        ) values (
          ${wallet.wallet_account_id}, ${params.userId}, ${params.bookingId}, 'booking_payment', 'wallet',
          ${currency}, ${amount}, 'succeeded', ${ { source: 'booking-payment', bookingId: params.bookingId, paymentId } as any }
        ) returning id
      `;

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

      // Dual-write to the accounting ledger, in this same transaction. The legacy rows
      // above stay because other screens still read them; the ledger is what actually
      // enforces the balance (its non-negative CHECK) and splits out the platform fee.
      // If the ledger refuses the entry, this whole checkout rolls back — a booking must
      // never be marked paid on the strength of the legacy write alone.
      //
      // No-ops until the accounting migrations are applied, so this can ship first.
      await mirrorBookingWalletPayment(
        {
          userId: params.userId,
          currencyCode: currency,
          amount: String(amount),
          bookingId: params.bookingId,
          paymentId,
        },
        tx as never
      );

      return {
        status: 'succeeded' as const,
        availableAmount: Number(wallet.available_amount ?? 0),
        externalReference: String(intent.id),
      };
    });

    if (settlement.status === 'insufficient_balance') {
      return { paymentId, bookingId: params.bookingId, method: 'wallet', status: 'insufficient_balance', availableAmount: settlement.availableAmount, amount, currency };
    }

    return { paymentId, bookingId: params.bookingId, method: 'wallet', status: 'succeeded', completed: true, amount, currency, externalReference: settlement.externalReference };
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
  userId: string;
  status: string;
  externalReference?: string | null;
  payload?: Record<string, unknown>;
}) {
  const normalized = normalizePaymentStatus(params.status);

  await db.begin(async (tx) => {
    // Scoped to the booking's owner. The payment id alone used to be the only thing
    // standing between a caller and someone else's booking, and both ids are
    // guessable/enumerable. `of p` keeps the lock off booking.bookings so this keeps
    // the same lock order as the wallet path above.
    const [payment] = await tx<any[]>`
      select p.id, p.amount, p.status
      from booking.payments p
      join booking.bookings b on b.id = p.booking_id
      where p.id = ${params.paymentId}
        and p.booking_id = ${params.bookingId}
        and b.user_id = ${params.userId}
      limit 1
      for no key update of p
    `;

    if (!payment) throw new Error('Payment not found');

    // A settled attempt is never re-opened from here. This runs off a request body,
    // so without the guard a status:'failed' confirm walks a gateway-credited row
    // back to Failed — after which a replayed gateway callback passes the
    // settled-state check in markGatewayPaymentVerified and credits paid_amount a
    // second time. Returning before the UPDATE also skips the caller-supplied
    // `payload` merge, which would otherwise let the body poison gateway_payload.
    // A re-confirm of 'Succeeded' still falls through: it is a no-op, and the
    // `payment.status !== 'Succeeded'` check below already stops the re-credit.
    if (
      normalized !== 'Succeeded' &&
      ['succeeded', 'paid', 'captured', 'completed'].includes(String(payment.status ?? '').trim().toLowerCase())
    ) {
      return;
    }

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
