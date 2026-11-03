"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useState, type ReactNode } from "react";

import { Link } from "@/i18n/navigation";

import { Reveal } from "../components/motion";

export type SignatureItem = {
  id: string;
  href: string;
  title: string;
  provider: string;
  location: string;
  rating: number;
  reviewCount: number;
  imageSrc: string | null;
  badge: string | null;
  discountLabel: string | null;
  /** Rendered on the server with the same price components as the mobile card. */
  price: ReactNode;
  originalPrice: string | null;
  favorite: ReactNode;
};

const CYCLE_MS = 5500;

/** Cinematic accordion: the hovered (or auto-cycled) panel opens wide, the rest fold into slim columns. */
export function DesktopSignatureCollection({
  items,
  title,
  subtitle,
  seeAll,
  seeAllHref,
  labels,
}: {
  items: SignatureItem[];
  title: string;
  subtitle: string;
  seeAll: string;
  seeAllHref: string;
  labels: { previous: string; next: string };
}) {
  const locale = useLocale();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  const go = useCallback((delta: number) => setActive((index) => (index + delta + count) % count), [count]);
  const two = (value: number) => new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(value);
  const number = (value: number, digits = 0) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);

  // Light follows the pointer; the picture drifts the other way for depth.
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = event.currentTarget;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    node.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
    node.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
    node.style.setProperty("--ix", `${((x - 0.5) * -22).toFixed(1)}px`);
    node.style.setProperty("--iy", `${((y - 0.5) * -22).toFixed(1)}px`);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const rtl = document.documentElement.dir === "rtl";
    if (event.key === "ArrowLeft") go(rtl ? 1 : -1);
    if (event.key === "ArrowRight") go(rtl ? -1 : 1);
  };

  return (
    <section className="lsd-container py-14">
      <Reveal className="mb-12 flex items-end justify-between gap-10">
        <div>
          <h2 className="lsd-heading text-5xl font-black text-[#0e1a16]">{title}</h2>
          <p className="mt-6 max-w-xl text-lg text-[#56675f]">{subtitle}</p>
        </div>

        <div className="flex shrink-0 items-center gap-6">
          {count > 1 ? (
            <div className="flex gap-2">
              <button
                type="button"
                aria-label={labels.previous}
                onClick={() => go(-1)}
                className="grid h-12 w-12 place-items-center rounded-full border border-[#dce4e0] text-[#083f30] transition hover:border-[#083f30] hover:bg-[#083f30] hover:text-white"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                aria-label={labels.next}
                onClick={() => go(1)}
                className="grid h-12 w-12 place-items-center rounded-full bg-[#083f30] text-white transition hover:bg-[#0f5a45]"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          ) : null}
          <Link
            href={seeAllHref}
            className="group inline-flex items-center gap-2 text-[15px] font-bold text-[#083f30] transition hover:text-[#8c6b2c]"
          >
            {seeAll}
            <ArrowLeft size={18} className="transition-transform duration-500 group-hover:-translate-x-1.5 ltr:rotate-180" />
          </Link>
        </div>
      </Reveal>

      <Reveal delay={150}>
        <div
          role="region"
          aria-label={title}
          tabIndex={0}
          onKeyDown={onKeyDown}
          data-paused={paused ? "true" : "false"}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="flex h-[600px] gap-4 rounded-[32px] outline-none focus-visible:ring-2 focus-visible:ring-[#eacb7f]"
        >
          {items.map((item, index) => {
            const isActive = index === active;
            return (
              <div
                key={item.id}
                data-active={isActive ? "true" : "false"}
                onMouseEnter={() => setActive(index)}
                onClick={() => {
                  if (!isActive) setActive(index);
                }}
                onPointerMove={isActive ? onPointerMove : undefined}
                className="lsd-panel relative min-w-[84px] cursor-pointer overflow-hidden rounded-[30px] bg-[#062a20]"
                style={{ flexGrow: isActive ? 5.5 : 1, flexBasis: 0 }}
              >
                {item.imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageSrc} alt={item.title} className="lsd-panel-img absolute inset-0 h-full w-full object-cover" />
                ) : null}
                <div className="lsd-panel-shade absolute inset-0" />
                <div className="lsd-panel-veil absolute inset-0" />
                <div className="lsd-panel-glow pointer-events-none absolute inset-0" />

                <span className="absolute start-6 top-6 z-10 text-4xl font-black text-transparent [-webkit-text-stroke:1px_rgba(234,203,127,0.85)]">
                  {two(index + 1)}
                </span>

                {/* Folded: the name runs vertically */}
                <div className="pointer-events-none absolute inset-x-0 bottom-10 z-10 flex justify-center">
                  <span className="lsd-panel-vertical max-h-[380px] overflow-hidden text-lg font-bold text-white/90">{item.title}</span>
                </div>

                {item.discountLabel ? (
                  <span className="lsd-ribbon absolute end-8 top-0 z-20 bg-[#eacb7f] px-3 pb-6 pt-4 text-xs font-black text-[#062a20]">
                    {item.discountLabel}
                  </span>
                ) : null}

                {isActive ? (
                  <>
                    {/* The whole open panel is the link; the heart sits above it. */}
                    <Link href={item.href} aria-label={item.title} className="absolute inset-0 z-[5]" />
                    <div className="absolute end-6 top-20 z-20">{item.favorite}</div>

                    <div key={`content-${item.id}`} className="lsd-slide-in pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-10 text-white">
                      {item.badge ? (
                        <span className="w-fit rounded-full border border-[#eacb7f]/50 bg-[#062a20]/40 px-3 py-1 text-xs font-bold text-[#eacb7f] backdrop-blur-md">
                          {item.badge}
                        </span>
                      ) : null}
                      <h3 className="max-w-xl text-[40px] font-black leading-tight">{item.title}</h3>
                      <p className="flex flex-wrap items-center gap-2 text-[15px] text-white/80">
                        <span className="font-semibold">{item.provider}</span>
                        {item.location ? (
                          <>
                            <span className="h-1 w-1 rounded-full bg-[#eacb7f]" />
                            <MapPin size={15} className="text-[#eacb7f]" />
                            {item.location}
                          </>
                        ) : null}
                      </p>

                      <div className="mt-3 flex items-end justify-between gap-8">
                        <div>
                          {item.rating > 0 ? (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="flex">
                                {Array.from({ length: 5 }).map((_, star) => (
                                  <Star
                                    key={star}
                                    size={15}
                                    className={star < Math.round(item.rating) ? "fill-[#eacb7f] text-[#eacb7f]" : "text-white/30"}
                                  />
                                ))}
                              </span>
                              <span className="font-bold">{number(item.rating, 1)}</span>
                              {item.reviewCount ? <span className="text-white/60">({number(item.reviewCount)})</span> : null}
                            </div>
                          ) : null}
                          <div className="mt-3">
                            {item.originalPrice ? <div className="text-sm text-white/50 line-through">{item.originalPrice}</div> : null}
                            {item.price}
                          </div>
                        </div>
                        <span className="lsd-btn lsd-btn-gold h-16 w-16 !px-0">
                          <ArrowLeft size={22} className="ltr:rotate-180" />
                        </span>
                      </div>
                    </div>

                    {count > 1 ? (
                      <span className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-white/15">
                        <span
                          key={`progress-${active}`}
                          className="lsd-progress-fill absolute inset-y-0 start-0 bg-[#eacb7f]"
                          style={{ animationDuration: `${CYCLE_MS}ms` }}
                          onAnimationEnd={() => go(1)}
                        />
                      </span>
                    ) : null}
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}