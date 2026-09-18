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
 *
 * The courtesy used to stop at the ladder: approving and finalising also need the
 * `configure` capability and an approver who is not the author, and neither was
 * reflected here. A panel account created with the default `accountant` role — or
 * the only admin on the deployment, approving their own document — got an enabled
 * button, a refusal, and no way to tell which of the two had happened. Both are
 * now shown on the button instead of discovered by clicking it.
 */
const NEXT_STEPS: Record<
  string,
  { to: string; label: string; tone: string; needsApprover?: boolean }[]
> = {
  draft: [{ to: "temporary", label: "ارسال برای تأیید", tone: "border-blue-300 text-blue-700" }],
  temporary: [
    {
      to: "approved",
      label: "تأیید",
      tone: "border-emerald-300 text-emerald-700",
      needsApprover: true,
    },
    { to: "rejected", label: "رد", tone: "border-red-300 text-red-700", needsApprover: true },
    {
      to: "draft",
      label: "بازگشت به پیش‌نویس",
      tone: "border-zinc-300 text-zinc-600",
      needsApprover: true,
    },
  ],
  approved: [
    {
      to: "posted",
      label: "قطعی‌کردن",
      tone: "border-emerald-400 text-emerald-800 font-medium",
      needsApprover: true,
    },
    {
      to: "temporary",
      label: "بازگشت",
      tone: "border-zinc-300 text-zinc-600",
      needsApprover: true,
    },
  ],
};

/** Steps where the ledger insists the approver is not the author (four-eyes). */
const FOUR_EYES = new Set(["approved", "posted"]);

type Props = {
  entryId: string;
  status: string;
  /** Whether the viewer holds `configure`, which the approval half of the ladder needs. */
  canConfigure: boolean;
  /** Whether the viewer wrote this document, which the four-eyes rule refuses. */
  isAuthor: boolean;
};

export function EntryWorkflowButtons({ entryId, status, canConfigure, isAuthor }: Props) {
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

  /** Why this step is unavailable to this person, or null when it is available. */
  const blockedBecause = (step: (typeof steps)[number]): string | null => {
    if (step.needsApprover && !canConfigure) {
      return "این مرحله دسترسی «مدیر مالی» می‌خواهد و حساب شما «حسابدار» است.";
    }
    if (FOUR_EYES.has(step.to) && isAuthor) {
      return "سند باید توسط شخصی غیر از ثبت‌کنندهٔ آن تأیید شود.";
    }
    return null;
  };

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {steps.map((step) => {
          const blocked = blockedBecause(step);

          if (blocked) {
            return (
              <button
                key={step.to}
                type="button"
                disabled
                title={blocked}
                className={`cursor-not-allowed rounded border px-2 py-1 text-xs opacity-40 ${step.tone}`}
              >
                {step.label}
              </button>
            );
          }

          return (
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
          );
        })}

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

      {steps.some((step) => blockedBecause(step)) && (
        <p className="text-muted-foreground max-w-56 text-[11px]">
          {steps.map(blockedBecause).find(Boolean)}
        </p>
      )}

      {error && <p className="max-w-56 text-xs text-red-600">{error}</p>}
    </div>
  );
}
