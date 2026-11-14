import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("StayApp.explore");
  return (
    <div className="space-y-4 px-4 pt-4 sm:px-6" role="status" aria-live="polite" data-testid="stays-loading">
      <span className="sr-only">{t("loading")}</span>
      <div className="h-36 animate-pulse rounded-3xl bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
