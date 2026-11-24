"use client";

import { Children, useEffect, useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function AutoScrollRail({
  children,
  className,
  speed = 28,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const hovering = useRef(false);
  const pos = useRef(0);
  const resumeTimer = useRef<number | undefined>(undefined);
  const loop = Children.count(children) > 6;

  const release = () => {
    window.clearTimeout(resumeTimer.current);
    const el = ref.current;
    if (el) pos.current = Math.abs(el.scrollLeft);
    paused.current = false;
  };

  const hold = (ms?: number) => {
    paused.current = true;
    window.clearTimeout(resumeTimer.current);
    if (ms) {
      resumeTimer.current = window.setTimeout(() => {
        if (!hovering.current) release();
      }, ms);
    }
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || !loop) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const style = getComputedStyle(el);
    const rtl = style.direction === "rtl";
    const gap = parseFloat(style.columnGap) || 0;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const group = groupRef.current;
      if (group && !paused.current && !document.hidden) {
        const length = group.offsetWidth + gap;
        pos.current += (speed * dt) / 1000;
        if (pos.current >= length) pos.current -= length;
        el.scrollLeft = rtl ? -pos.current : pos.current;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resumeTimer.current);
    };
  }, [loop, speed]);

  const nudge = (direction: 1 | -1) => {
    const el = ref.current;
    const first = groupRef.current?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    hold(3000);
    const style = getComputedStyle(el);
    const gap = parseFloat(style.columnGap) || 0;
    const rtl = style.direction === "rtl";
    el.scrollBy({ left: (first.offsetWidth + gap) * direction * (rtl ? -1 : 1), behavior: "smooth" });
  };

  const arrow =
    "absolute top-[38%] z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#083f30] shadow-[0_10px_30px_-12px_rgba(6,42,32,0.6)] ring-1 ring-[#eacb7f]/50 transition hover:bg-[#083f30] hover:text-[#eacb7f]";

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        hovering.current = true;
        hold();
      }}
      onMouseLeave={() => {
        hovering.current = false;
        release();
      }}
      onFocusCapture={() => hold()}
      onBlurCapture={() => {
        if (!hovering.current) release();
      }}
    >
      <div
        ref={ref}
        onPointerDown={() => hold()}
        onPointerUp={() => hold(3000)}
        onWheel={() => hold(3000)}
        className={cn(
          "flex gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          loop && "[mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent)]",
          className,
        )}
      >
        <div ref={groupRef} className="flex shrink-0 gap-6">
          {children}
        </div>
        {loop ? (
          <div className="flex shrink-0 gap-6" aria-hidden="true" inert>
            {children}
          </div>
        ) : null}
      </div>
      {loop ? (
        <>
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => nudge(-1)} className={cn(arrow, "-start-5")}>
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => nudge(1)} className={cn(arrow, "-end-5")}>
            <ChevronRight className="size-5" />
          </button>
        </>
      ) : null}
    </div>
  );
}