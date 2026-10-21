"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export function TourNotFound() {
  const t = useTranslations("TourApp.detail");
  return (
    <div className="px-4 py-16 text-center" data-testid="tour-not-found">
      <h1 className="text-xl font-bold text-slate-900">{t("notFound")}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">{t("notFoundBody")}</p>
      <Link href="/tours/explore" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white">
        {t("backToExplore")}
      </Link>
    </div>
  );
}
