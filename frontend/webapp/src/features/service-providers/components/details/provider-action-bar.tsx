"use client";

import { Phone } from "lucide-react";

import { ConsultationCtaButton } from "@/features/consultation/components/consultation-cta-button";

export function ProviderActionBar({
  categoryName,
  consultationLabel,
  contactLabel,
  servicesLabel,
  onContact,
  onServices,
}: {
  categoryName: string;
  consultationLabel: string;
  contactLabel: string;
  servicesLabel: string;
  onContact: () => void;
  onServices: () => void;
}) {
  return (
    <div className="safe-area-bottom fixed inset-x-0 bottom-20 z-40 rounded-t-3xl border-t border-gray-200 bg-white px-5 py-4 shadow-2xl">
      <div className="mx-auto grid max-w-5xl grid-cols-[3rem_minmax(0,1fr)] gap-2 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)]">
        <button
          onClick={onContact}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-900 hover:bg-gray-200"
          type="button"
          aria-label={contactLabel}
        >
          <Phone size={18} />
        </button>
        <ConsultationCtaButton
          categoryName={categoryName}
          label={consultationLabel}
          className="flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-2xl border border-[#083f30]/20 bg-[#083f30]/5 px-3 py-3 text-sm font-bold text-[#083f30] hover:bg-[#083f30]/10 [&_span]:whitespace-nowrap"
        />
        <button
          onClick={onServices}
          className="col-span-2 min-h-12 min-w-0 rounded-2xl bg-gradient-to-r from-[#083f30] to-[#0a5a44] px-4 py-3 font-bold text-white hover:shadow-xl sm:col-span-1"
          type="button"
        >
          {servicesLabel}
        </button>
      </div>
    </div>
  );
}
