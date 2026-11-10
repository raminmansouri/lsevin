"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { getVideoConsultationOfferAction } from "../server/video-offer";
import type { VideoConsultationOffer } from "../types";

/**
 * The consultation packages on offer (20, 45 and 60 minutes), each from the lowest price a
 * bookable doctor asks, in toman for Iranian visitors and dollars for everyone else. Used by the
 * home page teasers. Read on the client because the home page is static; until it loads, or
 * when no doctor can be booked, the teaser's own subtitle shows instead.
 */
export function ConsultationPackageChips({
  fallback,
  className = "",
  chipClassName = "px-2 py-0.5",
}: {
  fallback: ReactNode;
  className?: string;
  chipClassName?: string;
}) {
  const t = useTranslations("Consultation.homeTeaser");
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

  if (!offer?.enabled || offer.packages.length === 0) return <>{fallback}</>;

  return (
    <span className={`flex gap-1.5 ${className}`}>
      {offer.packages.map((pkg) => (
        <span key={pkg.minutes} className={`whitespace-nowrap rounded-full ${chipClassName}`}>
          {t("packageChip", { minutes: pkg.minutes, price: pkg.priceLabel })}
        </span>
      ))}
    </span>
  );
}
