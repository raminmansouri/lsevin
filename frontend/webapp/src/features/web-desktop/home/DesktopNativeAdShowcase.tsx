"use client";

import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import type { SponsoredSlide } from "@/features/home/api/server/get-sponsored-slides";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { Link } from "@/i18n/navigation";

import { AnimatedWords, Magnetic } from "../components/motion";

type Labels = { sponsored: string; button: string; previous: string; next: string };

function SlideLink({ slide, className, children }: { slide: SponsoredSlide; className: string; children: ReactNode }) {
  const href = slide.link ?? "#";
  const target = slide.opensInNewTab ? "_blank" : undefined;
  const rel = slide.opensInNewTab ? "noopener noreferrer" : undefined;
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

/** Where each card of the deck sits, by its distance from the front card. */
function deckStyle(offset: number, count: number): CSSProperties {
  if (offset === 0) return { transform: "translateX(0) rotate(0deg) scale(1)", opacity: 1, zIndex: 30 };
  // The card that just left flies out to the side.
  if (count > 2 && offset === count - 1) {
    return { transform: "translateX(140px) rotate(14deg) scale(0.9)", opacity: 0, zIndex: 40, pointerEvents: "none" };
  }
  if (offset === 1) return { transform: "translate(-40px, -26px) rotate(-4deg) scale(0.94)", opacity: 0.85, zIndex: 20, filter: "saturate(0.7)" };
  if (offset === 2) return { transform: "translate(-80px, -52px) rotate(-8deg) scale(0.88)", opacity: 0.55, zIndex: 10, filter: "saturate(0.5)" };
  return { transform: "translateX(-120px) rotate(-16deg) scale(0.84)", opacity: 0, zIndex: 0 };
}

/** Native ad as a champagne vitrine: a deck of oval "mirror" cards that shuffle, with a gold progress ring. */
export function DesktopNativeAdShowcase({ slides, labels }: { slides: SponsoredSlide[]; labels: Labels }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const count = slides.length;
  const slide = slides[active];

  const go = useCallback((delta: number) => setActive((index) => (index + delta + count) % count), [count]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === active) void video.play().catch(() => undefined);
      else video.pause();
    });
  }, [active]);

  if (!slide) return null;

  return (
    <section
      data-paused={paused ? "true" : "false"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="lsd-champagne-bg relative my-16 overflow-hidden"
    >
      <div className="lsd-container grid grid-cols-[0.75fr_1.25fr] items-center gap-14 py-24">
        {/* Copy */}
        <div key={slide.id} className="lsd-slide-in flex flex-col items-start gap-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#062a20] px-4 py-1.5 text-xs font-bold text-[#eacb7f]">
            ✦ {slide.badge || labels.sponsored}
          </span>
          {slide.eyebrow ? <span className="text-sm font-bold text-[#8c6b2c]">{slide.eyebrow}</span> : null}
          {slide.title ? (
            <h2 className="text-[46px] font-black leading-[1.3] text-[#0e1a16]">
              <AnimatedWords text={slide.title} />
            </h2>
          ) : null}
          {slide.subtitle ? <p className="max-w-lg text-lg leading-8 text-[#5c5242]">{slide.subtitle}</p> : null}

          <div className="mt-4 flex items-center gap-5">
            {slide.link ? (
              <Magnetic>
                <SlideLink slide={slide} className="lsd-btn lsd-btn-green">
                  {slide.buttonLabel || labels.button}
                  <ArrowLeft size={18} className="ltr:rotate-180" />
                </SlideLink>
              </Magnetic>
            ) : null}

            {count > 1 ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={labels.previous}
                  onClick={() => go(-1)}
                  className="grid h-12 w-12 place-items-center rounded-full border border-[#8c6b2c]/30 text-[#8c6b2c] transition hover:bg-[#8c6b2c] hover:text-white"
                >
                  <ChevronLeft size={20} />
                </button>
                {/* Next, wrapped in a gold ring that fills up and turns the page */}
                <button
                  type="button"
                  aria-label={labels.next}
                  onClick={() => go(1)}
                  className="relative grid h-16 w-16 place-items-center rounded-full text-[#062a20] transition hover:scale-105"
                >
                  <svg viewBox="0 0 60 60" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
                    <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(140,107,44,0.2)" strokeWidth="2" />
                    <circle
                      key={`ring-${active}`}
                      cx="30"
                      cy="30"
                      r="26"
                      fill="none"
                      stroke="#8c6b2c"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="lsd-ring-progress"
                      onAnimationEnd={() => go(1)}
                    />
                  </svg>
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[#eacb7f]">
                    <ChevronRight size={20} />
                  </span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Deck of oval mirror cards */}
        <div className="relative grid h-[540px] place-items-center">
          <svg viewBox="0 0 200 200" className="lsd-rotate absolute h-[600px] w-[600px]" aria-hidden="true">
            <circle cx="100" cy="100" r="96" fill="none" stroke="#c9a55a" strokeWidth="0.6" strokeDasharray="2 6" />
          </svg>

          {slides.map((item, index) => {
            const offset = (index - active + count) % count;
            const src = resolveHomeMediaUrl(item.url) ?? "";
            const isFront = offset === 0;
            return (
              <div
                key={item.id}
                aria-hidden={!isFront}
                onClick={() => {
                  if (!isFront) setActive(index);
                }}
                className="lsd-deck-card absolute h-[440px] w-[640px] cursor-pointer overflow-hidden rounded-[40px] border-[6px] border-white bg-[#062a20] shadow-[0_40px_80px_-30px_rgba(6,42,32,0.55)]"
                style={deckStyle(offset, count)}
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
                    preload={isFront ? "auto" : "none"}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <>
                    {/* The same picture, blurred and enlarged, fills the frame behind the full ad */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-2xl" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={item.ariaLabel || item.title || ""} className="relative h-full w-full object-contain" />
                  </>
                )}
                <div className="pointer-events-none absolute inset-0 rounded-[34px] ring-1 ring-inset ring-[#eacb7f]/50" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}