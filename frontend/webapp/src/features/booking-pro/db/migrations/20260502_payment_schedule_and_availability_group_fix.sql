-- Keeps checkout compatible with older commercial.booking_payment_schedule_lines constraints
-- and improves grouping for multi-weekday availability rules.

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'commercial'
      and table_name = 'booking_payment_schedule_lines'
  ) then
    alter table commercial.booking_payment_schedule_lines
      drop constraint if exists ck_booking_payment_schedule_lines_type;

    alter table commercial.booking_payment_schedule_lines
      add constraint ck_booking_payment_schedule_lines_type
      check (line_type in ('deposit', 'balance', 'full_payment', 'installment', 'waived', 'adjustment'));
  end if;
end $$;

create index if not exists idx_generic_availability_rules_group_id
  on provider_portal.generic_availability_rules ((metadata ->> 'availabilityGroupId'));
