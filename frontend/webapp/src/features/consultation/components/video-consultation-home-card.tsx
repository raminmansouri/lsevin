"use client";

import { useEffect, useState } from "react";
import { Stethoscope } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { getVideoConsultationOfferAction } from "../server/video-offer";
import type { VideoConsultationOffer } from "../types";

/**
 * "Consult a doctor before treatment" card under the home search box. Shows the
 * fixed length and price an admin set, and opens the consultation doctors page. Renders
 * nothing until the offer loads, and nothing at all while the admin has it off.
 */
export function VideoConsultationHomeCard() {
  const t = useTranslations("Consultation.homeCard");
  const [offer, setOffer] = useState<VideoConsultationOffer | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVideoConsultationOfferAction()
      .then((result) => {
        if (!cancelled) setOffer(result);
      })
      .catch(() => {
        if (!cancelled) setOffer(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!offer?.enabled) return null;

  return (
    <div className="px-5 pb-5">
      <Link
        href="/n/app/mobile/consultation/doctors"
        className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-start shadow-[0_4px_14px_rgba(0,0,0,0.05)] ring-1 ring-[#083f30]/8 transition active:scale-[0.99]"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#083f30] text-[#eacb7f]">
          <Stethoscope className="h-6 w-6" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-gray-900">{t("title")}</span>
          <span className="mt-0.5 block text-xs text-gray-500">
            {t("details", { minutes: offer.durationMinutes, price: offer.priceLabel })}
          </span>
        </span>
        <span className="shrink-0 rounded-xl bg-[#083f30] px-3.5 py-2 text-xs font-bold text-white">
          {t("cta")}
        </span>
      </Link>
    </div>
  );
}
