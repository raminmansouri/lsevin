"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { createAccountAction, type AccountFormState } from "../config-actions";

/**
 * The "add a detail account" form.
 *
 * A client component only so the refusal can be shown. The action used to throw
 * straight out of the server, which on this screen looked like the form doing
 * nothing at all — and the two most common refusals ("the code must start with the
 * parent's code", "that code already exists") are exactly the ones worth reading.
 */
export function NewAccountForm({
  parents,
  currencies,
}: {
  parents: { id: string; label: string }[];
  currencies: { code: string }[];
}) {
  const t = useTranslations("Admin.accounting");
  const [state, formAction, pending] = useActionState<AccountFormState, FormData>(
    createAccountAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
          {state.ok}
        </p>
      )}

      {/* Only a leaf under an existing subsidiary account. Type and normal side are
          inherited from the parent, so the panel cannot create an account that
          breaks the roll-up by account type. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs">
          <span className="text-muted-foreground">{t("parentAccount")}</span>
          <select name="parentId" required className="mt-1 h-9 w-full rounded border px-2">
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="text-muted-foreground">{t("accountCode")}</span>
          <input name="code" dir="ltr" required className="mt-1 h-9 w-full rounded border px-2" />
        </label>
        <label className="text-xs">
          <span className="text-muted-foreground">{t("nameFa")}</span>
          <input name="nameFa" required className="mt-1 h-9 w-full rounded border px-2" />
        </label>
        <label className="text-xs">
          <span className="text-muted-foreground">{t("nameEn")}</span>
          <input name="nameEn" dir="ltr" className="mt-1 h-9 w-full rounded border px-2" />
        </label>
        <label className="text-xs">
          <span className="text-muted-foreground">{t("currencyOptional")}</span>
          <select name="currencyCode" className="mt-1 h-9 w-full rounded border px-2">
            <option value="">{t("anyCurrency")}</option>
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2 lg:col-span-5">
          <button
            disabled={pending}
            className="bg-primary text-primary-foreground h-9 rounded px-4 text-xs font-semibold disabled:opacity-50"
          >
            {t("addAccount")}
          </button>
        </div>
      </div>
    </form>
  );
}
