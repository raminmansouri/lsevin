"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { reviewApiChangeAction, reviewApiProductAction } from "../actions";

/** Approve, or reject with a reason the seller sees through the API (review.note). */
export function ApiReviewDecision({ kind, targetId, label }: { kind: "product" | "change"; targetId: string; label: string }) {
  const t = useTranslations("ShopAdmin.apiReview");
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const decide = (decision: "approve" | "reject") =>
    startTransition(async () => {
      setError(null);
      const action = kind === "product" ? reviewApiProductAction : reviewApiChangeAction;
      const result = await action({ targetId, decision, note: decision === "reject" ? note : null });
      if (!result.ok) setError("message" in result ? result.message : t("error"));
    });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          aria-label={`${t("approve")}: ${label}`}
          onClick={() => decide("approve")}
          className="rounded-lg bg-[#083f30] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {t("approve")}
        </button>
        <button
          type="button"
          disabled={pending}
          aria-expanded={rejecting}
          aria-label={`${t("reject")}: ${label}`}
          onClick={() => setRejecting((value) => !value)}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
        >
          {t("reject")}
        </button>
      </div>
      {rejecting ? (
        <div className="space-y-2">
          <label className="block text-xs text-gray-600">
            {t("reason")}
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1000}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={pending || !note.trim()}
            onClick={() => decide("reject")}
            className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {t("confirmReject")}
          </button>
        </div>
      ) : null}
      {error ? <div role="alert" className="text-xs text-red-700">{error}</div> : null}
    </div>
  );
}
