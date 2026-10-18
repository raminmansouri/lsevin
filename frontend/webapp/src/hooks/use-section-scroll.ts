"use client";

import { useEffect, useRef, useState } from "react";

/** Scroll after the selected section has committed, including repeated clicks. */
export function useSectionScroll(active: boolean) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [request, setRequest] = useState(0);
  useEffect(() => {
    if (active && request)
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }, [active, request]);
  return { sectionRef, requestScroll: () => setRequest((value) => value + 1) };
}
