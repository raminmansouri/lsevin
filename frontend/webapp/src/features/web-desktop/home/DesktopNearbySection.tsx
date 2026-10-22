import Image from "next/image";
import { ArrowLeft, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { formatHomeSectionText, type HomeManagedSection } from "@/features/home/api/server/get-home-sections";
import { Link } from "@/i18n/navigation";

import { CountUp, Magnetic, Reveal } from "../components/motion";

// Where the pins land on the map (percent of the map box) and when.
const PINS = [
  { top: "24%", start: "30%", delay: 300 },
  { top: "36%", start: "68%", delay: 500 },
  { top: "62%", start: "22%", delay: 700 },
  { top: "70%", start: "60%", delay: 900 },
  { top: "18%", start: "54%", delay: 1100 },
  { top: "48%", start: "84%", delay: 1300 },
];

/** "Nearby": a living art map with a radar sweep and dropping pins, leading to the map page. */
export async function DesktopNearbySection({
  locale,
  section,
  nearbyProviderCount,
  countryCode,
  cityCode,
}: {
  locale: string;
  section: HomeManagedSection;
  nearbyProviderCount: number;
  countryCode?: string | null;
  cityCode?: string | null;
}) {
  const t = await getTranslations({ locale, namespace: "Home" });
  const tFooter = await getTranslations({ locale, namespace: "Footer" });

  // Same wording as the mobile section.
  const scope = countryCode || cityCode ? t("exploreNearby.selectedAreaScope") : t("exploreNearby.readyScope");
  const count = nearbyProviderCount.toLocaleString(locale);
  const subtitle =
    formatHomeSectionText(section.subtitle, { count, scope }) || t("exploreNearby.subtitle", { count, scope });
  const href = section.buttonHref || "/n/app/mobile/map-discovery";

  return (
    <section className="lsd-container py-12">
      <Reveal>
        <div className="grid min-h-[540px] grid-cols-[0.85fr_1.15fr] overflow-hidden rounded-[40px] bg-[#062a20] text-white shadow-[0_50px_120px_-50px_rgba(6,42,32,0.7)]">
          {/* Copy */}
          <div className="relative flex flex-col justify-center gap-6 p-16">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#eacb7f]/40 px-4 py-1.5 text-xs font-bold text-[#eacb7f]">
              <MapPin size={14} />
              {t("exploreNearby.readyScope")}
            </span>
            <h2 className="text-[44px] font-black leading-[1.25]">{section.title || t("exploreNearby.title")}</h2>
            <p className="max-w-md text-lg leading-8 text-white/70">{subtitle}</p>

            {nearbyProviderCount > 0 ? (
              <p className="text-6xl font-black text-[#eacb7f]">
                <CountUp value={nearbyProviderCount} locale={locale} />+
              </p>
            ) : null}

            <div className="mt-2">
              <Magnetic>
                <Link href={href} className="lsd-btn lsd-btn-gold h-14 px-8">
                  {section.buttonLabel || tFooter("cta")}
                  <ArrowLeft size={18} className="ltr:rotate-180" />
                </Link>
              </Magnetic>
            </div>
          </div>

          {/* Art map */}
          <Link href={href} aria-label={section.title || t("exploreNearby.title")} className="lsd-map-bg relative block overflow-hidden">
            {/* A winding gold river */}
            <svg viewBox="0 0 600 540" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <path
                d="M-20,420 C120,360 160,250 280,270 S460,380 620,220"
                fill="none"
                stroke="rgba(234,203,127,0.28)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M-20,420 C120,360 160,250 280,270 S460,380 620,220"
                fill="none"
                stroke="rgba(234,203,127,0.5)"
                strokeWidth="1.5"
                strokeDasharray="4 8"
              />
            </svg>

            {/* Concentric rings, radar sweep and the logo as a compass */}
            <div className="absolute inset-0 grid place-items-center">
              {[160, 280, 400].map((size) => (
                <span
                  key={size}
                  className="absolute rounded-full border border-dashed border-[#eacb7f]/20"
                  style={{ width: size, height: size }}
                />
              ))}
              <span className="lsd-radar absolute h-[400px] w-[400px] rounded-full" />
              <span className="lsd-glass relative grid h-24 w-24 place-items-center rounded-full">
                <Image src="/brand/lsevin-mark-reversed.png" alt="" width={40} height={57} />
              </span>
            </div>

            {/* Pins */}
            {PINS.map((pin, index) => (
              <span
                key={index}
                className="absolute"
                style={{ top: pin.top, insetInlineStart: pin.start, ["--pin-delay" as string]: `${pin.delay}ms` }}
              >
                <span className="lsd-ping absolute start-1/2 top-full h-5 w-5 -translate-y-1/2 rounded-full bg-[#eacb7f]/40 rtl:translate-x-1/2 ltr:-translate-x-1/2" />
                <span className="lsd-pin relative block">
                  {/* Physical bottom-right corner, rotated 45deg: the tip points straight down in RTL and LTR. */}
                  <span className="grid h-10 w-10 rotate-45 place-items-center rounded-full rounded-br-none bg-[#eacb7f] shadow-[0_10px_25px_-8px_rgba(234,203,127,0.9)]">
                    <span className="h-3 w-3 rounded-full bg-[#062a20]" />
                  </span>
                </span>
              </span>
            ))}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}