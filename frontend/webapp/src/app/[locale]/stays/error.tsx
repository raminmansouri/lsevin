"use client";

import { useTranslations } from "next-intl";

/** Unexpected render failure inside stays: a retry, never a raw error. */
export default function StaysError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("StayApp.explore");
  return (
    <div className="px-4 py-16 text-center" role="alert" data-testid="stays-error">
      <p className="text-lg font-bold">{t("errorTitle")}</p>
      <p className="mt-1 text-sm text-slate-600">{t("errorText")}</p>
      <button type="button" onClick={reset} className="mt-4 min-h-11 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white">
        {t("retry")}
      </button>
    </div>
  );
}
