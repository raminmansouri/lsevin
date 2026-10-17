"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

import type { CascadeLoss } from "../../lib/cascade";
import { BookingDialog } from "./BookingDialog";

type Props = {
  open: boolean;
  losing: CascadeLoss[];
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Raised only when a change would actually destroy work — `losing` is computed by
 * cascadeImpact() and an empty result means no sheet. Friction where it is earned,
 * nowhere else.
 */
export function CascadeConfirmSheet({
  open,
  losing,
  onConfirm,
  onCancel,
}: Props) {
  const tBooking = useTranslations("Booking");
  if (!open) return null;

  return (
    <BookingDialog
      open={open}
      title={tBooking("changeWillResetTitle")}
      onClose={onCancel}
    >
      <div className="relative w-full rounded-t-[28px] bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-[28px]">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">
              {tBooking("changeWillResetTitle")}
            </div>
            <div className="text-xs text-slate-500">
              {tBooking("changeWillResetSubtitle")}
            </div>
          </div>
        </div>

        <ul className="space-y-2 rounded-2xl bg-slate-50 p-4">
          {losing.map((item, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-slate-500">{item.label}</span>
              <span className="min-w-0 font-semibold break-words text-slate-900 line-through">
                {item.value}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-[#083f30] px-5 py-3 font-bold text-white shadow-lg"
          >
            {tBooking("changeAnyway")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700"
          >
            {tBooking("keepCurrent")}
          </button>
        </div>
      </div>
    </BookingDialog>
  );
}
