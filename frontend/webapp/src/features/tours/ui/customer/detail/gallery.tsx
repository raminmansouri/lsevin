"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { directionOf } from "../../../domain/content";
import type { TourDetail } from "../../../server/platform/catalog";
import { formatNumber } from "../../shared/format";
import { TourImage } from "../common";

type Media = TourDetail["media"][number];

/**
 * Photo-first gallery (C-032, 3-tour_page_1.png): swipeable cover with image
 * count, a thumbnail strip, and a full-screen lightbox with captions and alt
 * text. Keyboard: arrows move between photos, Escape closes, focus stays inside
 * the dialog while open.
 */
export function Gallery({ media, title, overlay }: { media: Media[]; title: string; overlay?: ReactNode }) {
  const t = useTranslations("TourApp.detail.gallery");
  const locale = useLocale();
  const rtl = directionOf(locale) === "rtl";
  const images = media.filter((m) => m.kind === "image" || m.kind === "photo" || !m.kind);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const total = images.length;

  // Track the visible slide while swiping.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      const i = Math.round(Math.abs(el.scrollLeft) / Math.max(el.clientWidth, 1));
      setIndex(Math.min(Math.max(i, 0), total - 1));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [total]);

  function goTo(i: number) {
    const next = (i + total) % total;
    setIndex(next);
    const el = scroller.current;
    if (el) el.scrollTo({ left: (rtl ? -1 : 1) * next * el.clientWidth, behavior: "smooth" });
  }

  function onLightboxKey(e: KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setIndex((i) => (i + (rtl ? -1 : 1) + total) % total);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setIndex((i) => (i + (rtl ? 1 : -1) + total) % total);
    }
  }

  if (total === 0) {
    return (
      <div className="relative">
        <TourImage src={null} alt={title} className="aspect-[16/10] w-full sm:rounded-3xl" />
        {overlay}
      </div>
    );
  }

  const current = images[index] ?? images[0];
  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;

  return (
    <section aria-label={t("label")} className="space-y-2" data-testid="gallery" data-image-count={total}>
      {total > 1 ? (
        <div role="group" aria-label={t("thumbnails")} className="flex gap-2 overflow-x-auto px-4 pt-3 [scrollbar-width:none] sm:px-0">
          {images.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`${m.alt ?? title} — ${t("counter", { index: formatNumber(i + 1, locale), total: formatNumber(total, locale) })}`}
              aria-current={i === index ? "true" : undefined}
              className={cn(
                "h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-2 transition focus-visible:ring-emerald-600 focus-visible:outline-none",
                i === index ? "ring-emerald-600" : "ring-transparent opacity-80",
              )}
            >
              <TourImage src={m.thumbnailUrl ?? m.url} alt="" className="h-full w-full" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative px-4 sm:px-0">
        <div ref={scroller} className="flex snap-x snap-mandatory overflow-x-auto rounded-3xl [scrollbar-width:none]" data-testid="gallery-slides">
          {images.map((m, i) => (
            <figure key={m.id} className="relative aspect-[16/10] w-full shrink-0 snap-center">
              <button
                type="button"
                onClick={() => {
                  setIndex(i);
                  setOpen(true);
                }}
                aria-label={t("open", { index: formatNumber(i + 1, locale), total: formatNumber(total, locale) })}
                className="absolute inset-0 focus-visible:ring-4 focus-visible:ring-emerald-500 focus-visible:outline-none focus-visible:ring-inset"
              >
                <TourImage src={m.url} alt={m.alt ?? title} className="h-full w-full" eager={i === 0} />
              </button>
            </figure>
          ))}
        </div>
        {overlay}
        <span className="pointer-events-none absolute end-7 bottom-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white sm:end-3" data-testid="gallery-counter" aria-live="polite">
          {t("counter", { index: formatNumber(index + 1, locale), total: formatNumber(total, locale) })}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("open", { index: formatNumber(index + 1, locale), total: formatNumber(total, locale) })}
          className="absolute start-7 bottom-3 flex size-10 items-center justify-center rounded-full bg-black/50 text-white sm:start-3"
        >
          <Expand className="size-4" aria-hidden="true" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="h-[100dvh] max-h-none w-screen max-w-none rounded-none border-0 bg-black p-0 text-white sm:max-w-none [&>button:last-child]:hidden"
          onKeyDown={onLightboxKey}
          data-testid="lightbox"
          data-latin-digits=""
        >
          <DialogTitle className="sr-only">{t("fullscreenTitle", { title })}</DialogTitle>
          <DialogDescription className="sr-only">{current.alt ?? title}</DialogDescription>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-3">
              <span className="text-sm" aria-live="polite" data-testid="lightbox-counter">
                {t("counter", { index: formatNumber(index + 1, locale), total: formatNumber(total, locale) })}
              </span>
              <DialogClose className="flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none" aria-label={t("close")}>
                <X className="size-5" aria-hidden="true" />
              </DialogClose>
            </div>
            <figure className="relative flex min-h-0 flex-1 flex-col items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.url} alt={current.alt ?? title} className="max-h-full max-w-full object-contain" />
              {current.caption ? (
                <figcaption className="w-full bg-black/60 px-4 py-3 text-center text-sm" data-testid="lightbox-caption">
                  {current.caption}
                </figcaption>
              ) : null}
            </figure>
            {total > 1 ? (
              <div className="flex items-center justify-center gap-6 p-4">
                <button type="button" onClick={() => setIndex((index - 1 + total) % total)} aria-label={t("prev")} className="flex size-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none">
                  <Prev className="size-6" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setIndex((index + 1) % total)} aria-label={t("next")} className="flex size-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none" data-testid="lightbox-next">
                  <Next className="size-6" aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
