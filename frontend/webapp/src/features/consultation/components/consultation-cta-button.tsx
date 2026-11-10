"use client";

import { useState } from "react";
import { PhoneCall, Video } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/app/[locale]/n/app/components/ui/dialog";

import { Link } from "@/i18n/navigation";

import { ConsultationStep } from "./consultation-step";
import { useProviderVideoOffer, type ProviderVideoOfferTarget } from "./provider-video-offer";

type Props = {
  /** The provider/staff/service/product name this request is about. */
  categoryName?: string;
  /** e.g. "مشاوره قبل از رزرو" on provider/staff/service pages, "مشاوره قبل از خرید" on product pages. */
  label: string;
  className?: string;
  /**
   * The provider behind the page (directly, through a service, or with a specialist). When it gives
   * paid video consultation, the button opens that booking instead of the free form, with the
   * service already chosen. Left out on pages that are not about a provider (shop products).
   */
  videoOffer?: ProviderVideoOfferTarget;
};

/**
 * Entry point for the free-consultation lead form (features/consultation)
 * from a page that has no booking draft at all -- ConsultationStep's
 * bookingDraftId is optional by design, so the exact same form used inside
 * the booking wizard works standalone here. `onContinue` is deliberately
 * left unset: that button renders as "continue booking" (success.continue),
 * which makes no sense when there is no booking in progress.
 */
export function ConsultationCtaButton({ categoryName, label, className, videoOffer }: Props) {
  const t = useTranslations("Consultation");
  const [open, setOpen] = useState(false);
  const { offer } = useProviderVideoOffer(videoOffer ?? { source: "provider" });
  const buttonClass =
    className ??
    "flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#083f30]/20 bg-[#083f30]/5 font-bold text-[#083f30] transition-all hover:bg-[#083f30]/10 active:scale-95";

  if (offer) {
    return (
      <Link href={offer.href} className={buttonClass}>
        <Video size={18} className="shrink-0" /> <span>{t("cta.video")}</span>
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass}
      >
        <PhoneCall size={18} className="shrink-0" /> <span>{label}</span>
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
