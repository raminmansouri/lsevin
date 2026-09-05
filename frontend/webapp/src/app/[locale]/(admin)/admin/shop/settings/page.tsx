import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getShopSettingsView } from "@/features/shop/api/admin.repository";
import { setPricingModeForm } from "@/features/shop/actions/admin.actions";

export const dynamic = "force-dynamic";

export default async function AdminShopSettingsPage() {
  const t = await getTranslations("ShopAdmin");
  const s = await getShopSettingsView();

  const modes = [
    ["market_default", t("settings.marketDefault")],
    ["market_default_with_selector", t("settings.marketDefaultSelector")],
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("settings.title")}</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
      </div>

      <section className="max-w-xl rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">{t("settings.pricingModeTitle")}</h2>
        <p className="mt-1 text-xs text-gray-500">{t("settings.pricingModeHint")}</p>
        <form action={setPricingModeForm} className="mt-4 space-y-3">
          {modes.map(([value, label]) => (
            <label key={value} className="flex items-start gap-2 text-sm">
              <input type="radio" name="mode" value={value} defaultChecked={s.pricingMode === value} className="mt-1" />
              <span>{label}</span>
            </label>
          ))}
          <button className="rounded-lg bg-[#083f30] px-4 py-2 text-sm font-semibold text-white">{t("settings.save")}</button>
        </form>
        <p className="mt-3 text-xs text-gray-400">{t("settings.defaultFallback")}: <b>{s.defaultCurrency}</b></p>
      </section>

      <section className="mt-6 max-w-3xl rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">{t("settings.financeCurrenciesTitle")}</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="py-2">{t("settings.colCode")}</th>
              <th className="py-2">{t("settings.colName")}</th>
              <th className="py-2">{t("settings.colDisplay")}</th>
              <th className="py-2">{t("settings.colPayment")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {s.currencies.map((c: any) => (
              <tr key={c.code}>
                <td className="py-2 font-mono">{c.code}</td>
                <td className="py-2">{c.name}</td>
                <td className="py-2">{c.is_display_enabled ? "✓" : "—"}</td>
                <td className="py-2">{c.is_payment_enabled ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-gray-400">
          {t("settings.manageUnderFinance")}{" "}
          {t("settings.countryDefaults", {
            list:
              s.countryDefaults.map((d: any) => `${d.country_code}→${d.currency_code}`).join(", ") ||
              t("settings.countryDefaultsNone"),
          })}
        </p>
      </section>
    </div>
  );
}
