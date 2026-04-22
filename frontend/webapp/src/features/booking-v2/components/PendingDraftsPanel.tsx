"use client";

import { Clock3, FileClock } from "lucide-react";

interface DraftSummary {
  id: string;
  providerId: string | null;
  serviceId: string | null;
  specialistId: string | null;
  selectedDate: string | null;
  currentStep: number;
  totalAmount: number | string;
  currency: string;
  status: string;
  updatedAt: string;
}

export function PendingDraftsPanel({
  drafts,
  onContinue,
}: {
  drafts: DraftSummary[];
  onContinue: (draftId: string) => void;
}) {
  if (!drafts.length) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <FileClock className="h-5 w-5 text-amber-700" />
        <h2 className="text-sm font-bold text-amber-900">Pending bookings</h2>
      </div>

      <div className="space-y-3">
        {drafts.map((draft) => (
          <button
            type="button"
            key={draft.id}
            onClick={() => onContinue(draft.id)}
            className="w-full rounded-xl border border-amber-200 bg-white p-3 text-left transition hover:border-amber-300 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Draft #{draft.id.slice(0, 8)}</div>
                <div className="mt-1 text-xs text-slate-600">Step {draft.currentStep} • {draft.selectedDate || "No date yet"}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">{draft.currency} {draft.totalAmount}</div>
                <div className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {new Date(draft.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
