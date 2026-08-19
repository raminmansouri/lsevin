create or replace view provider_portal.provider_finance_kpis as
with currencies as (
  select provider_id, payment_currency_code as currency_code from commercial.booking_charge_lines where provider_id is not null
  union
  select provider_id, currency_code from commercial.provider_ledgers where provider_id is not null
  union
  select provider_id, currency_code from booking.bookings where provider_id is not null and currency_code is not null
), charge_totals as (
  select provider_id, payment_currency_code as currency_code,
    sum(payment_gross_amount)::numeric(18,2) as gross_revenue,
    sum(net_amount)::numeric(18,2) as net_revenue,
    sum(platform_fee_amount)::numeric(18,2) as platform_fee_amount,
    sum(provider_payable_amount)::numeric(18,2) as provider_payable_amount
  from commercial.booking_charge_lines
  where provider_id is not null
  group by provider_id, payment_currency_code
), refund_totals as (
  select b.provider_id, rl.payment_currency_code as currency_code,
    sum(rl.payment_refund_amount)::numeric(18,2) as refunded_amount
  from commercial.refund_lines rl
  join booking.bookings b on b.id = rl.booking_id
  where b.provider_id is not null
  group by b.provider_id, rl.payment_currency_code
), booking_totals as (
  select provider_id, currency_code,
    count(*)::integer as bookings_count,
    count(*) filter (where lower(coalesce(payment_status, '')) in ('paid','captured','succeeded','authorized'))::integer as paid_bookings_count
  from booking.bookings
  where provider_id is not null and currency_code is not null
  group by provider_id, currency_code
), ledger_totals as (
  select provider_id, currency_code,
    sum(amount) filter (where status = 'pending')::numeric(18,2) as pending_ledger_amount,
    sum(amount) filter (where status = 'approved')::numeric(18,2) as approved_ledger_amount,
    sum(abs(amount)) filter (where status = 'paid' or entry_type = 'payout')::numeric(18,2) as paid_ledger_amount
  from commercial.provider_ledgers
  where provider_id is not null
  group by provider_id, currency_code
)
select
  c.provider_id as service_provider_id,
  c.currency_code,
  coalesce(ct.gross_revenue, 0)::numeric(18,2) as gross_revenue,
  coalesce(ct.net_revenue, 0)::numeric(18,2) as net_revenue,
  coalesce(ct.platform_fee_amount, 0)::numeric(18,2) as platform_fee_amount,
  coalesce(ct.provider_payable_amount, 0)::numeric(18,2) as provider_payable_amount,
  coalesce(rt.refunded_amount, 0)::numeric(18,2) as refunded_amount,
  coalesce(bt.bookings_count, 0)::integer as bookings_count,
  coalesce(bt.paid_bookings_count, 0)::integer as paid_bookings_count,
  coalesce(lt.pending_ledger_amount, 0)::numeric(18,2) as pending_ledger_amount,
  coalesce(lt.approved_ledger_amount, 0)::numeric(18,2) as approved_ledger_amount,
  coalesce(lt.paid_ledger_amount, 0)::numeric(18,2) as paid_ledger_amount
from currencies c
left join charge_totals ct on ct.provider_id = c.provider_id and ct.currency_code = c.currency_code
left join refund_totals rt on rt.provider_id = c.provider_id and rt.currency_code = c.currency_code
left join booking_totals bt on bt.provider_id = c.provider_id and bt.currency_code = c.currency_code
left join ledger_totals lt on lt.provider_id = c.provider_id and lt.currency_code = c.currency_code;

create or replace view provider_portal.provider_daily_report_view as
with booking_daily as (
  select provider_id, create_date::date as report_date, currency_code,
    count(*)::integer as bookings_count
  from booking.bookings
  where provider_id is not null and currency_code is not null
  group by provider_id, create_date::date, currency_code
), charge_daily as (
  select b.provider_id, b.create_date::date as report_date, cl.payment_currency_code as currency_code,
    sum(cl.payment_gross_amount)::numeric(18,2) as gross_revenue,
    sum(cl.net_amount)::numeric(18,2) as net_revenue,
    sum(cl.provider_payable_amount)::numeric(18,2) as provider_payable_amount
  from commercial.booking_charge_lines cl
  join booking.bookings b on b.id = cl.booking_id
  where b.provider_id is not null
  group by b.provider_id, b.create_date::date, cl.payment_currency_code
), refund_daily as (
  select b.provider_id, b.create_date::date as report_date, rl.payment_currency_code as currency_code,
    sum(rl.payment_refund_amount)::numeric(18,2) as refunded_amount
  from commercial.refund_lines rl
  join booking.bookings b on b.id = rl.booking_id
  where b.provider_id is not null
  group by b.provider_id, b.create_date::date, rl.payment_currency_code
), keys as (
  select provider_id, report_date, currency_code from booking_daily
  union select provider_id, report_date, currency_code from charge_daily
  union select provider_id, report_date, currency_code from refund_daily
)
select k.provider_id as service_provider_id, k.report_date, k.currency_code,
  coalesce(b.bookings_count, 0)::integer as bookings_count,
  coalesce(c.gross_revenue, 0)::numeric(18,2) as gross_revenue,
  coalesce(c.net_revenue, 0)::numeric(18,2) as net_revenue,
  coalesce(c.provider_payable_amount, 0)::numeric(18,2) as provider_payable_amount,
  coalesce(r.refunded_amount, 0)::numeric(18,2) as refunded_amount
from keys k
left join booking_daily b on b.provider_id = k.provider_id and b.report_date = k.report_date and b.currency_code = k.currency_code
left join charge_daily c on c.provider_id = k.provider_id and c.report_date = k.report_date and c.currency_code = k.currency_code
left join refund_daily r on r.provider_id = k.provider_id and r.report_date = k.report_date and r.currency_code = k.currency_code;
