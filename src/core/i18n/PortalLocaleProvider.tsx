"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_PORTAL_LOCALE_HEADER, normalizePortalLocale } from "./config";

const PortalLocaleContext = createContext(normalizePortalLocale(DEFAULT_PORTAL_LOCALE_HEADER));

export function PortalLocaleProvider({ locale, children }: { locale: string; children: React.ReactNode }) {
  const value = useMemo(() => normalizePortalLocale(locale), [locale]);
  return <PortalLocaleContext.Provider value={value}>{children}</PortalLocaleContext.Provider>;
}

export function usePortalLocale() {
  return useContext(PortalLocaleContext);
}
