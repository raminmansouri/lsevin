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

/**
 * The text an admin actually filled in, or null.
 *
 * An empty title used to be replaced by a canned marketing sentence printed over
 * the advertiser's creative, so admins typed a single "." into the field to get
 * rid of it -- and that dot is what the live home page renders as its heading
 * today. Empty now renders nothing, and a leftover punctuation-only value counts
 * as empty too, so those rows come good without anyone re-editing them.
 */
function meaningfulText(value?: string | null) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return null;

  return /[\p{L}\p{N}]/u.test(trimmed) ? trimmed : null;
}

const VIDEO_MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  ogg: 'video/ogg',
  mov: 'video/quicktime',
  qt: 'video/quicktime',
  avi: 'video/x-msvideo',
  wmv: 'video/x-ms-wmv',
  mkv: 'video/x-matroska',
};

/**
 * Whether this browser will actually render the file, judged from the URL — the
 * media library keeps an extension per row but the slide query does not carry
 * it, and the URL is what actually gets requested.
 *
 * Chrome on Android answers "" for video/quicktime, and what it does with a
 * `.mov` is worse than refusing it: the whole file downloads and nothing
 * renders. An extension we do not recognize is treated as playable rather than
 * hidden — better to let a tap find out than to silently drop a valid slide.
 */
function canBrowserPlay(src: string) {
  if (typeof document === 'undefined') return false;

  const extension = src.split(/[?#]/)[0]?.split('.').pop()?.toLowerCase() ?? '';
  const mimeType = VIDEO_MIME_TYPE_BY_EXTENSION[extension];
  if (!mimeType) return true;

  return document.createElement('video').canPlayType(mimeType) !== '';
}

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

/**
 * Whether this visit should spend bandwidth on video before being asked to.
 *
 * A sponsored `.mov` on the home page was pulling 2.2 MB — 66% of the entire
 * page weight — because the autoplay effect called play() on the active slide,
 * which overrides `preload` and fetches the whole file. On the ~318 kbps links
 * this app is actually used over, that stole bandwidth from the JS and images
 * for the whole first minute.
 *
 * Starts false so the server-rendered markup and the first client render agree;
 * only a connection that looks genuinely fast opts in.
 */
function useAutoplayAllowed() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;

    if (connection?.saveData) return;
    // Absent the API (Safari, Firefox) we stay conservative: a tap is cheap, a
    // wasted multi-megabyte download on a phone is not.
    if (connection?.effectiveType !== '4g') return;

    setAllowed(true);
  }, []);

  return allowed;
}

export function SponsoredMediaCarousel({ slides, autoPlayMs = 6000 }: SponsoredMediaCarouselProps) {
  const t = useTranslations('Home.sponsoredCarousel');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  // Slides the visitor explicitly started. Once started, a slide keeps its video
  // loaded so returning to it does not re-download.
  const [startedSlideIds, setStartedSlideIds] = useState<ReadonlySet<string>>(new Set());
  const [playableSlideIds, setPlayableSlideIds] = useState<ReadonlySet<string>>(new Set());
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const touchStartX = useRef<number | null>(null);
  // A horizontal flick still lands as a click on the element under the finger in
  // mobile browsers. Now that the whole creative is a link, swiping to the next
  // ad would otherwise navigate to the current one.
  const swipedRef = useRef(false);
  const autoplayAllowed = useAutoplayAllowed();

  const safeSlides = useMemo(() => slides.filter((item) => Boolean(item.url)), [slides]);

  // `canPlayType` needs a DOM, so this settles after the first paint. Until it
  // does, no video slide is treated as playable and nothing is requested.
  useEffect(() => {
    setPlayableSlideIds(
      new Set(
        safeSlides
          .filter(
            (slide) => slide.mediaType === 'video' && canBrowserPlay(resolveHomeMediaUrl(slide.url)),
          )
          .map((slide) => slide.id),
      ),
    );
  }, [safeSlides]);

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

      const slide = safeSlides[index];
      const shouldPlay =
        index === activeIndex &&
        slide?.mediaType === 'video' &&
        playableSlideIds.has(slide.id) &&
        (autoplayAllowed || startedSlideIds.has(slide.id));

      if (shouldPlay) {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    });
  }, [activeIndex, autoplayAllowed, playableSlideIds, safeSlides, startedSlideIds]);

  const startSlideVideo = (slideId: string) => {
    setStartedSlideIds((current) => new Set(current).add(slideId));
  };

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
    swipedRef.current = false;
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current == null) return;

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;

    if (Math.abs(delta) > 50) {
      swipedRef.current = true;
      if (delta < 0) goTo(activeIndex + 1);
      else goTo(activeIndex - 1);
    }

    touchStartX.current = null;
  };

  const onClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!swipedRef.current) return;

    swipedRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="px-5 py-4">
      <div
        className="group relative overflow-hidden rounded-[28px] bg-gray-950 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClickCapture={onClickCapture}
      >
        {/*
          The unit is as tall as the creatives it carries. Every ad uploaded
          through the admin panel so far is 4:3, and a 16/9 box both cropped a
          quarter of it away and left the overlay 188px to fit a badge, a title,
          a subtitle and a call-to-action into on a 375px phone -- the button
          ended up 24px below the clipping edge, which is why the ad could not be
          tapped. Wider screens keep a wider frame; `lg:h-80` is unchanged.
        */}
        <div className="relative aspect-[4/3] w-full sm:aspect-[3/2] sm:max-h-[380px] lg:aspect-auto lg:h-80">
          {safeSlides.map((slide, index) => {
            const active = index === activeIndex;
            const mediaSrc = resolveHomeMediaUrl(slide.url);
            const eyebrow = meaningfulText(slide.eyebrow);
            const badge = meaningfulText(slide.badge);
            const title = meaningfulText(slide.title);
            const subtitle = meaningfulText(slide.subtitle);
            const buttonLabel = meaningfulText(slide.buttonLabel) ?? t('fallbackButton');
            const link = (slide.link ?? '').trim();
            const opensInNewTab = slide.opensInNewTab || isExternalLink(link);
            const isPlayableVideo = slide.mediaType === 'video' && playableSlideIds.has(slide.id);
            // Only these two states fetch bytes. Everything else renders the card
            // chrome over the dark backdrop and requests nothing.
            const loadsVideo = isPlayableVideo && (autoplayAllowed || startedSlideIds.has(slide.id));
            const showsPlayButton = isPlayableVideo && !loadsVideo && active;

            const slideBody = (
              <>
                {slide.mediaType === 'video' ? (
                  <video
                    ref={(node) => {
                      videoRefs.current[index] = node;
                    }}
                    // `absolute` matters: the image branch uses next/image's
                    // `fill`, which takes the media out of flow. A static <video>
                    // consumed the slide's full height and pushed the title,
                    // subtitle and call-to-action below it, where overflow-hidden
                    // clipped them — so video slides rendered no text at all.
                    className="absolute inset-0 h-full w-full object-cover"
                    // No `src` until the slide is cleared to load. Setting it with
                    // preload="none" still lets a browser start buffering once
                    // play() is called, and an unplayable format (a .mov on
                    // Android) would download in full and render nothing.
                    src={loadsVideo ? mediaSrc : undefined}
                    muted
                    loop
                    playsInline
                    preload={loadsVideo ? 'metadata' : 'none'}
                  />
                ) : (
                  <ImageWithFallback
                    fill
                    src={mediaSrc}
                    alt={title ?? t('sponsored')}
                    sizes="100vw"
                    className="object-cover"
                    priority={active}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="relative z-10 flex h-full flex-col justify-between gap-3 p-4 sm:p-6">
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="inline-flex w-fit items-center rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                      {t('sponsored')}
                    </span>

                    {badge ? (
                      <span className="inline-flex w-fit items-center rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-gray-950">
                        {badge}
                      </span>
                    ) : null}
                  </div>

                  {/*
                    Every line below is clamped. The box is a fixed ratio, so a
                    long title typed into the admin panel has to lose its tail
                    rather than push the call-to-action out through the bottom.
                  */}
                  <div className="min-h-0 max-w-md">
                    {eyebrow ? (
                      <p className="mb-1 line-clamp-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                        {eyebrow}
                      </p>
                    ) : null}

                    {title ? (
                      <h3 className="mb-1 line-clamp-2 text-xl font-bold leading-tight text-white sm:mb-2 sm:text-3xl">
                        {title}
                      </h3>
                    ) : null}

                    {subtitle ? (
                      <p className="mb-3 line-clamp-2 text-xs leading-5 text-white/85 sm:mb-5 sm:text-base sm:leading-6">
                        {subtitle}
                      </p>
                    ) : null}

                    {/*
                      No link, no button. A slide with an empty destination used
                      to render a white pill that looked exactly like the real
                      call-to-action and did nothing when tapped — which is what
                      all three home placements show today.
                    */}
                    {link ? (
                      <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-gray-950 transition group-hover:bg-gray-100 sm:px-5 sm:py-3 sm:text-sm">
                        {buttonLabel}
                        {opensInNewTab ? <ExternalLink size={16} /> : null}
                      </span>
                    ) : null}
                  </div>
                </div>
              </>
            );

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-all duration-500 ${
                  active
                    ? 'z-10 translate-x-0 opacity-100'
                    : index < activeIndex
                      ? 'pointer-events-none z-0 -translate-x-4 opacity-0'
                      : 'pointer-events-none z-0 translate-x-4 opacity-0'
                }`}
                aria-hidden={!active}
              >
                {/*
                  The creative itself is the click target. A sponsored banner is
                  tapped anywhere, not only on its button — and the button is the
                  one part of the card a short frame is liable to cut off.
                */}
                {link ? (
                  <a
                    href={link}
                    target={opensInNewTab ? '_blank' : undefined}
                    rel={opensInNewTab ? 'noreferrer noopener' : undefined}
                    aria-label={meaningfulText(slide.ariaLabel) ?? title ?? t('sponsored')}
                    // Hidden slides stay in the DOM for the cross-fade; keyboard
                    // users must not be able to tab into an invisible ad.
                    tabIndex={active ? undefined : -1}
                    className="absolute inset-0 block"
                  >
                    {slideBody}
                  </a>
                ) : (
                  <div className="absolute inset-0">{slideBody}</div>
                )}

                {showsPlayButton ? (
                  <button
                    type="button"
                    onClick={() => startSlideVideo(slide.id)}
                    aria-label={t('playVideoAria')}
                    // Bottom inline-end: the copy and call-to-action sit at the
                    // inline-start in both directions, so this corner is the one
                    // place a play button does not land on the title.
                    className="absolute bottom-5 end-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-gray-950 shadow-lg backdrop-blur-md transition hover:bg-white sm:bottom-6 sm:end-6"
                  >
                    <Play size={24} className="ms-1 fill-current" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        {safeSlides.length > 1 ? (
          <>
            {/*
              Rotation controls belong to the carousel, not to each slide: the
              pause button used to be rendered once per slide inside the card
              copy, where it is now nested inside the slide's link and would
              navigate instead of pausing.
            */}
            <button
              type="button"
              onClick={() => setIsPaused((value) => !value)}
              className="absolute top-4 end-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/45 sm:top-6 sm:end-6"
              aria-label={isPaused ? t('resumeAria') : t('pauseAria')}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>

            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-3 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition hover:bg-white group-hover:flex"
              aria-label={t('previousSlideAria')}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-3 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition hover:bg-white group-hover:flex"
              aria-label={t('nextSlideAria')}
            >
              <ChevronRight size={20} />
            </button>

            <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/30 px-3 py-2 backdrop-blur-md">
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
