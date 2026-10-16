-- Three roles for the financial panel instead of two:
--
--   manager             everything, including settings and approvals above the limit
--   accounting_manager  approves documents, deposits, withdrawals and payouts up to the
--                       approval limit; manages the chart of accounts
--   accountant          prepares (drafts, invoices); cannot approve, pay or finalise
--
-- What each role may do lives in src/accounting/server/permissions.ts. The database only
-- knows which role a person holds.
--
-- Existing `finance_admin` accounts become `manager`, so nobody loses access they have
-- today. Move anyone who should be an accounting manager with:
--   pnpm financial:user role <username> accounting_manager

alter table accounting.panel_users drop constraint if exists panel_users_role_check;

update accounting.panel_users
   set role = 'manager', updated_at = now()
 where role = 'finance_admin';

alter table accounting.panel_users
  add constraint panel_users_role_check
  check (role in ('manager', 'accounting_manager', 'accountant'));

-- How much the accounting manager may approve on their own, per currency. Above it a
-- withdrawal or provider payout waits for the manager. Empty means no ceiling, so this
-- changes nothing until the manager sets a figure in Settings.
insert into accounting.settings (key, value, description) values
  ('approval.accounting_manager_limit',
   '{}'::jsonb,
   'سقف تأیید مستقل مدیر حسابداری برای هر درخواست برداشت یا تسویهٔ طرف حساب، به تفکیک ارز. بالاتر از این مبلغ، تأیید «مدیر» لازم است. خالی یعنی بدون سقف.')
on conflict (key) do nothing;
