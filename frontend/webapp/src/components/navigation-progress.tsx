"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A thin bar at the top of the screen while an in-app link navigation is on
 * its way. The public listing pages no longer have route `loading.tsx`
 * skeletons: those wrapped the whole page in a Suspense boundary, so even the
 * first load streamed the content into a hidden block that React revealed only
 * after the page's scripts ran (the phone LCP moved from ~1 s to ~5 s,
 * 2026-11-28). This bar keeps the "something is happening" feedback for clicks.
 *
 * Shown only if the navigation takes longer than SHOW_AFTER_MS; done when the
 * address changes; gives up after GIVE_UP_MS (a link that only opened a dialog).
 */
const SHOW_AFTER_MS = 150;
const GIVE_UP_MS = 10_000;

function internalTarget(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return null;
  let url: URL;
  try {
    url = new URL(anchor.href, location.href);
  } catch {
    return null;
  }
  if (url.origin !== location.origin) return null;
  if (url.pathname === location.pathname && url.search === location.search) return null;
  return url.href;
}

export function NavigationProgress() {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const timers = useRef<number[]>([]);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const clear = () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
      if (frame.current != null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
    const finish = () => {
      clear();
      setPhase((current) => (current === "running" ? "done" : "idle"));
      timers.current.push(window.setTimeout(() => setPhase("idle"), 300));
    };
    const onClick = (event: MouseEvent) => {
      if (!internalTarget(event)) return;
      clear();
      const from = location.href;
      // Watch the address: client navigations change it when the new page commits.
      const watch = () => {
        if (location.href !== from) return finish();
        frame.current = requestAnimationFrame(watch);
      };
      frame.current = requestAnimationFrame(watch);
      timers.current.push(window.setTimeout(() => setPhase("running"), SHOW_AFTER_MS));
      timers.current.push(window.setTimeout(finish, GIVE_UP_MS));
    };
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", finish);
    return () => {
      clear();
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", finish);
    };
  }, []);

  if (phase === "idle") return null;
  return (
    <div
      aria-hidden="true"
      data-testid="navigation-progress"
      className="pointer-events-none fixed inset-x-0 top-0 z-[10000] h-0.5 overflow-hidden"
    >
      <div
        className={
          phase === "running"
            ? "h-full w-[85%] origin-left bg-[#eacb7f] rtl:ms-auto rtl:origin-right"
            : "h-full w-full bg-[#eacb7f] opacity-0 transition-opacity duration-300"
        }
        style={phase === "running" ? { animation: "navigation-progress-grow 8s ease-out forwards" } : undefined}
      />
      <style>{`@keyframes navigation-progress-grow{from{transform:scaleX(0.05)}to{transform:scaleX(1)}}`}</style>
    </div>
  );
}
