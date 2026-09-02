import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getStockReconciliation } from "@/features/shop/api/admin.repository";

export const dynamic = "force-dynamic";

/**
 * SHP-V03-014 — stock reconciliation. Flags rows where the running `reserved`
 * counter drifts from live open-order demand, impossible quantities (guarded by
 * DB CHECKs but surfaced anyway), low availability, and stale physical counts.
 */
export default async function AdminStockReconciliationPage() {
  const t = await getTranslations("ShopAdmin");
  const rows = await getStockReconciliation();

  const drift = rows.filter((r) => Number(r.reserved_drift) !== 0);
  const impossible = rows.filter((r) => r.impossible);
  const low = rows.filter((r) => Number(r.available) <= Number(r.reorder_threshold));
  const stale = rows.filter((r) => r.stale_count);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("reportStock.title")}</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Stat label={t("reportStock.reservationDrift")} value={drift.length} warn={drift.length > 0} />
        <Stat label={t("reportStock.impossibleQty")} value={impossible.length} warn={impossible.length > 0} />
        <Stat label={t("reportStock.atReorder")} value={low.length} warn={low.length > 0} />
        <Stat label={t("reportStock.staleCounts")} value={stale.length} warn={stale.length > 0} />
      </div>

      <p className="mb-3 text-xs text-gray-500">{t("reportStock.explainer")}</p>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">{t("reportStock.colProduct")}</th>
              <th className="px-4 py-3">{t("reportStock.colSku")}</th>
              <th className="px-4 py-3">{t("reportStock.colOnHand")}</th>
              <th className="px-4 py-3">{t("reportStock.colReserved")}</th>
              <th className="px-4 py-3">{t("reportStock.colExpected")}</th>
              <th className="px-4 py-3">{t("reportStock.colDrift")}</th>
              <th className="px-4 py-3">{t("reportStock.colAvailable")}</th>
              <th className="px-4 py-3">{t("reportStock.colReorder")}</th>
              <th className="px-4 py-3">{t("reportStock.colLastCounted")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => {
              const d = Number(r.reserved_drift);
              return (
                <tr key={`${r.slug}-${r.sku ?? i}`} className={r.impossible ? "bg-red-50" : ""}>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.product_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.sku ?? "—"}</td>
                  <td className="px-4 py-3">{r.on_hand}</td>
                  <td className="px-4 py-3">{r.reserved}</td>
                  <td className="px-4 py-3 text-gray-500">{r.expected_reserved}</td>
                  <td className={`px-4 py-3 font-semibold ${d !== 0 ? "text-amber-600" : "text-gray-400"}`}>
                    {d > 0 ? `+${d}` : d}
                  </td>
                  <td className={`px-4 py-3 ${Number(r.available) <= Number(r.reorder_threshold) ? "font-semibold text-amber-600" : ""}`}>
                    {r.available}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.reorder_threshold}</td>
                  <td className={`px-4 py-3 text-xs ${r.stale_count ? "text-amber-600" : "text-gray-500"}`}>
                    {r.last_counted_at ? new Date(r.last_counted_at).toLocaleDateString() : t("reportStock.never")}
                  </td>
                </tr>
              );
            })}
            {!rows.length ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">{t("reportStock.allReconciles")}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`mt-2 text-2xl font-bold ${warn ? "text-amber-600" : "text-gray-900"}`}>{value}</div>
    </div>
  );
}
