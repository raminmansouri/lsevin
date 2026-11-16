"use client";

import { useEffect, useState } from "react";

/**
 * True once React has attached its handlers. The panels expose it as `data-hydrated` so an
 * automated browser (and anyone debugging a "my click did nothing" report) can tell server-rendered
 * HTML that is not interactive yet from a live control.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
