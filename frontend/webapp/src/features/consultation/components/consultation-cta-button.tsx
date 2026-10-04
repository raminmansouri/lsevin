"use client";

import { useState } from "react";
import { PhoneCall } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/app/[locale]/n/app/components/ui/dialog";

import { ConsultationStep } from "./consultation-step";

type Props = {
  /** The provider/staff/service/product name this request is about. */
  categoryName?: string;
  /** e.g. "مشاوره قبل از رزرو" on provider/staff/service pages, "مشاوره قبل از خرید" on product pages. */
  label: string;
  className?: string;
};

/**
 * Entry point for the free-consultation lead form (features/consultation)
 * from a page that has no booking draft at all -- ConsultationStep's
 * bookingDraftId is optional by design, so the exact same form used inside
 * the booking wizard works standalone here. `onContinue` is deliberately
 * left unset: that button renders as "continue booking" (success.continue),
 * which makes no sense when there is no booking in progress.
 */
export function ConsultationCtaButton({ categoryName, label, className }: Props) {
  const t = useTranslations("Consultation");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#083f30]/20 bg-[#083f30]/5 font-bold text-[#083f30] transition-all hover:bg-[#083f30]/10 active:scale-95"
        }
      >
        <PhoneCall size={18} /> {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-0 bg-transparent p-0 shadow-none sm:max-w-lg">
          <DialogTitle className="sr-only">{t("step.title")}</DialogTitle>
          <ConsultationStep defaultCategoryName={categoryName} />
        </DialogContent>
      </Dialog>
    </>
  );
}
