"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";

import type { PayoutAccount } from "@/accounting/server/payout-accounts.service";

import {
  approveProviderEntriesAction,
  cancelProviderEntryAction,
  deletePayoutAccountAction,
  markProviderPaidAction,
  savePayoutAccountAction,
  type ProviderPayoutFormState,
} from "../actions";

function Feedback({ state }: { state: ProviderPayoutFormState }) {
  if (state.error) return <p className="mt-1 text-xs font-medium text-red-700">{state.error}</p>;
  if (state.ok) return <p className="mt-1 text-xs font-medium text-green-700">{state.ok}</p>;
  return null;
}

/**
 * Approves the given pending entries (one row, or every pending row of a provider). With
 * `confirmText` the count and total are shown and confirmed before anything is sent.
 */
export function ApproveEntriesButton({ ids, label, confirmText }: { ids: string[]; label: string; confirmText?: string }) {
  const t = useTranslations("Admin.accounting");
  const [state, action, pending] = useActionState<ProviderPayoutFormState, FormData>(approveProviderEntriesAction, {});
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (confirmText && !window.confirm(confirmText)) event.preventDefault();
      }}
    >
      {ids.map((id) => (
        <input key={id} type="hidden" name="entryId" value={id} />
      ))}
      <button
        disabled={pending}
        className="rounded bg-green-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        {pending ? t("working") : label}
      </button>
      <Feedback state={state} />
    </form>
  );
}

/** Cancels one entry (the provider is not owed it), with a reason. Folded until asked for. */
export function CancelEntryForm({ id }: { id: string }) {
  const t = useTranslations("Admin.accounting");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ProviderPayoutFormState, FormData>(cancelProviderEntryAction, {});
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-red-700 underline">
        {t("cancelEntry")}
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-1">
      <input type="hidden" name="entryId" value={id} />
      <input
        name="reason"
        type="text"
        placeholder={t("cancelEntryReason")}
        className="h-8 w-40 rounded border px-2 text-xs"
      />
      <button
        disabled={pending}
        className="rounded bg-red-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
      >
        {pending ? t("working") : t("cancelEntry")}
      </button>
      <Feedback state={state} />
    </form>
  );
}

/** Records the bank transfer that paid every approved entry shown for this provider. */
export function MarkProviderPaidForm({ ids, totalLabel }: { ids: string[]; totalLabel: string }) {
  const t = useTranslations("Admin.accounting");
  const [state, action, pending] = useActionState<ProviderPayoutFormState, FormData>(markProviderPaidAction, {});
  return (
    <form action={action} className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:bg-blue-950/20">
      {ids.map((id) => (
        <input key={id} type="hidden" name="entryId" value={id} />
      ))}
      <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
        {t("payProviderAmount")}: <span className="font-semibold">{totalLabel}</span>
      </p>
      <label className="mt-2 block text-xs font-medium text-blue-900 dark:text-blue-200">{t("payoutReference")}</label>
      <input name="payoutReference" type="text" dir="ltr" required className="mt-1 h-9 w-full rounded border px-2" />
      <button
        disabled={pending}
        className="mt-2 w-full rounded bg-blue-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
      >
        {pending ? t("working") : t("markProviderPaid")}
      </button>
      <Feedback state={state} />
    </form>
  );
}

const MAX_ACCOUNTS = 2;

/** 6037991234567890 -> 6037 9912 3456 7890 */
function groupCard(card: string): string {
  return card.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function AccountForm({
  providerId,
  currencyCode,
  account,
  onDone,
}: {
  providerId: string;
  currencyCode: string;
  account?: PayoutAccount;
  onDone: () => void;
}) {
  const t = useTranslations("Admin.accounting");
  const [state, action, pending] = useActionState<ProviderPayoutFormState, FormData>(savePayoutAccountAction, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  const field = "mt-1 h-9 w-full rounded border bg-white px-2 text-sm";
  return (
    <form action={action} className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 dark:bg-slate-900/40">
      <input type="hidden" name="providerId" value={providerId} />
      <input type="hidden" name="currencyCode" value={currencyCode} />
      {account && <input type="hidden" name="accountId" value={account.id} />}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-medium">
          {t("bankAccountHolder")} *
          <input name="holderName" required defaultValue={account?.holderName ?? ""} className={field} />
        </label>
        <label className="text-xs font-medium">
          {t("bankAccountBank")}
          <input name="bankName" defaultValue={account?.bankName ?? ""} className={field} />
        </label>
        <label className="text-xs font-medium">
          {t("bankAccountCard")}
          <input
            name="cardNumber"
            dir="ltr"
            inputMode="numeric"
            placeholder="6037 9912 3456 7890"
            defaultValue={account?.cardNumber ?? ""}
            className={`${field} font-mono`}
          />
        </label>
        <label className="text-xs font-medium">
          {t("bankAccountIban")}
          <input
            name="iban"
            dir="ltr"
            placeholder="IR000000000000000000000000"
            defaultValue={account?.iban ?? ""}
            className={`${field} font-mono`}
          />
        </label>
        <label className="text-xs font-medium">
          {t("bankAccountNumber")}
          <input
            name="accountNumber"
            dir="ltr"
            inputMode="numeric"
            defaultValue={account?.accountNumber ?? ""}
            className={`${field} font-mono`}
          />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-xs font-medium">
          <input type="checkbox" name="isDefault" defaultChecked={account?.isDefault ?? false} />
          {t("bankAccountMakeDefault")}
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={pending}
          className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {pending ? t("working") : t("saveBankAccount")}
        </button>
        <button type="button" onClick={onDone} className="text-xs underline">
          {t("cancelBankAccountEdit")}
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

function DeleteAccountButton({ providerId, accountId }: { providerId: string; accountId: string }) {
  const t = useTranslations("Admin.accounting");
  const [state, action, pending] = useActionState<ProviderPayoutFormState, FormData>(deletePayoutAccountAction, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(t("deleteBankAccountConfirm"))) e.preventDefault();
      }}
      className="inline"
    >
      <input type="hidden" name="providerId" value={providerId} />
      <input type="hidden" name="accountId" value={accountId} />
      <button disabled={pending} className="text-xs text-red-700 underline disabled:opacity-60">
        {pending ? t("working") : t("deleteBankAccount")}
      </button>
      {state.error && <p className="mt-1 text-xs font-medium text-red-700">{state.error}</p>}
    </form>
  );
}

/**
 * A provider's bank accounts on its payouts card: shown in full so the accountant can make
 * the transfer, and added, edited or removed right here. At most two per provider.
 */
export function ProviderBankAccounts({
  providerId,
  currencyCode,
  accounts,
  editable,
}: {
  providerId: string;
  currencyCode: string;
  accounts: PayoutAccount[];
  /** Whether the viewer may add, edit or remove bank accounts; otherwise read-only. */
  editable: boolean;
}) {
  const t = useTranslations("Admin.accounting");
  // "new", an account id being edited, or null.
  const [editing, setEditing] = useState<string | null>(null);
  const close = () => setEditing(null);

  return (
    <div className="space-y-2 pt-1 text-xs">
      {accounts.length === 0 && editing !== "new" && (
        <div className="text-amber-800">{t("providerNoPayoutAccount")}</div>
      )}

      {accounts.map((a) =>
        editing === a.id ? (
          <AccountForm key={a.id} providerId={providerId} currencyCode={currencyCode} account={a} onDone={close} />
        ) : (
          <div key={a.id} className="space-y-0.5 rounded-md border bg-white p-2 dark:bg-transparent">
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="font-medium">{a.holderName}</span>
              {a.bankName && <span className="text-muted-foreground">· {a.bankName}</span>}
              {a.isDefault && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-900">
                  {t("bankAccountDefault")}
                </span>
              )}
            </div>
            {a.cardNumber && (
              <div>
                <span className="text-muted-foreground">{t("bankAccountCard")}: </span>
                <span dir="ltr" className="font-mono">{groupCard(a.cardNumber)}</span>
              </div>
            )}
            {a.iban && (
              <div>
                <span className="text-muted-foreground">{t("bankAccountIban")}: </span>
                <span dir="ltr" className="font-mono break-all">{a.iban}</span>
              </div>
            )}
            {a.accountNumber && (
              <div>
                <span className="text-muted-foreground">{t("bankAccountNumber")}: </span>
                <span dir="ltr" className="font-mono">{a.accountNumber}</span>
              </div>
            )}
            {editable && (
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditing(a.id)} className="text-xs text-blue-800 underline">
                  {t("editBankAccount")}
                </button>
                <DeleteAccountButton providerId={providerId} accountId={a.id} />
              </div>
            )}
          </div>
        )
      )}

      {!editable ? null : editing === "new" ? (
        <AccountForm providerId={providerId} currencyCode={currencyCode} onDone={close} />
      ) : accounts.length < MAX_ACCOUNTS ? (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold"
        >
          + {accounts.length === 0 ? t("addBankAccount") : t("addSecondBankAccount")}
        </button>
      ) : (
        <div className="text-muted-foreground">{t("bankAccountLimit")}</div>
      )}
    </div>
  );
}
