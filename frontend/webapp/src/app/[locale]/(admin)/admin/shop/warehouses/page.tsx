import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listWarehousesAdmin } from "@/features/shop/api/admin.repository";
import { WarehouseForm } from "@/features/shop/components/admin/WarehouseForm";

export const dynamic = "force-dynamic";

/**
 * SHP-V03-001 — multi-warehouse inventory allocation policy. Reservation picks
 * the highest-priority active warehouse that can fully fill a line (see
 * `checkout.repository.ts`); this page is where that priority is set.
 */
export default async function AdminWarehousesPage() {
  const t = await getTranslations("ShopAdmin");
  const rows = await listWarehousesAdmin();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("warehouses.title")}</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
      </div>
      <p className="mb-4 max-w-3xl text-xs text-gray-500">{t("warehouses.hint")}</p>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">{t("warehouses.colWarehouse")}</th>
              <th className="px-4 py-3">{t("warehouses.colCode")}</th>
              <th className="px-4 py-3">{t("warehouses.colLocation")}</th>
              <th className="px-4 py-3">{t("warehouses.colSkus")}</th>
              <th className="px-4 py-3">{t("warehouses.colOnHand")}</th>
              <th className="px-4 py-3">{t("warehouses.colReserved")}</th>
              <th className="px-4 py-3">{t("warehouses.colPriority")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((w: any) => (
              <tr key={w.id}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {w.name}
                  {w.is_default ? <span className="ms-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">{t("warehouses.isDefault")}</span> : null}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{w.code}</td>
                <td className="px-4 py-3 text-gray-600">{[w.city, w.country].filter(Boolean).join(", ") || "—"}</td>
                <td className="px-4 py-3">{w.skus}</td>
                <td className="px-4 py-3">{w.on_hand}</td>
                <td className="px-4 py-3">{w.reserved}</td>
                <td className="px-4 py-3">
                  <WarehouseForm warehouse={{ id: w.id, priority: w.priority, is_active: w.is_active, is_default: w.is_default }} />
                </td>
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">{t("warehouses.noWarehouses")}</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
