"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { PORTAL_LOCALES, PORTAL_LOCALE_COOKIE, type PortalLocale } from "@core/i18n/config";

export function LocaleSwitcher({ currentLocale, label }: { currentLocale: PortalLocale; label: string }) {
  const [pending, setPending] = useState(false);

  return (
    <label className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-2 py-1.5 text-xs font-semibold text-slate-700">
      <Languages size={15} aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="bg-transparent outline-none"
        value={currentLocale}
        disabled={pending}
        onChange={(event) => {
          setPending(true);
          const value = event.target.value;
          const domain = process.env.NEXT_PUBLIC_LOCALE_COOKIE_DOMAIN;
          document.cookie = `${PORTAL_LOCALE_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax${domain ? `; Domain=${domain}` : ""}`;
          window.location.reload();
        }}
      >
        {PORTAL_LOCALES.map((item) => <option key={item.locale} value={item.locale}>{item.label}</option>)}
      </select>
    </label>
  );
}
