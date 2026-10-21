import Image from "next/image";
import { ArrowLeft, Award, Crown, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { HomeManagedSection } from "@/features/home/api/server/get-home-sections";
import { HomeLexicalDescription } from "@/features/home/components/home-lexical-description";
import { Link } from "@/i18n/navigation";

import { HoloCard, Magnetic, Reveal } from "../components/motion";

/** Reads a label that may be plain text or a { "fa-IR": …, "en-US": … } object (same rule as the mobile section). */
function localizedText(value: unknown, locale: string): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const record = value as Record<string, unknown>;
  const short = locale.split("-")[0].toLowerCase();
  const full = { fa: "fa-IR", en: "en-US", ar: "ar-SA", tr: "tr-TR" }[short] ?? locale;
  return String(record[full] || record[short] || record["en-US"] || record.en || Object.values(record)[0] || "");
}

/** Loyalty club: a black-and-gold membership card that tilts in 3D, with gold benefit medallions. */
export async function DesktopLoyaltySection({ locale, section }: { locale: string; section: HomeManagedSection }) {
  const t = await getTranslations({ locale, namespace: "Home" });

  const rawBenefits = (section.metadata as { benefits?: unknown }).benefits;
  const managed = Array.isArray(rawBenefits) ? rawBenefits.slice(0, 3) : [];
  const fallback = [
    { label: t("loyaltyClub.cashback"), value: "5%", icon: "" },
    { label: t("loyaltyClub.rewards"), value: "", icon: "Award" },
    { label: t("loyaltyClub.vipAccess"), value: "", icon: "Star" },
  ];
  const benefits = (managed.length ? managed : fallback).map((item, index) => {
    const benefit = item as Record<string, unknown>;
    return {
      label: localizedText(benefit.label, locale) || t("loyaltyClub.benefit", { index: index + 1 }),
      value: typeof benefit.value === "string" ? benefit.value : "",
      icon: String(benefit.icon || ""),
    };
  });

  return (
    <section className="lsd-container py-28">
      <div className="grid grid-cols-[1.05fr_0.95fr] items-center gap-16">
        {/* Copy and medallions */}
        <Reveal className="flex flex-col gap-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#062a20] px-4 py-1.5 text-xs font-bold tracking-wide text-[#eacb7f]">
            <Crown size={14} />
            L SEVIN CLUB
          </span>
          <h2 className="text-5xl font-black leading-[1.25] text-[#0e1a16]">{section.title || t("loyaltyClub.title")}</h2>
          <HomeLexicalDescription
            content={section.description}
            className="max-w-xl text-lg leading-9 text-[#56675f] [&_p]:text-[#56675f]"
            fallback={t("loyaltyClub.description")}
          />

          <div className="mt-2 flex gap-8">
            {benefits.map((benefit, index) => (
              <Reveal key={`${benefit.label}-${index}`} delay={250 + index * 120} className="flex w-28 flex-col items-center gap-3 text-center">
                <span className="lsd-medal-ring grid h-24 w-24 place-items-center rounded-full p-[3px] shadow-[0_18px_40px_-18px_rgba(140,107,44,0.8)]">
                  <span className="grid h-full w-full place-items-center rounded-full bg-[#062a20] text-[#eacb7f]">
                    {benefit.value ? (
                      <span className="text-2xl font-black">{benefit.value}</span>
                    ) : benefit.icon === "Star" ? (
                      <Star size={30} className="fill-[#eacb7f]" />
                    ) : (
                      <Award size={30} />
                    )}
                  </span>
                </span>
                <span className="text-sm font-bold leading-snug text-[#0e1a16]">{benefit.label}</span>
              </Reveal>
            ))}
          </div>

          <div className="mt-2">
            <Magnetic>
              <Link href={section.buttonHref || "/n/app/mobile/profile/rewards"} className="lsd-btn lsd-btn-green h-14 px-8">
                {section.buttonLabel || t("loyaltyClub.button")}
                <ArrowLeft size={18} className="ltr:rotate-180" />
              </Link>
            </Magnetic>
          </div>
        </Reveal>

        {/* The membership card */}
        <Reveal direction="zoom" delay={200} className="relative grid h-[520px] place-items-center">
          <svg viewBox="0 0 200 200" className="lsd-rotate absolute h-[500px] w-[500px]" aria-hidden="true">
            <circle cx="100" cy="100" r="96" fill="none" stroke="#c9a55a" strokeWidth="0.5" strokeDasharray="1 5" />
            <circle cx="100" cy="100" r="78" fill="none" stroke="#c9a55a" strokeWidth="0.4" strokeDasharray="6 10" opacity="0.6" />
          </svg>
          <div className="absolute h-72 w-72 rounded-full bg-[#eacb7f]/30 blur-3xl" aria-hidden="true" />

          <div className="lsd-float">
            <HoloCard className="relative h-[290px] w-[460px] overflow-hidden rounded-[26px] shadow-[0_50px_100px_-30px_rgba(6,42,32,0.85)] ring-1 ring-[#eacb7f]/40">
              <div className="lsd-guilloche absolute inset-0" />
              <div className="lsd-holo-sheen absolute inset-0" />
              <span className="lsd-foil absolute inset-y-0 right-10 w-2 opacity-80" aria-hidden="true" />

              {/* A real card reads left to right, whatever the page language */}
              <div dir="ltr" className="relative flex h-full flex-col justify-between p-8 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Image src="/brand/lsevin-wordmark.png" alt="L SEVIN" width={110} height={30} />
                    <span className="text-xs font-bold tracking-[0.5em] text-[#eacb7f]">CLUB</span>
                  </div>
                  <Image src="/brand/lsevin-mark-reversed.png" alt="" width={34} height={48} />
                </div>

                <span className="relative h-10 w-14 overflow-hidden rounded-md bg-gradient-to-br from-[#f6e2a8] via-[#c9a55a] to-[#8c6b2c]" aria-hidden="true">
                  <span className="absolute inset-x-0 top-1/2 h-px bg-[#6b5121]/60" />
                  <span className="absolute inset-y-0 left-1/3 w-px bg-[#6b5121]/60" />
                  <span className="absolute inset-y-0 left-2/3 w-px bg-[#6b5121]/60" />
                </span>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-mono text-lg tracking-[0.25em] text-white/85">•••• •••• •••• 2026</p>
                    <p className="mt-2 text-[10px] tracking-[0.4em] text-white/50">MEMBER</p>
                  </div>
                  <p className="text-sm font-black tracking-[0.3em] text-[#eacb7f]">PRIVILEGE</p>
                </div>
              </div>
            </HoloCard>
          </div>
        </Reveal>
      </div>
    </section>
  );
}