"use client";

import { Check, Video } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { Magnetic, Reveal } from "../components/motion";

const CONSULTATION_HREF = "/n/app/mobile/consultation/doctors";

/** A champagne strip under the assistant teaser, introducing video consultations with a doctor. */
export function DesktopConsultationTeaser() {
  const t = useTranslations("Consultation.homeTeaser");
  const perks = [t("perks.secure"), t("perks.noInstall"), t("perks.verified")];

  return (
    <section className="lsd-container -mt-4 pb-8">
      <Reveal delay={120}>
        <div className="lsd-champagne-bg flex h-[88px] items-center gap-6 rounded-full border border-[#eacb7f] pe-3 ps-4 text-[#0e1a16] shadow-[0_24px_60px_-34px_rgba(140,107,44,0.55)]">
          {/* A small "video window" */}
          <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#083f30] text-[#eacb7f] ring-4 ring-white/60">
            <Video size={22} />
            <span className="absolute -end-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-white">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#22a06b]" />
            </span>
          </span>

          <div className="min-w-0 shrink-0">
            <p className="flex items-center gap-2 text-[11px] font-bold text-[#0f5a45]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22a06b]" />
              {t("live")}
            </p>
            <p className="text-lg font-black">{t("title")}</p>
            <p className="max-w-[320px] truncate text-sm text-[#6b6150]">{t("subtitle")}</p>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            {perks.map((perk) => (
              <span key={perk} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/60 px-4 py-2 text-sm text-[#3d4b45] ring-1 ring-[#eadfc6]">
                <Check size={14} className="text-[#0f5a45]" />
                {perk}
              </span>
            ))}
          </div>

          <Magnetic>
            <Link href={CONSULTATION_HREF} className="lsd-btn lsd-btn-green h-14 shrink-0 px-6 text-sm">
              <Video size={17} />
              {t("cta")}
            </Link>
          </Magnetic>
        </div>
      </Reveal>
    </section>
  );
}