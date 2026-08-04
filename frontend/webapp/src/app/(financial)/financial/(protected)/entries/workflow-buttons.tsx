"use client";

import { useActionState } from "react";

import {
  copyEntryAction,
  deleteDraftAction,
  transitionEntryAction,
  type EntryFormState,
} from "../entry-actions";

/**
 * The workflow controls on a journal row.
 *
 * Which buttons appear is driven by the same ladder the service enforces, so the
 * screen never offers a step the server will refuse. The server is still the
 * authority — hiding a button is a courtesy, not a control, and the capability
 * check lives in the service.
 */
const NEXT_STEPS: Record<string, { to: string; label: string; tone: string }[]> = {
  draft: [{ to: "temporary", label: "ارسال برای تأیید", tone: "border-blue-300 text-blue-700" }],
  temporary: [
    { to: "approved", label: "تأیید", tone: "border-emerald-300 text-emerald-700" },
    { to: "rejected", label: "رد", tone: "border-red-300 text-red-700" },
    { to: "draft", label: "بازگشت به پیش‌نویس", tone: "border-zinc-300 text-zinc-600" },
  ],
  approved: [
    { to: "posted", label: "قطعی‌کردن", tone: "border-emerald-400 text-emerald-800 font-medium" },
    { to: "temporary", label: "بازگشت", tone: "border-zinc-300 text-zinc-600" },
  ],
};

export function EntryWorkflowButtons({ entryId, status }: { entryId: string; status: string }) {
  const [transitionState, transition, transitioning] = useActionState<EntryFormState, FormData>(
    transitionEntryAction,
    {}
  );
  const [copyState, copy, copying] = useActionState<EntryFormState, FormData>(copyEntryAction, {});
  const [deleteState, remove, removing] = useActionState<EntryFormState, FormData>(
    deleteDraftAction,
    {}
  );

  const steps = NEXT_STEPS[status] ?? [];
  const error = transitionState.error ?? copyState.error ?? deleteState.error;

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {steps.map((step) => (
          <form key={step.to} action={transition}>
            <input type="hidden" name="entry-id" value={entryId} />
            <input type="hidden" name="to" value={step.to} />
            <button
              type="submit"
              disabled={transitioning}
              className={`rounded border px-2 py-1 text-xs disabled:opacity-40 ${step.tone}`}
            >
              {step.label}
            </button>
          </form>
        ))}

        <form action={copy}>
          <input type="hidden" name="entry-id" value={entryId} />
          <button
            type="submit"
            disabled={copying}
            className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-600 disabled:opacity-40"
          >
            رونوشت
          </button>
        </form>

        {status === "draft" && (
          <form action={remove}>
            <input type="hidden" name="entry-id" value={entryId} />
            <button
              type="submit"
              disabled={removing}
              className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 disabled:opacity-40"
            >
              حذف
            </button>
          </form>
        )}
      </div>

      {error && <p className="max-w-56 text-xs text-red-600">{error}</p>}
    </div>
  );
}
