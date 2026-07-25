-- Accounting: seed the chart of accounts, the settings, and the crypto currencies.
--
-- Idempotent — safe to re-run. Everything here is data an accountant can change later
-- from the admin panel; none of it is referenced from code by name except through
-- system_key (accounts) and key (settings).

-- ---------------------------------------------------------------------------
-- Crypto currencies. finance.currencies already holds the fiat ones.
-- ---------------------------------------------------------------------------
insert into finance.currencies (
  code, name, native_name, symbol, decimal_digits, is_iso, is_active,
  is_display_enabled, is_payment_enabled, is_settlement_enabled, sort_order, asset_class
)
values
  ('BTC',  'Bitcoin',  'بیت‌کوین', '₿',    8, false, true, true, true, true, 900, 'crypto'),
  ('USDT', 'Tether',   'تتر',      'USDT', 6, false, true, true, true, true, 901, 'crypto')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Chart of accounts (کدینگ حساب‌ها) — 4 levels: گروه → کل → معین → تفصیلی.
-- Only level-4 leaves are postable.
-- ---------------------------------------------------------------------------
with raw(code, parent_code, level, account_type, normal_balance, is_postable, system_key, fa, en) as (values
  -- 1 — Assets (دارایی‌ها)
  ('1',        null,   1, 'asset',     'debit',  false, null,                     'دارایی‌ها',                    'Assets'),
  ('10',       '1',    2, 'asset',     'debit',  false, null,                     'دارایی‌های جاری',              'Current assets'),
  ('1001',     '10',   3, 'asset',     'debit',  false, null,                     'موجودی نقد و بانک',            'Cash and bank'),
  ('1001001',  '1001', 4, 'asset',     'debit',  true,  'clearing_zarinpal',      'حساب تسویه زرین‌پال',          'Zarinpal clearing'),
  ('1001002',  '1001', 4, 'asset',     'debit',  true,  'clearing_btcpay',        'کیف پول داغ BTCPay',           'BTCPay hot wallet'),
  ('1001003',  '1001', 4, 'asset',     'debit',  true,  'bank_platform',          'حساب بانکی پلتفرم',            'Platform bank account'),
  ('1001004',  '1001', 4, 'asset',     'debit',  true,  'crypto_cold',            'کیف پول سرد کریپتو',           'Crypto cold wallet'),
  ('1002',     '10',   3, 'asset',     'debit',  false, null,                     'حساب‌های دریافتنی',            'Receivables'),
  ('1002001',  '1002', 4, 'asset',     'debit',  true,  'receivable_gateway',     'دریافتنی از درگاه‌ها',         'Gateway receivable'),

  -- 2 — Liabilities (بدهی‌ها)
  ('2',        null,   1, 'liability', 'credit', false, null,                     'بدهی‌ها',                      'Liabilities'),
  ('20',       '2',    2, 'liability', 'credit', false, null,                     'بدهی‌های جاری',                'Current liabilities'),
  ('2001',     '20',   3, 'liability', 'credit', false, null,                     'بدهی به کاربران',              'Payable to users'),
  ('2001001',  '2001', 4, 'liability', 'credit', true,  'user_wallet_liability',  'موجودی کیف پول کاربران',       'User wallet balances'),
  ('2002',     '20',   3, 'liability', 'credit', false, null,                     'وجوه رزرو شده',                'Reserved funds'),
  ('2002001',  '2002', 4, 'liability', 'credit', true,  'withdrawal_reserved',    'وجوه رزرو شده برداشت',         'Reserved for withdrawal'),
  ('2003',     '20',   3, 'liability', 'credit', false, null,                     'بدهی به تأمین‌کنندگان',        'Payable to providers'),
  ('2003001',  '2003', 4, 'liability', 'credit', true,  'provider_payable',       'بدهی به ارائه‌دهندگان خدمات',  'Provider payable'),
  ('2004',     '20',   3, 'liability', 'credit', false, null,                     'واریزهای در انتظار تأیید',     'Unconfirmed deposits'),
  ('2004001',  '2004', 4, 'liability', 'credit', true,  'pending_deposits',       'واریزهای تأیید نشده',          'Pending deposits'),

  -- 3 — Equity (حقوق صاحبان سهام)
  ('3',        null,   1, 'equity',    'credit', false, null,                     'حقوق صاحبان سهام',             'Equity'),
  ('30',       '3',    2, 'equity',    'credit', false, null,                     'سرمایه',                       'Capital'),
  ('3001',     '30',   3, 'equity',    'credit', false, null,                     'سرمایه',                       'Share capital'),
  ('3001001',  '3001', 4, 'equity',    'credit', true,  'share_capital',          'سرمایه اولیه',                 'Share capital'),
  ('3002',     '30',   3, 'equity',    'credit', false, null,                     'سود انباشته',                  'Retained earnings'),
  ('3002001',  '3002', 4, 'equity',    'credit', true,  'retained_earnings',      'سود (زیان) انباشته',           'Retained earnings'),
  ('3003',     '30',   3, 'equity',    'credit', false, null,                     'افتتاحیه',                     'Opening balance'),
  ('3003001',  '3003', 4, 'equity',    'credit', true,  'opening_balance_equity', 'تراز افتتاحیه',                'Opening balance equity'),

  -- 4 — Income (درآمدها)
  ('4',        null,   1, 'income',    'credit', false, null,                     'درآمدها',                      'Income'),
  ('40',       '4',    2, 'income',    'credit', false, null,                     'درآمدهای عملیاتی',             'Operating income'),
  ('4001',     '40',   3, 'income',    'credit', false, null,                     'کارمزد پلتفرم',                'Platform fees'),
  ('4001001',  '4001', 4, 'income',    'credit', true,  'platform_fee_income',    'درآمد کارمزد پلتفرم',          'Platform fee income'),
  ('4002',     '40',   3, 'income',    'credit', false, null,                     'کارمزد برداشت',                'Withdrawal fees'),
  ('4002001',  '4002', 4, 'income',    'credit', true,  'withdrawal_fee_income',  'درآمد کارمزد برداشت',          'Withdrawal fee income'),
  ('4003',     '40',   3, 'income',    'credit', false, null,                     'سود تسعیر ارز',                'FX gain'),
  ('4003001',  '4003', 4, 'income',    'credit', true,  'fx_gain',                'سود تسعیر ارز',                'FX gain'),

  -- 5 — Expenses (هزینه‌ها)
  ('5',        null,   1, 'expense',   'debit',  false, null,                     'هزینه‌ها',                     'Expenses'),
  ('50',       '5',    2, 'expense',   'debit',  false, null,                     'هزینه‌های عملیاتی',            'Operating expenses'),
  ('5001',     '50',   3, 'expense',   'debit',  false, null,                     'کارمزد درگاه پرداخت',          'Gateway fees'),
  ('5001001',  '5001', 4, 'expense',   'debit',  true,  'gateway_fee_expense',    'هزینه کارمزد درگاه',           'Gateway fee expense'),
  ('5002',     '50',   3, 'expense',   'debit',  false, null,                     'کارمزد شبکه بلاکچین',          'Network fees'),
  ('5002001',  '5002', 4, 'expense',   'debit',  true,  'network_fee_expense',    'هزینه کارمزد شبکه',            'Network fee expense'),
  ('5003',     '50',   3, 'expense',   'debit',  false, null,                     'زیان تسعیر ارز',               'FX loss'),
  ('5003001',  '5003', 4, 'expense',   'debit',  true,  'fx_loss',                'زیان تسعیر ارز',               'FX loss')
)
insert into accounting.accounts (
  code, parent_id, level, account_type, normal_balance, is_postable, is_system, system_key, name_translations
)
select
  r.code,
  p.id,
  r.level,
  r.account_type,
  r.normal_balance,
  r.is_postable,
  true,
  r.system_key,
  jsonb_build_object('fa-IR', r.fa, 'en-US', r.en)
from raw r
left join accounting.accounts p on p.code = r.parent_code
where not exists (select 1 from accounting.accounts a where a.code = r.code)
order by r.level, r.code;

-- ---------------------------------------------------------------------------
-- Settings. These are the numbers the business owns — change them here (or from the
-- admin panel), never in code.
--
-- Amounts are expressed in IRR, the base currency. 100,000 Toman = 1,000,000 IRR.
-- ---------------------------------------------------------------------------
insert into accounting.settings (key, value, description) values
  ('base_currency',
   '"IRR"'::jsonb,
   'Functional currency of the ledger. Every entry stores a base-currency snapshot in this unit.'),

  ('platform_fee_percent',
   '5'::jsonb,
   'Platform commission on a booking, in percent. Expected to change — always read from here.'),

  ('withdrawal.min_amount',
   '{"IRR": 1000000}'::jsonb,
   'Minimum single withdrawal. 1,000,000 IRR = 100,000 Toman.'),

  ('withdrawal.max_amount',
   '{"IRR": 200000000}'::jsonb,
   'Maximum single withdrawal. 200,000,000 IRR = 20,000,000 Toman.'),

  ('withdrawal.daily_cap',
   '{"IRR": 200000000}'::jsonb,
   'Maximum total withdrawn per user per rolling 24h. 200,000,000 IRR = 20,000,000 Toman.'),

  ('withdrawal.fee_percent',
   '0'::jsonb,
   'Withdrawal fee in percent. Zero today; the posting rule already books it to 4002001.'),

  ('withdrawal.fee_fixed',
   '{"IRR": 0}'::jsonb,
   'Flat withdrawal fee per request, added to the percentage fee.'),

  ('withdrawal.auto_approve_below',
   '{"IRR": 0}'::jsonb,
   'Withdrawals at or below this go straight to approved without a human. Zero disables it.'),

  ('deposit.min_amount',
   '{"IRR": 100000}'::jsonb,
   'Minimum single deposit. 100,000 IRR = 10,000 Toman.'),

  ('deposit.max_amount',
   '{"IRR": 5000000000}'::jsonb,
   'Maximum single deposit.'),

  ('crypto.required_confirmations',
   '{"BTC": 2, "USDT": 12}'::jsonb,
   'Confirmations before a crypto deposit becomes spendable rather than pending.'),

  ('rate_limit.deposit',
   '{"limit": 10, "window_seconds": 3600}'::jsonb,
   'Deposit requests allowed per user per window.'),

  ('rate_limit.withdrawal',
   '{"limit": 5, "window_seconds": 3600}'::jsonb,
   'Withdrawal requests allowed per user per window.')
on conflict (key) do nothing;
