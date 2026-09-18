"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import {
  deleteAccountAction,
  renameAccountAction,
  toggleAccountActiveAction,
  type AccountFormState,
} from "../config-actions";

/**
 * Editing one line of the coding tree: rename, activate/deactivate, delete.
 *
 * All three refusals land in one place under the row, because a refusal on the
 * chart of accounts is almost always about *this* account — "it has postings", "it
 * is a system account" — and putting it anywhere else makes the accountant hunt
 * for which line complained.
 *
 * Delete is offered only where it can succeed: the service refuses a system
 * account, a parent, and anything already posted to, so a row that shows the
 * button is one that is genuinely inert.
 */
export function AccountRowActions({
  accountId,
  code,
  nameFa,
  nameEn,
  isActive,
  isSystem,
  hasPostings,
  deletable,
}: {
  accountId: string;
  code: string;
  nameFa: string;
  nameEn: string;
  isActive: boolean;
  isSystem: boolean;
  hasPostings: boolean;
  deletable: boolean;
}) {
  const t = useTranslations("Admin.accounting");

  const [renameState, rename, renaming] = useActionState<AccountFormState, FormData>(
    renameAccountAction,
    {}
  );
  const [toggleState, toggle, toggling] = useActionState<AccountFormState, FormData>(
    toggleAccountActiveAction,
    {}
  );
  const [deleteState, remove, removing] = useActionState<AccountFormState, FormData>(
    deleteAccountAction,
    {}
  );

  const error = renameState.error ?? toggleState.error ?? deleteState.error;
  const ok = renameState.ok ?? toggleState.ok ?? deleteState.ok;

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1">
        <form action={rename} className="flex items-center gap-1">
          <input type="hidden" name="accountId" value={accountId} />
          <input
            name="nameFa"
            defaultValue={nameFa}
            aria-label={t("nameFa")}
            className="h-8 w-44 rounded border px-2 text-xs"
          />
          <input
            name="nameEn"
            dir="ltr"
            defaultValue={nameEn}
            aria-label={t("nameEn")}
            className="h-8 w-40 rounded border px-2 text-xs"
          />
          <button disabled={renaming} className="rounded border px-2 py-1 text-xs disabled:opacity-40">
            {t("save")}
          </button>
        </form>

        {isSystem && (
          <span className="text-muted-foreground text-xs" title={t("systemAccountHint")}>
            {t("systemAccount")}
          </span>
        )}
        {hasPostings && <span className="text-muted-foreground text-xs">{t("hasPostings")}</span>}

        {!isSystem && (
          <form action={toggle}>
            <input type="hidden" name="accountId" value={accountId} />
            <input type="hidden" name="isActive" value={isActive ? "false" : "true"} />
            <button
              disabled={toggling}
              className="rounded border px-2 py-1 text-xs disabled:opacity-40"
            >
              {isActive ? t("deactivate") : t("activate")}
            </button>
          </form>
        )}

        {deletable && (
          <form
            action={remove}
            onSubmit={(event) => {
              // A delete of an unused account is still a delete; the tree is the
              // thing every document is coded against.
              if (!window.confirm(t("deleteAccountConfirm", { code }))) event.preventDefault();
            }}
          >
            <input type="hidden" name="accountId" value={accountId} />
            <button
              disabled={removing}
              className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 disabled:opacity-40"
            >
              {t("deleteAccount")}
            </button>
          </form>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {ok && !error && <p className="text-xs text-emerald-700">{ok}</p>}
    </div>
  );
}
