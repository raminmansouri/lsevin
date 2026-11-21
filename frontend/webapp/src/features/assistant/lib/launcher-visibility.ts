"use client";

import { useEffect, useState } from "react";

const HIDDEN = /\/(cart|checkout|payment|pay|reserve|booking|booking-v2)(\/|$)|\/shop\/product\/|\/products\/[^/]+/;

const RAISED = /\/(service|services|provider|providers|specialist|packages|offers|medical|consultation)\/[^/]+/;

export function isAssistantHidden(pathname: string) {
  return HIDDEN.test(pathname);
}

export function isAssistantRaised(pathname: string) {
  return RAISED.test(pathname);
}

export function isAssistantHome(pathname: string) {
  return /^(\/[a-z]{2})?\/?$/.test(pathname) || pathname.endsWith("/n/app/mobile/home");
}

export function useScrollTucked(delay = 900) {
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    let timer: number | undefined;
    const onScroll = () => {
      if (window.innerWidth >= 768) return;
      setTucked(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setTucked(false), delay);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, [delay]);
  return tucked;
}