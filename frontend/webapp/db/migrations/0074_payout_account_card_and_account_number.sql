-- A provider's bank account needs the 16-digit card number and the full account number
-- (shomare hesab) next to the Sheba, not only the last 4 digits. Entered by the accountant
-- from the provider payouts card in the financial panel (/financial/withdrawals).
alter table provider_portal.payout_accounts
  add column if not exists card_number text,
  add column if not exists account_number text;
