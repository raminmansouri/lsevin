"use client";

export function writeSharedLocaleCookie(locale: string) {
  const secure = window.location.protocol === "https:" ? ";secure" : "";
  document.cookie = "NEXT_LOCALE=;path=/;max-age=0;samesite=lax" + secure;
  const domain = process.env.NEXT_PUBLIC_LSEVIN_COOKIE_DOMAIN?.trim();
  document.cookie = `NEXT_LOCALE=${encodeURIComponent(locale)};path=/;max-age=31536000;samesite=lax${domain ? `;domain=${domain}` : ""}${secure}`;
}
