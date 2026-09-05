import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/** Localized storefront 404 (SHP-UX-018). */
export default async function ShopNotFound() {
  const t = await getTranslations("Shop");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 text-center">
      <div className="text-4xl" aria-hidden="true">🔍</div>
      <h1 className="mt-3 text-lg font-extrabold text-neutral-900">{t("notFoundTitle")}</h1>
      <p className="mt-1 max-w-xs text-sm text-neutral-500">{t("notFoundBody")}</p>
      <Link
        href="/n/app/mobile/shop"
        className="mt-5 rounded-full bg-[#083f30] px-5 py-2 text-sm font-semibold text-white"
      >
        {t("backToShop")}
      </Link>
    </div>
  );
}
