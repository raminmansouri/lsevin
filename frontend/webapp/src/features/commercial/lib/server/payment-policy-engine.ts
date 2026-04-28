
import 'server-only';
import sql from '@/config/database/db';

function roundDueNow(amount: number, mode: string) {
  if (mode === 'up_100') return Math.ceil(amount / 100) * 100;
  if (mode === 'up_1000') return Math.ceil(amount / 1000) * 1000;
  if (mode === 'up_10000') return Math.ceil(amount / 10000) * 10000;
  return amount;
}

export async function resolveBookingPaymentPolicy(scope: {
  providerTypeId?: string | null;
  providerId?: string | null;
  serviceDefinitionId?: string | null;
  providerServiceId?: string | null;
}) {
  const candidates: Array<[string, string | null | undefined]> = [
    ['provider_service', scope.providerServiceId],
    ['service_definition', scope.serviceDefinitionId],
    ['provider', scope.providerId],
    ['provider_type', scope.providerTypeId],
    ['global', null],
  ];

  for (const [scopeType, scopeId] of candidates) {
    const [policy] = await sql<any[]>`
      select *
      from commercial.booking_payment_policies
      where is_active = true
        and scope_type = ${scopeType}
        and (${scopeId as any} is null or scope_id = ${scopeId as any})
      order by priority asc, created_at desc
      limit 1
    `;
    if (policy) return policy;
  }

  return {
    id: null,
    collection_mode: 'full_prepay',
    deposit_value: 0,
    minimum_due_now_amount: 0,
    due_now_rounding_mode: 'none',
    balance_due_trigger: 'manual',
    deposit_refundable_mode: 'policy_based',
  };
}

export function calculateBookingPaymentTerms(totalAmount: number, paymentCurrencyCode: string, policy: any) {
  const mode = policy.collection_mode || 'full_prepay';
  let dueNow = totalAmount;
  let dueLater = 0;
  let depositPercent = null;
  let depositFixedAmount = null;

  if (mode === 'free_booking') {
    dueNow = 0;
    dueLater = totalAmount;
  } else if (mode === 'deposit_percent') {
    depositPercent = Number(policy.deposit_value || 0);
    dueNow = totalAmount * (depositPercent / 100);
  } else if (mode === 'deposit_fixed') {
    depositFixedAmount = Number(policy.deposit_value || 0);
    dueNow = depositFixedAmount;
  }

  dueNow = Math.max(dueNow, Number(policy.minimum_due_now_amount || 0));
  dueNow = roundDueNow(Math.min(dueNow, totalAmount), policy.due_now_rounding_mode || 'none');
  dueLater = Math.max(0, totalAmount - dueNow);

  return {
    collectionMode: mode,
    paymentCurrencyCode,
    totalAmount,
    dueNowAmount: dueNow,
    dueLaterAmount: dueLater,
    depositPercent,
    depositFixedAmount,
    balanceDueTrigger: policy.balance_due_trigger || 'manual',
    depositRefundableMode: policy.deposit_refundable_mode || 'policy_based',
    termsSnapshot: { policy, generatedAt: new Date().toISOString() },
    schedule: [
      { lineNo: 1, lineType: 'reservation_due', label: dueNow === 0 ? 'Free reservation' : 'Reservation payment', amount: dueNow, currencyCode: paymentCurrencyCode, metadata: {} },
      ...(dueLater > 0 ? [{ lineNo: 2, lineType: 'remaining_balance', label: 'Remaining balance', amount: dueLater, currencyCode: paymentCurrencyCode, metadata: { balanceDueTrigger: policy.balance_due_trigger || 'manual' } }] : []),
    ],
  };
}

export async function upsertDraftBookingPaymentTerms(input: { draftId: string; providerTypeId?: string | null; providerId?: string | null; serviceDefinitionId?: string | null; providerServiceId?: string | null; paymentCurrencyCode: string; totalAmount: number; }) {
  const policy = await resolveBookingPaymentPolicy(input);
  const terms = calculateBookingPaymentTerms(input.totalAmount, input.paymentCurrencyCode, policy);
  return sql.begin(async (tx) => {
    const [saved] = await tx<any[]>`
      insert into commercial.booking_payment_terms (
        draft_id, policy_id, collection_mode, payment_currency_code, total_amount,
        due_now_amount, due_later_amount, deposit_percent, deposit_fixed_amount,
        balance_due_trigger, deposit_refundable_mode, terms_snapshot
      ) values (
        ${input.draftId}, ${policy.id}, ${terms.collectionMode}, ${terms.paymentCurrencyCode}, ${terms.totalAmount},
        ${terms.dueNowAmount}, ${terms.dueLaterAmount}, ${terms.depositPercent}, ${terms.depositFixedAmount},
        ${terms.balanceDueTrigger}, ${terms.depositRefundableMode}, ${terms.termsSnapshot as any}
      )
      on conflict (draft_id) do update set
        policy_id = excluded.policy_id,
        collection_mode = excluded.collection_mode,
        payment_currency_code = excluded.payment_currency_code,
        total_amount = excluded.total_amount,
        due_now_amount = excluded.due_now_amount,
        due_later_amount = excluded.due_later_amount,
        deposit_percent = excluded.deposit_percent,
        deposit_fixed_amount = excluded.deposit_fixed_amount,
        balance_due_trigger = excluded.balance_due_trigger,
        deposit_refundable_mode = excluded.deposit_refundable_mode,
        terms_snapshot = excluded.terms_snapshot
      returning id
    `;
    await tx`delete from commercial.booking_payment_schedule_lines where payment_terms_id = ${saved.id}`;
    for (const line of terms.schedule) {
      await tx`insert into commercial.booking_payment_schedule_lines (payment_terms_id, line_no, line_type, label, amount, currency_code, metadata) values (${saved.id}, ${line.lineNo}, ${line.lineType}, ${line.label}, ${line.amount}, ${line.currencyCode}, ${line.metadata as any})`;
    }
    return { policy, terms, paymentTermsId: saved.id };
  });
}
