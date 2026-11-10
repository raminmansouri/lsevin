"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2, Video } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import type { BookingSource } from "../patient-booking-types";
import { getProviderVideoOfferAction, type ProviderVideoOffer } from "../server/provider-consultation";
import { ConsultationStep } from "./consultation-step";

export type ProviderVideoOfferTarget = {
  providerId?: string | null;
  serviceId?: string | null;
  staffId?: string | null;
  source: Exclude<BookingSource, "home_card" | "doctors_page">;
};

/**
 * Whether the provider behind a page (or a service, or a specialist) gives paid video consultation,
 * and where booking it starts. `loading` stays true until the answer is in; without any id there
 * is nothing to ask and the answer is "no" straight away.
 */
export function useProviderVideoOffer({ providerId, serviceId, staffId, source }: ProviderVideoOfferTarget) {
  const asks = Boolean(providerId || serviceId);
  const [state, setState] = useState<{ key: string; offer: ProviderVideoOffer | null } | null>(null);
  const key = [providerId, serviceId, staffId, source].join("|");

  useEffect(() => {
    if (!asks) return;
    let live = true;
    getProviderVideoOfferAction({ providerId, serviceId, staffId, source })
      .then((result) => live && setState({ key, offer: result.ok ? (result.data ?? null) : null }))
      .catch(() => live && setState({ key, offer: null }));
    return () => {
      live = false;
    };
  }, [asks, key, providerId, serviceId, staffId, source]);

  if (!asks) return { loading: false, offer: null };
  const answered = state?.key === key;
  return { loading: !answered, offer: answered ? state!.offer : null };
}

/** The paid video consultation of a provider: its lengths and prices, and the way into booking it. */
export function ProviderVideoOfferCard({
  offer,
  onContinue,
}: {
  offer: ProviderVideoOffer;
  /** In the booking wizard: carry on with the treatment booking without a consultation. */
  onContinue?: () => void;
}) {
  const t = useTranslations("Consultation");

  return (
    <div className="rounded-3xl border border-[#083f30]/10 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#083f30] text-[#eacb7f]">
          <Video className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900">{t("videoOffer.title")}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{t("videoOffer.subtitle")}</p>
        </div>
      </div>

      {offer.packages.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {offer.packages.map((pkg) => (
            <span
              key={pkg.minutes}
              className="flex items-center gap-1 rounded-lg bg-[#083f30]/5 px-2 py-1 text-xs font-medium text-[#083f30]"
            >
              <Clock className="h-3 w-3" aria-hidden />
              {t("doctorsPage.package", { minutes: pkg.minutes, price: pkg.priceLabel })}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href={offer.href}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#083f30] px-4 text-sm font-bold text-white transition hover:bg-[#0a5a44]"
        >
          <Video className="h-4 w-4" aria-hidden />
          {t("videoOffer.book")}
        </Link>
        {onContinue && (
          <button
            type="button"
            onClick={onContinue}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            {t("videoOffer.continue")}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Step 6 of the booking wizard: the chosen provider's paid video consultation, already set to the
 * chosen service, when the provider gives one; otherwise the free consultation form as before.
 */
export function BookingConsultationStep({
  bookingDraftId,
  providerId,
  serviceId,
  specialistId,
  onContinue,
}: {
  bookingDraftId?: string | null;
  providerId?: string | null;
  serviceId?: string | null;
  specialistId?: string | null;
  onContinue?: () => void;
}) {
  const { loading, offer } = useProviderVideoOffer({ providerId, serviceId, staffId: specialistId, source: "booking" });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#083f30]" aria-hidden />
      </div>
    );
  }
  if (offer) return <ProviderVideoOfferCard offer={offer} onContinue={onContinue} />;
  return <ConsultationStep bookingDraftId={bookingDraftId} onContinue={onContinue} />;
}
