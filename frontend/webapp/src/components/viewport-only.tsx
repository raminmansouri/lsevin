"use client";

import { Suspense, use, useEffect, useState, type ReactNode } from "react";

/**
 * Hydrates its children only on screens that match `media`.
 *
 * Public pages render a mobile and a desktop tree and hide one with CSS. On a
 * phone the hidden desktop tree was still hydrated: most of the 0.9–3.6 s of
 * main-thread blocking on mobile (2026-11-26 Lighthouse). Here, when the
 * screen does not match, the component suspends during hydration; React then
 * keeps the server HTML as it is (still hidden by CSS, still in the page for
 * crawlers) and runs none of its components or effects. If the window later
 * grows to match (rotation, resize), the promise resolves and React hydrates
 * the subtree then.
 *
 * On the server, and in client navigations on a matching screen, the children
 * render normally. Wrap only content whose own CSS hides it off-`media`.
 */
export function ViewportOnly({ media, children }: { media: string; children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <Gate media={media}>{children}</Gate>
    </Suspense>
  );
}

type Waiter = { promise: Promise<void>; resolve: () => void };
const waiters = new Map<string, Waiter>();

function waiterFor(media: string): Waiter {
  let waiter = waiters.get(media);
  if (!waiter) {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => (resolve = done));
    waiter = { promise, resolve };
    waiters.set(media, waiter);
    const query = window.matchMedia(media);
    const onChange = () => {
      if (!query.matches) return;
      query.removeEventListener("change", onChange);
      waiters.delete(media);
      resolve();
    };
    query.addEventListener("change", onChange);
  }
  return waiter;
}

function Gate({ media, children }: { media: string; children: ReactNode }) {
  const [matches, setMatches] = useState(() => typeof window === "undefined" || window.matchMedia(media).matches);
  useEffect(() => {
    if (matches) return;
    const query = window.matchMedia(media);
    const onChange = () => query.matches && setMatches(true);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [matches, media]);
  if (!matches) use(waiterFor(media).promise);
  return <>{children}</>;
}

/** The desktop layout's breakpoint (Tailwind `xl`). */
export const DESKTOP_MEDIA = "(min-width: 1280px)";
