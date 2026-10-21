"use client";

import { ArrowLeft, Flame, TrendingUp, Users } from "lucide-react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useState, type ReactNode } from "react";

import { Link } from "@/i18n/navigation";

import { Reveal } from "../components/motion";

export type TrendingItem = {
  id: string;
  href: string;
  title: string;
  imageSrc: string | null;
  bookingCount: number;
  bookingsText: string;
  growth: string | null;
};

/** Trending services as a luxury chart: #1 as a tall spotlight, the rest ranked with gold bars and a floating preview. */
export function DesktopTrendingChart({
  items,
  title,
  subtitle,
  favorite,
}: {
  items: TrendingItem[];
  title: string;
  subtitle: string;
  /** Favourite button for the #1 service, rendered on the server. */
  favorite: ReactNode;
}) {
  const locale = useLocale();
  const [preview, setPreview] = useState<{ index: number; x: number; y: number } | null>(null);
  // Only show the floating preview once its picture has actually loaded.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [top, ...rest] = items;
  const max = Math.max(...items.map((item) => item.bookingCount), 1);
  const rank = (value: number) => new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(value);

  if (!top) return null;
  const previewItem = preview ? rest[preview.index] : null;
  const showPreview = Boolean(previewItem?.imageSrc && loadedSrc === previewItem.imageSrc);

  return (
    <section className="lsd-container py-24">
      <Reveal className="mb-12 flex items-end justify-between gap-10">
        <div>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#fbf3de] px-3 py-1 text-xs font-bold text-[#8c6b2c]">
            <span className="lsd-pulse h-2 w-2 rounded-full bg-[#e0663f]" />
            <Flame size={14} />
          </span>
          <h2 className="lsd-heading text-5xl font-black text-[#0e1a16]">{title}</h2>
          <p className="mt-6 max-w-xl text-lg text-[#56675f]">{subtitle}</p>
        </div>
      </Reveal>

      <div className="grid grid-cols-[0.9fr_1.1fr] gap-10">
        {/* #1 spotlight */}
        <Reveal direction="right">
          <div className="relative">
            <Link href={top.href} className="group block">
              <div className="lsd-card relative h-[600px] bg-[#062a20]">
                {top.imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={top.imageSrc} alt={top.title} className="lsd-zoom absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center">
                    <Image src="/brand/lsevin-mark-reversed.png" alt="" width={120} height={170} className="opacity-30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#062a20] via-[#062a20]/30 to-transparent" />

                <span className="absolute -top-6 end-6 text-[220px] font-black leading-none text-transparent [-webkit-text-stroke:2px_rgba(234,203,127,0.9)]">
                  {new Intl.NumberFormat(locale).format(1)}
                </span>

                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-10 text-white">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#eacb7f] px-3 py-1 text-xs font-black text-[#062a20]">
                    <TrendingUp size={14} />
                    {top.growth ?? "#1"}
                  </span>
                  <h3 className="text-[38px] font-black leading-tight">{top.title}</h3>
                  <p className="flex items-center gap-2 text-[15px] text-white/80">
                    <Users size={16} className="text-[#eacb7f]" />
                    {top.bookingsText}
                  </p>
                </div>
              </div>
            </Link>
            <div className="absolute end-6 top-[220px] z-10">{favorite}</div>
          </div>
        </Reveal>

        {/* The rest of the chart */}
        <div
          className="relative"
          onMouseMove={(event) => {
            if (!preview) return;
            const rect = event.currentTarget.getBoundingClientRect();
            setPreview({ ...preview, x: event.clientX - rect.left, y: event.clientY - rect.top });
          }}
          onMouseLeave={() => setPreview(null)}
        >
          <ol className="divide-y divide-[#dce4e0] border-y border-[#dce4e0]">
            {rest.map((item, index) => (
              <Reveal as="li" key={item.id} delay={index * 80}>
                <Link
                  href={item.href}
                  onMouseEnter={(event) => {
                    const rect = event.currentTarget.closest("ol")!.parentElement!.getBoundingClientRect();
                    setPreview({ index, x: event.clientX - rect.left, y: event.clientY - rect.top });
                  }}
                  className="lsd-row grid grid-cols-[64px_64px_1fr_auto] items-center gap-5 py-5"
                >
                  <span className="lsd-rank text-[40px] font-black leading-none">{rank(index + 2)}</span>
                  <span className="relative h-16 w-16 overflow-hidden rounded-2xl bg-[#0f5a45]">
                    {item.imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageSrc} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-bold text-[#0e1a16]">{item.title}</span>
                    <span className="mt-2 flex items-center gap-3">
                      <span className="h-1.5 w-full max-w-[260px] overflow-hidden rounded-full bg-[#eef2f0]">
                        <span
                          className="lsd-bar block h-full rounded-full bg-gradient-to-l from-[#eacb7f] to-[#c9a55a]"
                          style={{
                            ["--bar-width" as string]: `${Math.max(8, (item.bookingCount / max) * 100)}%`,
                            ["--bar-delay" as string]: `${300 + index * 90}ms`,
                          }}
                        />
                      </span>
                      <span className="shrink-0 text-xs text-[#56675f]">{item.bookingsText}</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    {item.growth ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f4ee] px-2.5 py-1 text-xs font-bold text-[#0f5a45]">
                        <TrendingUp size={13} />
                        {item.growth}
                      </span>
                    ) : null}
                    <span className="lsd-row-arrow grid h-10 w-10 place-items-center rounded-full bg-[#083f30] text-white">
                      <ArrowLeft size={17} className="ltr:rotate-180" />
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ol>

          {/* Floating preview that follows the pointer */}
          <div
            aria-hidden="true"
            className="lsd-preview pointer-events-none absolute start-0 top-0 z-30 h-[260px] w-[200px] overflow-hidden rounded-[28px] border-4 border-white bg-[#0f5a45] shadow-[0_40px_80px_-30px_rgba(6,42,32,0.6)]"
            style={{
              opacity: showPreview ? 1 : 0,
              scale: showPreview ? "1" : "0.85",
              translate: preview ? `${preview.x - 100}px ${preview.y - 290}px` : undefined,
              rotate: "-4deg",
            }}
          >
            {previewItem?.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={previewItem.imageSrc}
                src={previewItem.imageSrc}
                alt=""
                className="h-full w-full object-cover"
                onLoad={() => setLoadedSrc(previewItem.imageSrc)}
                onError={() => setLoadedSrc(null)}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}