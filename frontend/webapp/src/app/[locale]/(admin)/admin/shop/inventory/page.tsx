import Link from "next/link";

import { listInventoryRows } from "@/features/shop/api/admin.repository";
import { adjustInventoryForm } from "@/features/shop/actions/admin.actions";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const rows = await listInventoryRows();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">← Dashboard</Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Warehouse</th>
              <th className="px-4 py-3">On hand</th>
              <th className="px-4 py-3">Reserved</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{r.product_name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.sku ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{r.warehouse_name}</td>
                <td className="px-4 py-3">{r.on_hand}</td>
                <td className="px-4 py-3">{r.reserved}</td>
                <td className={`px-4 py-3 font-semibold ${r.available <= r.reorder_threshold ? "text-amber-600" : "text-gray-700"}`}>
                  {r.available}
                </td>
                <td className="px-4 py-3">
                  <form action={adjustInventoryForm} className="flex items-center gap-1">
                    <input type="hidden" name="inventoryId" value={r.id} />
                    <input name="delta" type="number" defaultValue={0} className="h-8 w-16 rounded border border-gray-300 px-1 text-sm" />
                    <input name="reason" placeholder="reason" className="h-8 w-32 rounded border border-gray-300 px-1 text-sm" required />
                    <button className="h-8 rounded bg-[#083f30] px-2 text-xs font-semibold text-white">Apply</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-400">Every adjustment records actor + reason in shop.inventory_movements (SHP-INV-005).</p>
    </div>
  );
}
