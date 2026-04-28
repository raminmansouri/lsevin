
import 'server-only';
import sql from '@/config/database/db';

export async function materializeBookingPaymentTermsFromDraft(input: { draftId: string; bookingId: string; }) {
  return sql.begin(async (tx) => {
    const [draftTerms] = await tx<any[]>`select * from commercial.booking_payment_terms where draft_id = ${input.draftId} limit 1`;
    if (!draftTerms) return null;
    const [saved] = await tx<any[]>`
      insert into commercial.booking_payment_terms (
        booking_id, policy_id, collection_mode, payment_currency_code, total_amount,
        due_now_amount, due_later_amount, deposit_percent, deposit_fixed_amount,
        balance_due_trigger, deposit_refundable_mode, terms_snapshot
      ) values (
        ${input.bookingId}, ${draftTerms.policy_id}, ${draftTerms.collection_mode}, ${draftTerms.payment_currency_code}, ${draftTerms.total_amount},
        ${draftTerms.due_now_amount}, ${draftTerms.due_later_amount}, ${draftTerms.deposit_percent}, ${draftTerms.deposit_fixed_amount},
        ${draftTerms.balance_due_trigger}, ${draftTerms.deposit_refundable_mode}, ${draftTerms.terms_snapshot as any}
      )
      on conflict (booking_id) do update set
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
    const draftLines = await tx<any[]>`select * from commercial.booking_payment_schedule_lines where payment_terms_id = ${draftTerms.id} order by line_no asc`;
    for (const line of draftLines) {
      await tx`insert into commercial.booking_payment_schedule_lines (payment_terms_id, line_no, line_type, label, amount, currency_code, status, metadata) values (${saved.id}, ${line.line_no}, ${line.line_type}, ${line.label}, ${line.amount}, ${line.currency_code}, ${line.status}, ${line.metadata as any})`;
    }
    return saved;
  });
}
