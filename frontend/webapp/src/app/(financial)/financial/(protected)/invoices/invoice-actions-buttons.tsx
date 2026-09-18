"use client";

import { useActionState } from "react";

import {
  cancelInvoiceAction,
  deleteInvoiceAction,
  issueInvoiceAction,
  type InvoiceFormState,
} from "../invoice-actions";

/**
 * The controls on one invoice row.
 *
 * A draft may be issued or thrown away; an issued invoice may only be cancelled,
 * because its number has left the building. Nothing here is disabled silently — a
 * refusal from the service is shown under the row.
 */
export function InvoiceRowActions({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: "draft" | "issued" | "cancelled";
}) {
  const [issueState, issue, issuing] = useActionState<InvoiceFormState, FormData>(
    issueInvoiceAction,
    {}
  );
  const [cancelState, cancel, cancelling] = useActionState<InvoiceFormState, FormData>(
    cancelInvoiceAction,
    {}
  );
  const [deleteState, remove, removing] = useActionState<InvoiceFormState, FormData>(
    deleteInvoiceAction,
    {}
  );

  const error = issueState.error ?? cancelState.error ?? deleteState.error;
  const ok = issueState.ok ?? cancelState.ok ?? deleteState.ok;

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {status === "draft" && (
          <>
            <form action={issue}>
              <input type="hidden" name="invoice-id" value={invoiceId} />
              <button
                disabled={issuing}
                className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700 disabled:opacity-40"
              >
                صدور فاکتور و ثبت سند
              </button>
            </form>
            <form action={remove}>
              <input type="hidden" name="invoice-id" value={invoiceId} />
              <button
                disabled={removing}
                className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 disabled:opacity-40"
              >
                حذف
              </button>
            </form>
          </>
        )}

        {status === "issued" && (
          <form
            action={cancel}
            className="flex items-center gap-1"
            onSubmit={(event) => {
              if (!window.confirm("این فاکتور ابطال شود؟")) event.preventDefault();
            }}
          >
            <input type="hidden" name="invoice-id" value={invoiceId} />
            <input
              name="reason"
              placeholder="دلیل ابطال"
              className="h-7 w-32 rounded border px-2 text-xs"
            />
            <button
              disabled={cancelling}
              className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 disabled:opacity-40"
            >
              ابطال
            </button>
          </form>
        )}
      </div>

      {error && <p className="max-w-64 text-xs text-red-600">{error}</p>}
      {ok && !error && <p className="max-w-64 text-xs text-emerald-700">{ok}</p>}
    </div>
  );
}
