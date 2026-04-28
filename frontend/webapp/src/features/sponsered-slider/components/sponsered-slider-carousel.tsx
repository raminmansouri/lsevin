"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { SponseredSliderPublicItem } from "../types";

function overlayClass(variant: SponseredSliderPublicItem["overlayVariant"]) {
  switch (variant) {
    case "light":
      return "from-white/90 via-white/45 to-transparent text-slate-950";
    case "brand":
      return "from-[#083f30]/95 via-[#083f30]/55 to-transparent text-white";
    case "none":
      return "from-transparent via-transparent to-transparent text-white";
    default:
      return "from-black/80 via-black/35 to-transparent text-white";
  }
}

function alignmentClass(alignment: SponseredSliderPublicItem["contentAlignment"]) {
  if (alignment === "center") return "items-center text-center mx-auto";
  if (alignment === "right") return "items-end text-right ml-auto";
  return "items-start text-left";
}

function Media({ item }: { item: SponseredSliderPublicItem }) {
  if (item.mediaType === "video") {
    return (
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={item.mediaUrl}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
      />
    );
  }

  return <img src={item.mediaUrl} alt={item.ariaLabel || item.title || "Sponsored slide"} className="absolute inset-0 h-full w-full object-cover" />;
}

export function SponseredSliderCarousel({ items }: { items: SponseredSliderPublicItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex];
  const hasMultiple = items.length > 1;

  const targetProps = useMemo(() => {
    if (!activeItem?.opensInNewTab) return {};
    return { target: "_blank", rel: "noreferrer noopener" };
  }, [activeItem?.opensInNewTab]);

  if (!activeItem) return null;

  function go(delta: number) {
    setActiveIndex((current) => (current + delta + items.length) % items.length);
  }

  const mainContent = (
    <>
      <Media item={activeItem} />
      <div className={`absolute inset-0 bg-gradient-to-r ${overlayClass(activeItem.overlayVariant)}`} />
      <div className="relative z-10 flex h-full p-5 sm:p-8">
        <div className={`flex max-w-xl flex-col justify-center ${alignmentClass(activeItem.contentAlignment)}`}>
          {activeItem.badge && (
            <span className="mb-3 inline-flex w-fit rounded-full bg-white/18 px-3 py-1 text-xs font-semibold backdrop-blur">
              {activeItem.badge}
            </span>
          )}

          {activeItem.eyebrow && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] opacity-75">
              {activeItem.eyebrow}
            </p>
          )}

          {activeItem.title && (
            <h3 className="mb-2 text-2xl font-bold sm:text-3xl">
              {activeItem.title}
            </h3>
          )}

          {activeItem.subtitle && (
            <p className="mb-2 text-sm font-medium opacity-90 sm:text-base">
              {activeItem.subtitle}
            </p>
          )}

          {activeItem.description && (
            <p className="mb-5 max-w-lg whitespace-pre-line text-sm leading-6 opacity-85 sm:text-base">
              {activeItem.description}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            {activeItem.link && activeItem.buttonLabel && (
              <Button asChild className="rounded-2xl bg-white text-slate-950 hover:bg-white/90">
                <Link href={activeItem.link} {...targetProps} aria-label={activeItem.ariaLabel}>
                  {activeItem.buttonLabel}
                  {activeItem.opensInNewTab && <ExternalLink className="ml-2 h-4 w-4" />}
                </Link>
              </Button>
            )}

            {activeItem.secondaryLink && activeItem.secondaryButtonLabel && (
              <Button asChild variant="outline" className="rounded-2xl border-white/60 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white">
                <Link href={activeItem.secondaryLink} {...targetProps}>
                  {activeItem.secondaryButtonLabel}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <section className="px-5 pb-8">
      <div className="relative h-64 overflow-hidden rounded-3xl shadow-lg sm:h-80">
        {activeItem.link ? (
          <div aria-label={activeItem.ariaLabel} className="block h-full w-full">
            {mainContent}
          </div>
        ) : mainContent}

        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="Previous sponsored slide"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-900 shadow-sm backdrop-blur transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next sponsored slide"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-900 shadow-sm backdrop-blur transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {items.map((item, index) => (
                <button
                  type="button"
                  aria-label={`Go to sponsored slide ${index + 1}`}
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all ${index === activeIndex ? "w-7 bg-white" : "w-2 bg-white/55"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
