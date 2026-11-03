import Image from "next/image";
import { ArrowLeft, Gift, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { formatMoney } from "@/features/finance/lib/money";
import type { HomeManagedSection } from "@/features/home/api/server/get-home-sections";
import { HomeLexicalDescription } from "@/features/home/components/home-lexical-description";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { SafePriceText } from "@/features/home/components/safe-price-text";
import { getActiveSpecialPackages } from "@/features/special-packages/server/repository";
import { Link } from "@/i18n/navigation";

import { CountUp, Magnetic, Reveal } from "../components/motion";

// Floating gold confetti: fixed positions so server and client render the same.
const CONFETTI = [
  { top: "12%", left: "8%", size: 6, duration: 7 },
  { top: "22%", left: "46%", size: 4, duration: 9 },
  { top: "70%", left: "14%", size: 5, duration: 8 },
  { top: "84%", left: "40%", size: 7, duration: 10 },
  { top: "18%", left: "78%", size: 5, duration: 6 },
  { top: "58%", left: "92%", size: 4, duration: 9 },
  { top: "40%", left: "30%", size: 3, duration: 7 },
  { top: "90%", left: "70%", size: 5, duration: 8 },
  { top: "8%", left: "62%", size: 4, duration: 10 },
  { top: "48%", left: "58%", size: 6, duration: 11 },
];

/** Special packages as luxury gift boxes that unwrap on hover. Hidden like the mobile section when there are none. */
export async function DesktopPackagesSection({
  locale,
  section,
  activeCount,
  selectedCountryCode,
}: {
  locale: string;
  section: HomeManagedSection;
  activeCount: number;
  selectedCountryCode?: string;
}) {
  const usesDefaultHref = !section.buttonHref || section.buttonHref === "/n/app/mobile/packages";
  if (activeCount <= 0 && usesDefaultHref) return null;

  const t = await getTranslations({ locale, namespace: "Home" });
  const packages = (await getActiveSpecialPackages(locale).catch(() => [])).slice(0, 3);
  const href = section.buttonHref || "/n/app/mobile/packages";

  return (
    <section className="relative my-8 overflow-hidden bg-gradient-to-br from-[#0f5a45] via-[#083f30] to-[#062a20] py-20 text-white">
      {CONFETTI.map((dot, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="lsd-confetti absolute rounded-full bg-[#eacb7f]"
          style={{
            top: dot.top,
            left: dot.left,
            width: dot.size,
            height: dot.size,
            opacity: 0.55,
            animationDuration: `${dot.duration}s`,
            animationDelay: `-${index}s`,
          }}
        />
      ))}
      <Image
        src="/brand/lsevin-mark-reversed.png"
        alt=""
        aria-hidden="true"
        width={420}
        height={594}
        className="lsd-mark-bg -end-20 -top-24"
      />

      <div className="lsd-container relative grid grid-cols-[0.8fr_2.2fr] items-center gap-14">
        {/* Copy */}
        <Reveal className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#eacb7f]/40 px-4 py-1.5 text-xs font-bold text-[#eacb7f]">
            <Sparkles size={14} />
            {section.subtitle || t("premiumPackages.subtitle")}
          </span>
          <h2 className="text-[44px] font-black leading-[1.25]">{section.title || t("premiumPackages.title")}</h2>
          <HomeLexicalDescription
            content={section.description}
            className="text-base leading-8 text-white/70 [&_p]:text-white/70"
            fallback={t("premiumPackages.description")}
          />
          {activeCount > 0 ? (
            <p className="flex items-center gap-3">
              <span className="text-6xl font-black text-[#eacb7f]">
                <CountUp value={activeCount} locale={locale} />
              </span>
              <Gift size={30} className="text-[#eacb7f]/70" />
            </p>
          ) : null}
          <div>
            <Magnetic>
              <Link href={href} className="lsd-btn lsd-btn-gold h-14 px-8">
                {section.buttonLabel || t("premiumPackages.button")}
                <ArrowLeft size={18} className="ltr:rotate-180" />
              </Link>
            </Magnetic>
          </div>
        </Reveal>

        {/* Gift boxes */}
        <div className="grid grid-cols-3 gap-6">
          {packages.map((item, index) => {
            const image = resolveHomeMediaUrl(item.imageUrl);
            const hasPrice = item.priceAmount != null && item.priceAmount > 0 && item.currencyCode;
            const saved =
              hasPrice && item.originalPriceAmount && item.originalPriceAmount > item.priceAmount!
                ? Math.round((1 - item.priceAmount! / item.originalPriceAmount) * 100)
                : null;

            return (
              <Reveal key={item.id} delay={index * 140} direction="zoom">
                <Link href={`/n/app/mobile/packages/${item.id}`} className="lsd-gift group relative block h-[480px] overflow-hidden rounded-[32px] bg-[#062a20] shadow-[0_40px_80px_-35px_rgba(0,0,0,0.7)] ring-1 ring-[#eacb7f]/25">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={item.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] group-hover:scale-110" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <Image src="/brand/lsevin-mark-reversed.png" alt="" width={90} height={127} className="opacity-30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#062a20]/90 via-[#062a20]/10 to-[#062a20]/30" />

                  {/* Ribbon and bow */}
                  <span className="lsd-ribbon-v absolute inset-y-0 left-1/2 w-9 -translate-x-1/2 bg-gradient-to-r from-[#c9a55a] via-[#f3dc9f] to-[#c9a55a] shadow-[0_0_20px_rgba(0,0,0,0.25)]" />
                  <span className="lsd-ribbon-h absolute inset-x-0 top-[34%] h-9 bg-gradient-to-b from-[#c9a55a] via-[#f3dc9f] to-[#c9a55a] shadow-[0_0_20px_rgba(0,0,0,0.25)]" />
                  <svg viewBox="0 0 120 70" className="lsd-bow absolute left-1/2 top-[34%] h-[70px] w-[120px] -translate-x-1/2 -translate-y-[38%]" aria-hidden="true">
                    <defs>
                      <linearGradient id={`lsd-bow-${index}`} x1="0" x2="1">
                        <stop offset="0" stopColor="#c9a55a" />
                        <stop offset="0.5" stopColor="#f6e2a8" />
                        <stop offset="1" stopColor="#c9a55a" />
                      </linearGradient>
                    </defs>
                    <path d="M60 35 C 32 2, 2 10, 12 35 C 2 60, 32 68, 60 35 Z" fill={`url(#lsd-bow-${index})`} />
                    <path d="M60 35 C 88 2, 118 10, 108 35 C 118 60, 88 68, 60 35 Z" fill={`url(#lsd-bow-${index})`} />
                    <circle cx="60" cy="35" r="10" fill="#c9a55a" stroke="#f6e2a8" strokeWidth="2" />
                  </svg>

                  {/* The panel that rises when the box opens */}
                  <div className="lsd-gift-panel absolute inset-x-3 bottom-3 rounded-[24px] bg-[#fffaf0] p-6 text-[#0e1a16]">
                    <h3 className="line-clamp-1 text-xl font-black">{item.title}</h3>
                    {item.subtitle ? <p className="mt-1 line-clamp-1 text-sm text-[#8c6b2c]">{item.subtitle}</p> : null}

                    <div className="lsd-gift-extra mt-4 space-y-4">
                      <HomeLexicalDescription
                        content={item.description}
                        className="line-clamp-3 text-sm leading-7 text-[#56675f] [&_p]:text-[#56675f]"
                        fallback=""
                      />
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          {saved ? (
                            <span className="text-xs text-[#8fa79d] line-through">
                              {formatMoney({ amount: item.originalPriceAmount!, currencyCode: item.currencyCode! }, { locale, compact: false })}
                            </span>
                          ) : null}
                          {hasPrice ? (
                            <SafePriceText
                              amount={item.priceAmount!}
                              sourceCurrencyCode={item.currencyCode!}
                              selectedCountryCode={selectedCountryCode}
                              locale={locale}
                              className="block text-xl font-black text-[#083f30]"
                              showSourceWhenConverted
                            />
                          ) : null}
                        </div>
                        {saved ? (
                          <span className="rounded-full bg-[#eacb7f] px-3 py-1 text-xs font-black text-[#062a20]">
                            −{new Intl.NumberFormat(locale).format(saved)}٪
                          </span>
                        ) : null}
                      </div>
                      <span className="lsd-btn lsd-btn-green h-11 w-full text-sm">
                        {t("premiumPackages.button")}
                        <ArrowLeft size={16} className="ltr:rotate-180" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}