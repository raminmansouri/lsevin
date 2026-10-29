import Image from "next/image";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { HomeHeroOffer } from "@/features/home/api/server/get-home-page";
import type { HomeManagedSection } from "@/features/home/api/server/get-home-sections";
import { HomeLexicalDescription } from "@/features/home/components/home-lexical-description";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { Link } from "@/i18n/navigation";

import { AnimatedWords, Magnetic, Reveal, ScrollParallax } from "../components/motion";

/** Desktop "feature" banner: same content and priority as the mobile hero card (admin section, then offer, then defaults). */
export async function DesktopFeatureBanner({
  locale,
  offer,
  section,
}: {
  locale: string;
  offer: HomeHeroOffer | null;
  section: HomeManagedSection;
}) {
  const t = await getTranslations({ locale, namespace: "Home" });

  const mediaUrl = resolveHomeMediaUrl(section.imageUrl || offer?.imageUrl);
  const href = section.buttonHref || (offer?.serviceId ? `/n/app/mobile/service/${offer.serviceId}` : "/n/app/mobile/offers");
  const title = section.title || offer?.title || t("hero.title");
  const badge = section.badge || (offer?.discountPercent ? t("hero.limitedTime") : t("hero.featured"));
  const discount = offer?.discountPercent ? Math.round(Number(offer.discountPercent)) : null;

  return (
    <section className="lsd-container py-10">
      <Reveal>
        <div className="group relative grid min-h-[380px] grid-cols-[0.95fr_1.05fr] overflow-hidden rounded-[40px] bg-[#062a20] text-white shadow-[0_50px_120px_-50px_rgba(6,42,32,0.7)]">
          {/* Giant outlined word behind everything, like a magazine cover */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-8 start-10 select-none whitespace-nowrap text-[130px] font-blackleading-none text-transparent [-webkit-text-stroke:1px_rgba(234,203,127,0.14)]"
          >
            {badge}
          </span>
          <Image
            src="/brand/lsevin-mark-reversed.png"
            alt=""
            aria-hidden="true"
            width={260}
            height={368}
            className="lsd-mark-bg -top-16 start-1/3"
          />

          {/* Copy */}
          <div className="relative z-10 flex flex-col justify-center gap-4 px-14 py-10">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#eacb7f]/50 px-4 py-1.5 text-xs font-bold text-[#eacb7f]">
              <Sparkles size={14} />
              {badge}
            </span>
            <h2 className="text-[38px] font-black leading-[1.3]">
              <AnimatedWords text={title} />
            </h2>
            <HomeLexicalDescription
              content={section.description || offer?.subtitle}
              className="line-clamp-3 max-w-xl text-base leading-8 text-white/75 [&_p]:text-white/75"
              fallback={t("hero.description")}
            />
            <div className="mt-2">
              <Magnetic>
                <Link href={href} className="lsd-btn lsd-btn-gold h-12 px-7 text-sm">
                  {section.buttonLabel || t("hero.button")}
                  <ArrowLeft size={18} className="ltr:rotate-180" />
                </Link>
              </Magnetic>
            </div>
          </div>


          <div className="relative p-5">
            <div className="relative h-full overflow-hidden rounded-[26px] bg-[#0f5a45]">
              {mediaUrl ? (
                <ScrollParallax className="absolute inset-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl} alt={title} className="h-full w-full object-cover" />
                </ScrollParallax>
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <Image src="/brand/lsevin-mark-reversed.png" alt="" width={140} height={198} className="opacity-40" />
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#062a20]/50 to-transparent" />
            </div>

            <span className="lsd-corner lsd-corner-ts start-4 top-4 rounded-ss-2xl border-s-2 border-t-2" />
            <span className="lsd-corner lsd-corner-te end-4 top-4 rounded-se-2xl border-e-2 border-t-2" />
            <span className="lsd-corner lsd-corner-bs bottom-4 start-4 rounded-es-2xl border-b-2 border-s-2" />
            <span className="lsd-corner lsd-corner-be bottom-4 end-4 rounded-ee-2xl border-b-2 border-e-2" />
          </div>

          {/* Rotating gold seal on the seam between copy and media */}
          <div className="absolute start-[47.5%] top-1/2 z-20 grid h-28 w-28 -translate-y-1/2 place-items-center rtl:translate-x-1/2 ltr:-translate-x-1/2">
            <svg viewBox="0 0 200 200" className="lsd-rotate absolute inset-0 h-full w-full" aria-hidden="true">
              <defs>
                <path id="lsd-seal-path" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
              </defs>
              <circle cx="100" cy="100" r="98" fill="#062a20" stroke="rgba(234,203,127,0.35)" />
              <text fill="#eacb7f" fontSize="16" fontWeight="700" letterSpacing="3">
                <textPath href="#lsd-seal-path">L SEVIN ✦ EXCLUSIVE ✦ L SEVIN ✦ EXCLUSIVE ✦</textPath>
              </text>
            </svg>
            <div className="lsd-pulse relative grid h-16 w-16 place-items-center rounded-full bg-[#eacb7f] text-[#062a20] shadow-[0_15px_40px_-10px_rgba(234,203,127,0.8)]">
              {discount ? (
                <span className="text-xl font-black">
                  {new Intl.NumberFormat(locale).format(discount)}٪
                </span>
              ) : (
                <Sparkles size={22} />
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}