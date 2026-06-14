'use client';

import { ChevronLeft, ChevronRight, ExternalLink, Pause, Play } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { ImageWithFallback } from '@/components/ui/image-with-fallback';

import type { SponsoredSlide } from '../api/server/get-sponsored-slides';
import { resolveHomeMediaUrl } from './home-media';

type SponsoredMediaCarouselProps = {
  slides: SponsoredSlide[];
  autoPlayMs?: number;
};

function isExternalLink(value: string) {
  return /^https?:\/\//i.test(value);
}

export function SponsoredMediaCarousel({ slides, autoPlayMs = 6000 }: SponsoredMediaCarouselProps) {
  const t = useTranslations('Home.sponsoredCarousel');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const touchStartX = useRef<number | null>(null);

  const safeSlides = useMemo(() => slides.filter((item) => Boolean(item.url)), [slides]);

  useEffect(() => {
    if (safeSlides.length <= 1 || isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % safeSlides.length);
    }, autoPlayMs);

    return () => window.clearInterval(timer);
  }, [autoPlayMs, isPaused, safeSlides.length]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === activeIndex && safeSlides[index]?.mediaType === 'video') {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    });
  }, [activeIndex, safeSlides]);

  if (safeSlides.length === 0) return null;

  const goTo = (index: number) => {
    if (index < 0) {
      setActiveIndex(safeSlides.length - 1);
      return;
    }

    if (index >= safeSlides.length) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex(index);
  };

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current == null) return;

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;

    if (Math.abs(delta) > 50) {
      if (delta < 0) goTo(activeIndex + 1);
      else goTo(activeIndex - 1);
    }

    touchStartX.current = null;
  };

  return (
    <div className="px-5 py-4">
      <div
        className="group relative overflow-hidden rounded-[28px] bg-gray-950 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative aspect-[16/9] w-full  h-full lg:h-80">
          {safeSlides.map((slide, index) => {
            const active = index === activeIndex;
            const mediaSrc = resolveHomeMediaUrl(slide.url);
            const title = slide.title || t('fallbackTitle');
            const subtitle = slide.subtitle || t('fallbackSubtitle');
            const buttonLabel = slide.buttonLabel || t('fallbackButton');

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-all duration-500 ${
                  active
                    ? 'z-10 translate-x-0 opacity-100'
                    : index < activeIndex
                      ? 'z-0 -translate-x-4 opacity-0'
                      : 'z-0 translate-x-4 opacity-0'
                }`}
                aria-hidden={!active}
              >
                {slide.mediaType === 'video' ? (
                  <video
                    ref={(node) => {
                      videoRefs.current[index] = node;
                    }}
                    className="h-full w-full object-cover"
                    src={mediaSrc}
                    muted
                    loop
                    playsInline
                    preload={active ? 'metadata' : 'none'}
                  />
                ) : (
                  <ImageWithFallback
                    fill
                    src={mediaSrc}
                    alt={title}
                    sizes="100vw"
                    className="object-cover"
                    priority={active}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                      {t('sponsored')}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPaused((value) => !value)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/45"
                      aria-label={isPaused ? t('resumeAria') : t('pauseAria')}
                    >
                      {isPaused ? <Play size={16} /> : <Pause size={16} />}
                    </button>
                  </div>

                  <div className="max-w-md">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                      {t('premiumPlacement')}
                    </p>

                    <h3 className="mb-2 text-2xl font-bold text-white sm:text-3xl">{title}</h3>

                    <p className="mb-5 text-sm leading-6 text-white/85 sm:text-base">{subtitle}</p>

                    {slide.link ? (
                      <a
                        href={slide.link}
                        target={isExternalLink(slide.link) ? '_blank' : undefined}
                        rel={isExternalLink(slide.link) ? 'noreferrer noopener' : undefined}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-gray-950 transition hover:bg-gray-100"
                      >
                        {buttonLabel}
                        <ExternalLink size={16} />
                      </a>
                    ) : (
                      <div className="inline-flex items-center rounded-2xl bg-white/15 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md">
                        {buttonLabel}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {safeSlides.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition hover:bg-white group-hover:flex"
              aria-label={t('previousSlideAria')}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition hover:bg-white group-hover:flex"
              aria-label={t('nextSlideAria')}
            >
              <ChevronRight size={20} />
            </button>

            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/30 px-3 py-2 backdrop-blur-md">
              {safeSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goTo(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/70'
                  }`}
                  aria-label={t('goToSlideAria', { index: index + 1 })}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
