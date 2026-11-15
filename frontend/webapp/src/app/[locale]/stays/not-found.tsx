import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export default async function StaysNotFound() {
  const t = await getTranslations("StayApp.detail");
  const tNav = await getTranslations("StayApp.nav");
  return (
    <div className="px-4 py-16 text-center" data-testid="stays-not-found">
      <h1 className="text-xl font-bold">{t("notFoundTitle")}</h1>
      <p className="mt-2 text-sm text-slate-600">{t("notFoundText")}</p>
      <Link href="/stays/explore" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-5 text-sm font-bold text-white">
        {tNav("explore")}
      </Link>
    </div>
  );
}
