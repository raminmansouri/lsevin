begin;

alter table accounting.accounts drop constraint if exists accounts_level_check;
alter table accounting.accounts add constraint accounts_level_check check (level between 1 and 9);

create temp table chart (
  code text primary key,
  parent_code text,
  level smallint not null,
  account_type text not null,
  normal_balance text not null,
  is_postable boolean not null,
  system_key text,
  old_code text,
  fa text not null,
  en text not null
) on commit drop;

insert into chart values
  ('1',       null,    1, 'asset',     'debit',  false, null, null, 'دارایی جاری', 'Current assets'),
  ('110',     '1',     2, 'asset',     'debit',  false, null, null, 'موجودی نقد و بانک', 'Cash and bank'),
  ('11001',   '110',   3, 'asset',     'debit',  false, null, null, 'بانک', 'Banks'),
  ('1100101', '11001', 4, 'asset',     'debit',  true,  null, null, 'بانک صادرات', 'Bank Saderat'),
  ('1100102', '11001', 4, 'asset',     'debit',  true,  'clearing_zarinpal', '1001001', 'درگاه زرین‌پال', 'Zarinpal gateway'),
  ('1100103', '11001', 4, 'asset',     'debit',  true,  'clearing_btcpay', '1001002', 'کیف پول داغ BTCPay', 'BTCPay hot wallet'),
  ('1100104', '11001', 4, 'asset',     'debit',  true,  'bank_platform', '1001003', 'بانک پلتفرم', 'Platform bank account'),
  ('1100105', '11001', 4, 'asset',     'debit',  true,  'crypto_cold', '1001004', 'کیف پول سرد کریپتو', 'Crypto cold wallet'),
  ('11002',   '110',   3, 'asset',     'debit',  true,  null, '1001005', 'صندوق', 'Cash on hand'),
  ('11003',   '110',   3, 'asset',     'debit',  false, null, null, 'تنخواه‌گردان', 'Petty cash'),
  ('1100301', '11003', 4, 'asset',     'debit',  true,  null, null, 'مهلا غلامی', 'Mahla Gholami'),
  ('1100302', '11003', 4, 'asset',     'debit',  true,  null, null, 'مژگان عباسی', 'Mozhgan Abbasi'),
  ('120',     '1',     2, 'asset',     'debit',  true,  null, null, 'سرمایه‌گذاری‌های کوتاه‌مدت', 'Short-term investments'),
  ('130',     '1',     2, 'asset',     'debit',  false, null, null, 'حساب‌ها و اسناد دریافتنی تجاری', 'Trade receivables'),
  ('13001',   '130',   3, 'asset',     'debit',  true,  'receivable_gateway', '1002001', 'دریافتنی از درگاه‌ها', 'Gateway receivable'),
  ('13002',   '130',   3, 'asset',     'debit',  true,  null, null, 'حساب‌های دریافتنی تجاری و غیرتجاری', 'Trade and other receivables'),
  ('13003',   '130',   3, 'asset',     'debit',  true,  null, null, 'اسناد دریافتنی تجاری', 'Trade notes receivable'),
  ('150',     '1',     2, 'asset',     'debit',  true,  null, null, 'موجودی مواد و کالا', 'Inventory'),
  ('160',     '1',     2, 'asset',     'debit',  true,  null, null, 'سفارشات و پیش‌پرداخت‌ها', 'Orders and prepayments'),

  ('2',       null,    1, 'asset',     'debit',  false, null, null, 'دارایی غیرجاری', 'Non-current assets'),
  ('210',     '2',     2, 'asset',     'debit',  true,  null, null, 'دارایی‌های ثابت مشهود', 'Tangible fixed assets'),
  ('220',     '2',     2, 'asset',     'debit',  true,  null, null, 'دارایی‌های نامشهود', 'Intangible assets'),
  ('230',     '2',     2, 'asset',     'debit',  true,  null, null, 'سرمایه‌گذاری‌های بلندمدت', 'Long-term investments'),
  ('240',     '2',     2, 'asset',     'credit', true,  null, null, 'استهلاک انباشتهٔ دارایی‌های ثابت', 'Accumulated depreciation'),

  ('3',       null,    1, 'liability', 'credit', false, null, null, 'بدهی جاری', 'Current liabilities'),
  ('310',     '3',     2, 'liability', 'credit', false, null, null, 'حساب‌ها و اسناد پرداختنی تجاری', 'Trade payables'),
  ('31001',   '310',   3, 'liability', 'credit', true,  'user_wallet_liability', '2001001', 'موجودی کیف پول کاربران', 'User wallet balances'),
  ('31002',   '310',   3, 'liability', 'credit', true,  'withdrawal_reserved', '2002001', 'وجوه رزرو شده برداشت', 'Reserved for withdrawal'),
  ('31003',   '310',   3, 'liability', 'credit', true,  'provider_payable', '2003001', 'بدهی به ارائه‌دهندگان خدمات', 'Provider payable'),
  ('31004',   '310',   3, 'liability', 'credit', true,  'pending_deposits', '2004001', 'واریزهای تأیید نشده', 'Pending deposits'),
  ('31005',   '310',   3, 'liability', 'credit', true,  null, null, 'حساب‌های پرداختنی تجاری و غیرتجاری', 'Trade and other payables'),
  ('31006',   '310',   3, 'liability', 'credit', true,  null, null, 'اسناد پرداختنی تجاری و غیرتجاری', 'Notes payable'),
  ('320',     '3',     2, 'liability', 'credit', true,  null, null, 'تسهیلات مالی کوتاه‌مدت', 'Short-term loans'),
  ('330',     '3',     2, 'liability', 'credit', true,  null, null, 'حقوق و دستمزد پرداختنی', 'Salaries payable'),
  ('340',     '3',     2, 'liability', 'credit', true,  null, null, 'بیمهٔ پرداختنی', 'Insurance payable'),
  ('350',     '3',     2, 'liability', 'credit', true,  null, null, 'پیش‌دریافت‌ها', 'Advances received'),
  ('360',     '3',     2, 'liability', 'credit', true,  null, null, 'ذخایر و سایر بدهی‌های جاری', 'Provisions and other current liabilities'),

  ('4',       null,    1, 'liability', 'credit', false, null, null, 'بدهی غیرجاری', 'Non-current liabilities'),
  ('410',     '4',     2, 'liability', 'credit', true,  null, null, 'تسهیلات مالی بلندمدت', 'Long-term loans'),
  ('420',     '4',     2, 'liability', 'credit', true,  null, null, 'اسناد پرداختنی بلندمدت', 'Long-term notes payable'),
  ('430',     '4',     2, 'liability', 'credit', true,  null, null, 'ذخیرهٔ مزایای پایان خدمت کارکنان', 'Employee end-of-service provision'),
  ('440',     '4',     2, 'liability', 'credit', true,  null, null, 'سایر بدهی‌های بلندمدت', 'Other long-term liabilities'),

  ('5',       null,    1, 'equity',    'credit', false, null, null, 'حقوق صاحبان سهام', 'Equity'),
  ('510',     '5',     2, 'equity',    'credit', false, null, null, 'سرمایه', 'Capital'),
  ('51001',   '510',   3, 'equity',    'credit', true,  'share_capital', '3001001', 'سرمایهٔ اولیه', 'Share capital'),
  ('520',     '5',     2, 'equity',    'credit', true,  null, null, 'صرف سهام', 'Share premium'),
  ('530',     '5',     2, 'equity',    'credit', true,  null, null, 'اندوختهٔ قانونی', 'Legal reserve'),
  ('540',     '5',     2, 'equity',    'credit', true,  null, null, 'سایر اندوخته‌ها', 'Other reserves'),
  ('550',     '5',     2, 'equity',    'credit', false, null, null, 'سود و زیان انباشته', 'Retained earnings'),
  ('55001',   '550',   3, 'equity',    'credit', true,  'retained_earnings', '3002001', 'سود (زیان) انباشته', 'Retained earnings'),
  ('55002',   '550',   3, 'equity',    'credit', true,  'opening_balance_equity', '3003001', 'تراز افتتاحیه', 'Opening balance equity'),
  ('560',     '5',     2, 'equity',    'credit', true,  null, null, 'سود و زیان جاری', 'Current year profit and loss'),

  ('6',       null,    1, 'income',    'credit', false, null, null, 'درآمد', 'Income'),
  ('610',     '6',     2, 'income',    'credit', false, null, null, 'درآمدهای عملیاتی', 'Operating income'),
  ('61001',   '610',   3, 'income',    'credit', true,  'platform_fee_income', '4001001', 'درآمد کارمزد پلتفرم', 'Platform fee income'),
  ('61002',   '610',   3, 'income',    'credit', true,  'withdrawal_fee_income', '4002001', 'درآمد کارمزد برداشت', 'Withdrawal fee income'),
  ('61003',   '610',   3, 'income',    'credit', true,  null, null, 'درآمد فروش کالا', 'Product sales income'),
  ('620',     '6',     2, 'income',    'credit', false, null, null, 'درآمدهای غیرعملیاتی', 'Non-operating income'),
  ('62001',   '620',   3, 'income',    'credit', true,  null, null, 'درآمد سرمایه‌گذاری', 'Investment income'),
  ('62002',   '620',   3, 'income',    'credit', true,  null, null, 'سود سپردهٔ بانکی', 'Bank interest'),
  ('62003',   '620',   3, 'income',    'credit', true,  null, null, 'درآمدهای متفرقه', 'Miscellaneous income'),
  ('62004',   '620',   3, 'income',    'credit', true,  'fx_gain', '4003001', 'سود تسعیر ارز', 'FX gain'),
  ('630',     '6',     2, 'income',    'debit',  false, null, null, 'برگشت از فروش و تخفیفات', 'Returns and discounts'),
  ('63001',   '630',   3, 'income',    'debit',  true,  null, null, 'برگشت از خدمات', 'Service returns'),
  ('63002',   '630',   3, 'income',    'debit',  true,  null, null, 'تخفیفات', 'Discounts'),

  ('7',       null,    1, 'expense',   'debit',  false, null, null, 'بهای تمام‌شده', 'Cost of services'),
  ('710',     '7',     2, 'expense',   'debit',  false, null, null, 'بهای تمام‌شدهٔ ارائهٔ خدمات', 'Cost of services rendered'),
  ('71001',   '710',   3, 'expense',   'debit',  true,  null, null, 'مواد مستقیم', 'Direct materials'),
  ('71002',   '710',   3, 'expense',   'debit',  true,  null, null, 'دستمزد مستقیم', 'Direct labour'),
  ('71003',   '710',   3, 'expense',   'debit',  true,  null, null, 'سربار', 'Overhead'),
  ('71004',   '710',   3, 'expense',   'debit',  true,  null, null, 'هزینه‌های عملیاتی', 'Operating costs'),

  ('8',       null,    1, 'expense',   'debit',  false, null, null, 'هزینه‌های عملیاتی', 'Operating expenses'),
  ('810',     '8',     2, 'expense',   'debit',  true,  null, null, 'هزینه‌های اداری و عمومی', 'General and administrative expenses'),
  ('820',     '8',     2, 'expense',   'debit',  true,  null, null, 'هزینه‌های فروش و بازاریابی', 'Sales and marketing expenses'),
  ('830',     '8',     2, 'expense',   'debit',  true,  null, null, 'هزینهٔ استهلاک', 'Depreciation expense'),
  ('840',     '8',     2, 'expense',   'debit',  true,  null, null, 'سایر هزینه‌های عملیاتی', 'Other operating expenses'),
  ('850',     '8',     2, 'expense',   'debit',  true,  null, null, 'هزینهٔ حقوق و دستمزد', 'Salaries expense'),

  ('9',       null,    1, 'expense',   'debit',  false, null, null, 'سایر هزینه‌های غیرعملیاتی و حساب انتظامی', 'Non-operating expenses and memorandum accounts'),
  ('910',     '9',     2, 'expense',   'debit',  false, null, null, 'هزینه‌های مالی', 'Finance costs'),
  ('91001',   '910',   3, 'expense',   'debit',  true,  'gateway_fee_expense', '5001001', 'هزینهٔ کارمزد درگاه', 'Gateway fee expense'),
  ('91002',   '910',   3, 'expense',   'debit',  true,  'network_fee_expense', '5002001', 'هزینهٔ کارمزد شبکه', 'Network fee expense'),
  ('920',     '9',     2, 'expense',   'debit',  false, null, null, 'سایر هزینه‌های غیرعملیاتی', 'Other non-operating expenses'),
  ('92001',   '920',   3, 'expense',   'debit',  true,  'fx_loss', '5003001', 'زیان تسعیر ارز', 'FX loss'),
  ('930',     '9',     2, 'expense',   'debit',  true,  null, null, 'حساب‌های انتظامی', 'Memorandum accounts'),
  ('940',     '9',     2, 'expense',   'credit', true,  null, null, 'طرف حساب‌های انتظامی', 'Memorandum contra accounts');

update accounting.accounts set code = 'old:' || code where code not like 'old:%';
update accounting.accounts set parent_id = null;

update accounting.accounts a
   set code = c.code,
       level = c.level,
       account_type = c.account_type,
       normal_balance = c.normal_balance,
       is_postable = c.is_postable,
       is_system = c.system_key is not null,
       system_key = c.system_key,
       name_translations = a.name_translations || jsonb_build_object('fa-IR', c.fa, 'en-US', c.en)
  from chart c
 where c.old_code is not null and a.code = 'old:' || c.old_code;

insert into accounting.accounts (code, level, account_type, normal_balance, is_postable, is_system, system_key, name_translations)
select c.code, c.level, c.account_type, c.normal_balance, c.is_postable,
       c.level = 1 or c.system_key is not null, c.system_key,
       jsonb_build_object('fa-IR', c.fa, 'en-US', c.en)
  from chart c
 where not exists (select 1 from accounting.accounts a where a.code = c.code);

update accounting.accounts set is_system = true where code in (select code from chart where level = 1);

do $$
declare leftover text;
begin
  select string_agg(code, ', ') into leftover
    from accounting.accounts
   where code like 'old:%' and is_postable;
  if leftover is not null then
    raise exception 'Accounts not in the new chart (map them first): %', leftover;
  end if;
end $$;

delete from accounting.accounts where code like 'old:%';

update accounting.accounts a
   set parent_id = p.id
  from chart c
  join accounting.accounts p on p.code = c.parent_code
 where a.code = c.code;

commit;
