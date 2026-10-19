"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fades and rises its children in once they scroll into view. */
export function Reveal({
  as: Tag = "div",
  children,
  className = "",
  delay = 0,
  direction = "up",
  style,
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "zoom";
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (prefersReducedMotion()) {
      node.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      data-reveal={direction}
      className={`lsd-reveal ${className}`}
      style={{ ...style, ["--lsd-delay" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/** A card that tilts gently toward the pointer. */
export function Tilt({
  as: Tag = "div",
  children,
  className = "",
  max = 6,
  ...rest
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  max?: number;
  [key: string]: unknown;
}) {
  const ref = useRef<HTMLElement>(null);

  const onPointerMove = (event: React.PointerEvent) => {
    const node = ref.current;
    if (!node || event.pointerType !== "mouse" || prefersReducedMotion()) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.setProperty("--lsd-ry", `${(x * max).toFixed(2)}deg`);
    node.style.setProperty("--lsd-rx", `${(-y * max).toFixed(2)}deg`);
  };
  const onPointerLeave = () => {
    ref.current?.style.setProperty("--lsd-ry", "0deg");
    ref.current?.style.setProperty("--lsd-rx", "0deg");
  };

  return (
    <Tag
      ref={ref as never}
      className={`lsd-card ${className}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Pulls a button slightly toward the pointer. */
export function Magnetic({ children, strength = 8 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  const onPointerMove = (event: React.PointerEvent) => {
    const target = ref.current?.firstElementChild as HTMLElement | null;
    if (!target || event.pointerType !== "mouse" || prefersReducedMotion()) return;
    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * strength * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * strength * 2;
    target.style.setProperty("--lsd-mx", `${x.toFixed(1)}px`);
    target.style.setProperty("--lsd-my", `${y.toFixed(1)}px`);
  };
  const onPointerLeave = () => {
    const target = ref.current?.firstElementChild as HTMLElement | null;
    target?.style.setProperty("--lsd-mx", "0px");
    target?.style.setProperty("--lsd-my", "0px");
  };

  return (
    <span ref={ref} className="inline-flex" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      {children}
    </span>
  );
}

/** Sets --lsd-px / --lsd-py on itself from the pointer, for parallax layers inside. */
export function PointerParallax({ children, className = "", depth = 24 }: { children: ReactNode; className?: string; depth?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;
        node.style.setProperty("--lsd-px", `${(x * depth).toFixed(1)}px`);
        node.style.setProperty("--lsd-py", `${(y * depth).toFixed(1)}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [depth]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Splits a headline into words that rise in one after another. */
export function AnimatedWords({ text, className = "", startIndex = 0 }: { text: string; className?: string; startIndex?: number }) {
  return (
    <span className={`lsd-words ${className}`}>
      {text.split(" ").map((word, index) => (
        <span key={`${word}-${index}`} style={{ ["--i" as string]: startIndex + index }}>
          {word}
          {"\u00a0"}
        </span>
      ))}
    </span>
  );
}

/** Counts from 0 to `value` when it scrolls into view. */
export function CountUp({ value, duration = 1600, locale }: { value: number; duration?: number; locale: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const format = (n: number) => new Intl.NumberFormat(locale).format(Math.round(n));
    if (prefersReducedMotion()) {
      node.textContent = format(value);
      return;
    }
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        node.textContent = format(value * eased);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration, locale]);

  return <span ref={ref}>{new Intl.NumberFormat(locale).format(0)}</span>;
}