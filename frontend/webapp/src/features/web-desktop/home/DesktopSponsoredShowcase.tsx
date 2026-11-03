"use client";

import Image from "next/image";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import type { SponsoredSlide } from "@/features/home/api/server/get-sponsored-slides";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { Link } from "@/i18n/navigation";

import { AnimatedWords, Magnetic } from "../components/motion";

type Labels = { sponsored: string; button: string; previous: string; next: string };

function SlideLink({ slide, className, children }: { slide: SponsoredSlide; className: string; children: ReactNode }) {
  const href = slide.link ?? "#";
  const target = slide.opensInNewTab ? "_blank" : undefined;
  const rel = slide.opensInNewTab ? "noopener noreferrer" : undefined;
  // External links are plain anchors; internal ones keep the locale.
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target={target} rel={rel} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} target={target} rel={rel} className={className}>
      {children}
    </Link>
  );
}

/** Desktop sponsored slider: a wide card with an arched media side, cinematic transitions and gold progress bars. */
export function DesktopSponsoredShowcase({
  slides,
  labels,
  overlapHero = false,
}: {
  slides: SponsoredSlide[];
  labels: Labels;
  overlapHero?: boolean;
}) {
  const locale = useLocale();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const count = slides.length;
  const slide = slides[active];

  const go = useCallback((delta: number) => setActive((index) => (index + delta + count) % count), [count]);
  const format = (value: number) => new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(value);

  // Only the visible slide's video plays.
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === active) void video.play().catch(() => undefined);
      else video.pause();
    });
  }, [active]);

  if (!slide) return null;

  return (
    <section className={`lsd-container relative z-20 ${overlapHero ? "-mt-28" : "py-10"}`}>
      <div
        data-paused={paused ? "true" : "false"}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="relative grid min-h-[390px] grid-cols-[0.78fr_1.22fr] overflow-hidden rounded-[36px] bg-white shadow-[0_50px_120px_-40px_rgba(6,42,32,0.55)] ring-1 ring-[#eacb7f]/30"
      >
        {/* Copy */}
        <div className="relative flex flex-col justify-between gap-6 px-11 py-9">
          <Image
            src="/brand/lsevin-mark.png"
            alt=""
            aria-hidden="true"
            width={150}
            height={212}
            className="pointer-events-none absolute bottom-4 end-6 opacity-[0.06]"
          />

          <div key={slide.id} className="lsd-slide-in relative flex flex-col items-start gap-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#eacb7f] bg-[#fbf3de] px-4 py-1.5 text-xs font-bold text-[#8c6b2c]">
              ✦ {slide.badge || labels.sponsored}
            </span>
            {slide.eyebrow ? <span className="text-sm font-semibold text-[#8c6b2c]">{slide.eyebrow}</span> : null}
            {slide.title ? (
              <h2 className="text-[34px] font-black leading-[1.3] text-[#0e1a16]">
                <AnimatedWords text={slide.title} />
              </h2>
            ) : null}
            {slide.subtitle ? <p className="line-clamp-2 max-w-lg text-base leading-7 text-[#56675f]">{slide.subtitle}</p> : null}
            {slide.link ? (
              <Magnetic>
                <SlideLink slide={slide} className="lsd-btn lsd-btn-green mt-2">
                  {slide.buttonLabel || labels.button}
                  <ArrowLeft size={18} className="ltr:rotate-180" />
                </SlideLink>
              </Magnetic>
            ) : null}
          </div>

          {count > 1 ? (
            <div className="relative flex items-center gap-5">
              <span className="text-4xl font-black text-transparent [-webkit-text-stroke:1px_#c9a55a]">{format(active + 1)}</span>
              <span className="text-sm text-[#56675f]">/ {format(count)}</span>

              <div className="flex flex-1 gap-2">
                {slides.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`${index + 1}`}
                    onClick={() => setActive(index)}
                    className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-[#dce4e0] transition hover:bg-[#c9d6d0]"
                  >
                    {index < active ? <span className="absolute inset-0 bg-[#c9a55a]" /> : null}
                    {index === active ? (
                      <span
                        key={`progress-${active}`}
                        className="lsd-progress-fill absolute inset-y-0 start-0 bg-[#c9a55a]"
                        onAnimationEnd={() => go(1)}
                      />
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label={labels.previous}
                  onClick={() => go(-1)}
                  className="grid h-12 w-12 place-items-center rounded-full border border-[#dce4e0] text-[#083f30] transition hover:border-[#083f30] hover:bg-[#083f30] hover:text-white"
                >
                  <ChevronRight size={20} className="ltr:rotate-180" />
                </button>
                <button
                  type="button"
                  aria-label={labels.next}
                  onClick={() => go(1)}
                  className="grid h-12 w-12 place-items-center rounded-full bg-[#083f30] text-white transition hover:bg-[#0f5a45]"
                >
                  <ChevronLeft size={20} className="ltr:rotate-180" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Media, with a large arch where it meets the copy */}
        <div className="relative overflow-hidden rounded-ss-[200px] bg-[#062a20]">
          {slides.map((item, index) => {
            const src = resolveHomeMediaUrl(item.url) ?? "";
            const isActive = index === active;
            return (
              <div
                key={item.id}
                aria-hidden={!isActive}
                className={`absolute inset-0 transition-opacity duration-[1200ms] ${isActive ? "opacity-100" : "opacity-0"}`}
              >
                {item.mediaType === "video" ? (
                  <video
                    ref={(element) => {
                      videoRefs.current[index] = element;
                    }}
                    src={src}
                    muted
                    loop
                    playsInline
                    preload={isActive ? "auto" : "none"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={item.ariaLabel || item.title || ""}
                    className={`h-full w-full object-cover ${isActive ? "lsd-kenburns" : ""}`}
                  />
                )}
              </div>
            );
          })}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#062a20]/25" />
        </div>
      </div>
    </section>
  );
}