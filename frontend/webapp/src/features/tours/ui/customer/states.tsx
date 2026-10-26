"use client";

import { useEffect, useState } from "react";
import { RotateCcw, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

/** Loading skeleton for Tours pages (C-008). */
export function ToursLoading() {
  const t = useTranslations("TourApp.common");
  return (
    <div className="space-y-4 px-4 pt-4 sm:px-6" role="status" aria-live="polite" data-testid="tours-loading">
      <span className="sr-only">{t("loading")}</span>
      <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
      <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

/** Error boundary content with retry; distinguishes being offline from a server failure (C-008). */
export function ToursErrorScreen({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("TourApp.errors");
  const tShared = useTranslations("TourShared.common");
  const [offline, setOffline] = useState(false);
  useEffect(() => setOffline(!navigator.onLine), []);
  return (
    <div role="alert" className="px-4 py-16 text-center" data-testid="tours-error-screen">
      {offline ? <WifiOff className="mx-auto size-8 text-slate-400" aria-hidden="true" /> : null}
      <h1 className="mt-2 text-xl font-bold text-slate-900">{t("title")}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">{offline ? tShared("offline") : t("body")}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white">
          <RotateCcw className="size-4" aria-hidden="true" />
          {t("retry")}
        </button>
        <Link href="/tours" className="inline-flex min-h-11 items-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700">
          {t("home")}
        </Link>
      </div>
    </div>
  );
}

export function ToursNotFound() {
  const t = useTranslations("TourApp.errors");
  return (
    <div className="px-4 py-16 text-center" data-testid="tours-not-found">
      <h1 className="text-xl font-bold text-slate-900">{t("notFound")}</h1>
      <Link href="/tours" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white">
        {t("home")}
      </Link>
    </div>
  );
}
