"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

/**
 * Storefront error boundary (SHP-UX-018). Keeps the shop chrome minimal and
 * offers retry + a way back instead of the app-wide error screen.
 */
export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("Shop");

  useEffect(() => {
    console.error("[shop] render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 text-center">
      <div className="text-4xl" aria-hidden="true">🛒</div>
      <h1 className="mt-3 text-lg font-extrabold text-neutral-900">{t("somethingWrong")}</h1>
      <p className="mt-1 max-w-xs text-sm text-neutral-500">{t("errorBody")}</p>
      <div className="mt-5 flex gap-2">
        <button
          onClick={reset}
          className="rounded-full bg-[#083f30] px-5 py-2 text-sm font-semibold text-white"
        >
          {t("retry")}
        </button>
        <Link
          href="/n/app/mobile/shop"
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#083f30] ring-1 ring-black/[0.08]"
        >
          {t("backToShop")}
        </Link>
      </div>
    </div>
  );
}
