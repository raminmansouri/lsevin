import Image from "next/image";
import { ArrowLeft, BedDouble, Dumbbell, Search, Sparkles, Stethoscope } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import type { HomeCategory } from "@/features/home/api/server/get-home-page";
import { resolveMediaUrl } from "@/features/service-providers/lib/media-url";
import { Link } from "@/i18n/navigation";

import { AnimatedWords, CountUp, Magnetic, PointerParallax, Reveal } from "../components/motion";

const CHIPS = [
  { key: "surgery", icon: Stethoscope },
  { key: "beauty", icon: Sparkles },
  { key: "hotels", icon: BedDouble },
  { key: "gyms", icon: Dumbbell },
] as const;

// Three arches: size, position and parallax depth. The middle one is the largest and nearest.
const ARCHES = [
  { className: "start-[34%] top-0 h-[480px] w-[300px]", depth: 1.4, delay: "0s" },
  { className: "start-0 top-[150px] h-[340px] w-[210px]", depth: 0.7, delay: "-2s" },
  { className: "end-0 top-[90px] h-[360px] w-[220px]", depth: 0.9, delay: "-4s" },
];

export async function DesktopHero({
  locale,
  categories,
  specialPackagesCount,
}: {
  locale: string;
  categories: HomeCategory[];
  specialPackagesCount: number;
}) {
  const t = await getTranslations({ locale, namespace: "HomeHero" });
  const tHome = await getTranslations({ locale, namespace: "Home" });
  const tFooter = await getTranslations({ locale, namespace: "Footer" });

  const words = t("title").split(" ");
  const half = Math.ceil(words.length / 2);
  const firstLine = words.slice(0, half).join(" ");
  const secondLine = words.slice(half).join(" ");

  const providerTotal = categories.reduce((sum, category) => sum + category.providerCount, 0);
  const pictures = categories.filter((category) => category.imageUrl).slice(0, 3);
  const ribbon = categories.map((category) => category.label);

  return (
    <PointerParallax depth={34} className="relative">
      <section className="lsd-hero-bg relative min-h-[880px] overflow-hidden text-white">
        <Image
          src="/brand/lsevin-mark-reversed.png"
          alt=""
          aria-hidden="true"
          width={640}
          height={905}
          className="lsd-mark-bg -start-24 top-20 h-[900px] w-auto"
          priority
        />

        <div className="lsd-container relative grid grid-cols-[1.05fr_0.95fr] items-center gap-16 pb-64 pt-44">          {/* Copy */}
          <div className="flex flex-col gap-8">
            <Reveal delay={60}>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#eacb7f]/40 px-4 py-2 text-[13px] font-semibold text-[#eacb7f]">
                <span className="lsd-pulse h-2 w-2 rounded-full bg-[#eacb7f]" />
                {tFooter("tagline")}
              </span>
            </Reveal>

            <div role="heading" aria-level={1} className="text-[64px] font-black leading-[1.25] tracking-tight">
              <AnimatedWords text={firstLine} />
              <br />
              <span className="lsd-gold-text">
                <AnimatedWords text={secondLine} startIndex={half} />
              </span>
            </div>

            <Reveal delay={500}>
              <p className="max-w-xl text-[19px] leading-9 text-[#c9d6d0]">{t("subtitle")}</p>
            </Reveal>

            <Reveal delay={650}>
              <Link
                href="/n/app/mobile/search"
                className="group flex h-[74px] max-w-2xl items-center gap-4 rounded-full bg-white/95 pe-2.5 ps-7 text-[#56675f] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.6)] ring-1 ring-white/30 transition hover:bg-white"
              >
                <Search size={22} className="shrink-0 text-[#083f30]" />
                <span className="flex-1 truncate text-[17px]">{t("searchPlaceholder")}</span>
                <Magnetic>
                  <span className="lsd-btn lsd-btn-green h-14 px-7">
                    {tHome("hero.button")}
                    <ArrowLeft size={18} className="transition-transform duration-500 group-hover:-translate-x-1 ltr:rotate-180" />
                  </span>
                </Magnetic>
              </Link>
            </Reveal>

            <Reveal delay={800} className="flex flex-wrap gap-3">
              {CHIPS.map(({ key, icon: Icon }) => {
                const label = t(`services.${key}`);
                return (
                  <Link
                    key={key}
                    href={`/n/app/mobile/search-results?q=${encodeURIComponent(label)}`}
                    className="lsd-glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-[#e8efec] transition hover:-translate-y-0.5 hover:border-[#eacb7f]/60 hover:text-[#eacb7f]"
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                );
              })}
            </Reveal>
          </div>

          {/* Three Persian arches with real category pictures */}
          <div className="relative h-[640px]">
            {ARCHES.map((arch, index) => {
              const picture = pictures[index];
              return (
                <div key={index} className={`lsd-depth absolute ${arch.className}`} style={{ ["--d" as string]: arch.depth }}>
                  <Reveal direction="zoom" delay={300 + index * 180} className="h-full w-full">
                    <div className="lsd-float h-full w-full" style={{ animationDelay: arch.delay }}>
                      <div className="lsd-arch-frame h-full w-full">
                        <div className="lsd-arch relative h-full w-full bg-[#0f5a45]">
                          {picture?.imageUrl ? (
                            <ImageWithFallback
                              fill
                              src={resolveMediaUrl(picture.imageUrl)}
                              alt={picture.label}
                              sizes="300px"
                              className="object-cover"
                              fallbackClassName="h-full w-full"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center">
                              <Image src="/brand/lsevin-mark-reversed.png" alt="" width={90} height={127} className="opacity-60" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#062a20]/80 via-transparent to-transparent" />
                          {picture ? (
                            <span className="absolute inset-x-0 bottom-5 text-center text-sm font-semibold text-white">{picture.label}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                </div>
              );
            })}

            <div className="lsd-depth absolute -start-6 bottom-6" style={{ ["--d" as string]: 1.8 }}>
              <Reveal delay={1000} className="lsd-glass rounded-3xl px-6 py-4">
                <p className="text-3xl font-black text-[#eacb7f]">
                  <CountUp value={providerTotal} locale={locale} />+
                </p>
                <p className="mt-1 text-sm text-[#dce7e2]">{tHome("trusted.title")}</p>
              </Reveal>
            </div>

            {specialPackagesCount > 0 ? (
              <div className="lsd-depth absolute end-4 top-[470px]" style={{ ["--d" as string]: 2.2 }}>
                <Reveal delay={1150} className="lsd-glass rounded-3xl px-6 py-4">
                  <p className="text-3xl font-black text-white">
                    <CountUp value={specialPackagesCount} locale={locale} />
                  </p>
                  <p className="mt-1 text-sm text-[#dce7e2]">{tHome("premiumPackages.title")}</p>
                </Reveal>
              </div>
            ) : null}
          </div>
        </div>

        {/* Endless ribbon of categories */}
        {ribbon.length ? (
          <div className="lsd-marquee-mask absolute inset-x-0 bottom-32 overflow-hidden border-y border-[#eacb7f]/15 py-5" aria-hidden="true">
            <div className="lsd-marquee gap-10 text-lg text-[#eacb7f]/70">
              {[...ribbon, ...ribbon, ...ribbon, ...ribbon].map((label, index) => (
                <span key={index} className="flex shrink-0 items-center gap-10">
                  {label}
                  <span className="text-[#eacb7f]/40">✦</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="absolute bottom-56 start-1/2 -translate-x-1/2" aria-hidden="true">
          <div className="lsd-scroll-cue" />
        </div>
      </section>
    </PointerParallax>
  );
}