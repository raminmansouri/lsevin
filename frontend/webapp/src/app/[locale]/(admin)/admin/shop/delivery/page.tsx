import Link from "next/link";

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
  const rows = await listDeliveryMethodsAdmin();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Delivery methods</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">← Dashboard</Link>
      </div>

      <p className="mb-4 max-w-3xl text-xs text-gray-500">
        <code>rules.geo</code> is enforced at checkout: <code>includeCountries</code> (allow-list),{" "}
        <code>excludeCountries</code> (deny-list), <code>includeRegions</code> (state/region allow-list),{" "}
        <code>surcharges[].amount</code> (added to the base fee for matching countries/regions) and{" "}
        <code>etaOverrides[]</code>. Country/region codes are compared case-insensitively. Empty{" "}
        <code>rules</code> = ships everywhere.
      </p>

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
                <input type="checkbox" name="isActive" defaultChecked={m.is_active} /> active
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="text-xs text-gray-500">
                Base fee
                <input name="baseFee" type="number" step="0.01" min={0} defaultValue={m.base_fee} className={input} />
              </label>
              <label className="text-xs text-gray-500">
                ETA min (days)
                <input name="estimatedDaysMin" type="number" min={0} defaultValue={m.estimated_days_min ?? ""} className={input} />
              </label>
              <label className="text-xs text-gray-500">
                ETA max (days)
                <input name="estimatedDaysMax" type="number" min={0} defaultValue={m.estimated_days_max ?? ""} className={input} />
              </label>
            </div>

            <label className="mt-3 block text-xs text-gray-500">
              Rules (JSON)
              <textarea
                name="rules"
                rows={8}
                defaultValue={JSON.stringify(m.rules ?? {}, null, 2)}
                placeholder={EXAMPLE}
                className="mt-1 w-full rounded border border-gray-300 p-2 font-mono text-xs"
              />
            </label>

            <button className="mt-3 rounded-lg bg-[#083f30] px-4 py-2 text-sm font-semibold text-white">Save</button>
          </form>
        ))}
        {!rows.length ? <p className="text-sm text-gray-400">No delivery methods configured.</p> : null}
      </div>
    </div>
  );
}
