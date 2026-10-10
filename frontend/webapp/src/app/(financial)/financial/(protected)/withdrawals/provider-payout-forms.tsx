"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import {
  approveProviderEntriesAction,
  cancelProviderEntryAction,
  markProviderPaidAction,
  type ProviderPayoutFormState,
} from "../actions";

function Feedback({ state }: { state: ProviderPayoutFormState }) {
  if (state.error) return <p className="mt-1 text-xs font-medium text-red-700">{state.error}</p>;
  if (state.ok) return <p className="mt-1 text-xs font-medium text-green-700">{state.ok}</p>;
  return null;
}

/** Approves the given pending entries (one row, or every pending row of a provider). */
export function ApproveEntriesButton({ ids, label }: { ids: string[]; label: string }) {
  const t = useTranslations("Admin.accounting");
  const [state, action, pending] = useActionState<ProviderPayoutFormState, FormData>(approveProviderEntriesAction, {});
  return (
    <form action={action}>
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
