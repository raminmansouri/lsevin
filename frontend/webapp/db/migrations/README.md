# Accounting migrations & cut-over runbook

Nothing here runs automatically. Deploys do not call the migration runner; a human does.

```bash
cd frontend/webapp
pnpm migrate:status     # what is applied, what is pending
pnpm migrate:dry-run    # the plan, without touching the database
pnpm migrate            # apply
```

## Order and what each file does

| File | Effect |
|---|---|
| `0001_admin_rbac_seed` | Seeds `auth.role_table_permissions` so the restored admin guard restricts without locking admins out |
| `0002_backfill_payment_credited_at` | Marks already-settled payments so they cannot be credited a second time |
| `0003`–`0009` | The accounting schema: chart of accounts, ledger, wallets, deposit/withdrawal flows, audit, seed, reports |
| `0010_accounting_legacy_reconciliation` | **Read-only views.** Safe any time. Apply and inspect *before* `0011` |
| `0011_accounting_opening_balances` | **Moves money.** Imports every legacy wallet balance as an opening entry |
| `0012_accounting_cutover_checks` | **Read-only views.** Exceptions and the suspense account |

## The cut-over

### 1. Before importing anything

Apply up to `0010`, then look at what is there:

```sql
-- What every customer holds today, and that the ledger side is still zero.
select * from accounting.v_cutover_reconciliation order by legacy_balance desc;

-- Totals, per currency.
select currency_code, sum(available_amount), count(*)
from accounting.v_legacy_wallet_balances group by 1;
```

### 2. Import

`0011` posts one journal entry per customer per currency:

```
Dr  3003001  تراز افتتاحیه            (opening balance equity)
Cr  2001001  موجودی کیف پول کاربران   (that customer's wallet)
```

It is idempotent — the key is derived from the wallet, so re-running credits nobody twice.

### 3. Verify — every row must match

```sql
select count(*) from accounting.v_cutover_reconciliation where not matches;   -- must be 0
select * from accounting.v_cutover_exceptions;                                -- review every row
select * from accounting.v_wallet_balance_drift;                              -- must be empty
```

`v_cutover_exceptions` will list anyone whose legacy balance is **negative**. Those are
customers the legacy overdraft race already overdrew. They are deliberately not imported —
a negative balance cannot be represented, and each one needs a decision (write off, or
recover) rather than a silent copy.

### 4. Account for where the money actually is

After the import, the whole imported total sits in the opening-balance suspense account:

```sql
select * from accounting.v_opening_balance_suspense;
```

`unexplained_remainder` starts equal to everything imported. Reduce it by recording what
the platform really holds — one entry per real balance:

```
Dr  1001001  حساب تسویه زرین‌پال   (actual Zarinpal balance)
Dr  1001003  حساب بانکی پلتفرم     (actual bank balance)
Dr  1001002  کیف پول داغ BTCPay    (actual crypto balance)
Cr  3003001  تراز افتتاحیه
```

Whatever will not go to zero is the amount the platform owes customers but cannot show it
is holding. That number is the point of this whole exercise.

## The part that is not finished, and the risk

The import copies balances. It does **not** redirect the code that writes them.

Until each legacy write path is switched to `postJournalEntry`, the old code keeps writing
to `customer.wallet_transactions` and the two systems drift apart. The legacy writers are:

| Path | Bridged |
|---|---|
| `src/features/booking-pro/server/payment-repository.ts` — wallet payment for a booking | ✅ |
| `src/app/wallet/payment-callback.ts` — card top-up verification | ✅ |
| `src/app/[locale]/(admin)/admin/wallet-payment-intents/actions.ts` — admin top-up approval | ✅ |
| `src/features/refunds/server/repository.ts` — refund to wallet | ✅ |
| `src/features/commercial/lib/server/refund-engine.ts` — commercial refund | ✅ |

All five now dual-write. Both refund engines additionally go through
`assertRefundable()` (`src/accounting/server/refund-guard.ts`), which takes an advisory
lock on the booking and caps the total against what **either** engine has already paid
out — previously the commercial engine had no cap at all.

Keep this running anyway — it is the alarm for any path added later, or any write that
bypasses the bridge:

```sql
select * from accounting.v_cutover_reconciliation where not matches;
```

Run it on a schedule during the transition. A row appearing there means a write went to
the legacy tables and not the ledger.
