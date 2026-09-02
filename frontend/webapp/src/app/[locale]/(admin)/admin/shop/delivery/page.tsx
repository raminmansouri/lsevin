import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listDeliveryMethodsAdmin } from "@/features/shop/api/admin.repository";
import { updateDeliveryMethodForm } from "@/features/shop/actions/admin-catalog.actions";

export const dynamic = "force-dynamic";

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";

const EXAMPLE = `{
  "geo": {
    "includeCountries": ["IR", "TR"],
    "excludeCountries": [],
    "surcharges": [{ "countries": ["AE", "GB"], "amount": 8 }],
    "etaOverrides": [{ "countries": ["GB"], "minDays": 7, "maxDays": 14 }]
  }
}`;

/**
 * SHP-V03-012 — delivery methods with geographic eligibility, surcharges and ETA
 * overrides. Rules live in `shop.delivery_methods.rules` and are enforced
 * server-side in `getDeliveryOptions` / `isDeliveryMethodEligible`.
 */
export default async function AdminDeliveryPage() {
  const t = await getTranslations("ShopAdmin");
  const rows = await listDeliveryMethodsAdmin();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("delivery.title")}</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
      </div>

      <p className="mb-4 max-w-3xl text-xs text-gray-500" dir="ltr">{t("delivery.hint")}</p>

      <div className="space-y-4">
        {rows.map((m: any) => (
          <form key={m.id} action={updateDeliveryMethodForm} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <input type="hidden" name="id" value={m.id} />
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900">{m.name}</span>
                <span className="ms-2 font-mono text-xs text-gray-400">{m.code}</span>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isActive" defaultChecked={m.is_active} /> {t("delivery.active")}
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="text-xs text-gray-500">
                {t("delivery.baseFee")}
                <input name="baseFee" type="number" step="0.01" min={0} defaultValue={m.base_fee} className={input} />
              </label>
              <label className="text-xs text-gray-500">
                {t("delivery.etaMin")}
                <input name="estimatedDaysMin" type="number" min={0} defaultValue={m.estimated_days_min ?? ""} className={input} />
              </label>
              <label className="text-xs text-gray-500">
                {t("delivery.etaMax")}
                <input name="estimatedDaysMax" type="number" min={0} defaultValue={m.estimated_days_max ?? ""} className={input} />
              </label>
            </div>

            <label className="mt-3 block text-xs text-gray-500">
              {t("delivery.rulesJson")}
              <textarea
                name="rules"
                rows={8}
                defaultValue={JSON.stringify(m.rules ?? {}, null, 2)}
                placeholder={EXAMPLE}
                dir="ltr"
                className="mt-1 w-full rounded border border-gray-300 p-2 font-mono text-xs"
              />
            </label>

            <button className="mt-3 rounded-lg bg-[#083f30] px-4 py-2 text-sm font-semibold text-white">{t("delivery.save")}</button>
          </form>
        ))}
        {!rows.length ? <p className="text-sm text-gray-400">{t("delivery.noMethods")}</p> : null}
      </div>
    </div>
  );
}
