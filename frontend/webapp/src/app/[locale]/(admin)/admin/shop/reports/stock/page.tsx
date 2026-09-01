import Link from "next/link";

import { getStockReconciliation } from "@/features/shop/api/admin.repository";

export const dynamic = "force-dynamic";

/**
 * SHP-V03-014 — stock reconciliation. Flags rows where the running `reserved`
 * counter drifts from live open-order demand, impossible quantities (guarded by
 * DB CHECKs but surfaced anyway), low availability, and stale physical counts.
 */
export default async function AdminStockReconciliationPage() {
  const rows = await getStockReconciliation();

  const drift = rows.filter((r) => Number(r.reserved_drift) !== 0);
  const impossible = rows.filter((r) => r.impossible);
  const low = rows.filter((r) => Number(r.available) <= Number(r.reorder_threshold));
  const stale = rows.filter((r) => r.stale_count);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Stock reconciliation</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">← Dashboard</Link>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Stat label="Reservation drift" value={drift.length} warn={drift.length > 0} />
        <Stat label="Impossible quantities" value={impossible.length} warn={impossible.length > 0} />
        <Stat label="At / below reorder" value={low.length} warn={low.length > 0} />
        <Stat label="Stale counts (>90d)" value={stale.length} warn={stale.length > 0} />
      </div>

      <p className="mb-3 text-xs text-gray-500">
        “Expected reserved” = un-shipped quantity across orders in
        <code> pending / awaiting_payment / paid / processing / partially_shipped</code>. A non-zero
        drift means the <code>inventory.reserved</code> counter and live demand disagree — usually a
        release/convert that did not run.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">On hand</th>
              <th className="px-4 py-3">Reserved</th>
              <th className="px-4 py-3">Expected</th>
              <th className="px-4 py-3">Drift</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Reorder</th>
              <th className="px-4 py-3">Last counted</th>
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
                    {r.last_counted_at ? new Date(r.last_counted_at).toLocaleDateString() : "never"}
                  </td>
                </tr>
              );
            })}
            {!rows.length ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                  Everything reconciles — no drift, no impossible quantities, nothing stale or low.
                </td>
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
