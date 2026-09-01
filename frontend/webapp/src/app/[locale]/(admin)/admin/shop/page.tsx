import Link from "next/link";

import { getAdminDashboardSummary } from "@/features/shop/api/admin.repository";

export const dynamic = "force-dynamic";

export default async function AdminShopDashboardPage() {
  const s = await getAdminDashboardSummary();

  const cards = [
    { label: "Orders (this month)", value: s.ordersMonth },
    { label: "Paid sales", value: s.paidSales.toFixed(2) },
    { label: "Avg. order value", value: s.avgOrderValue.toFixed(2) },
    { label: "Pending fulfilment", value: s.pendingFulfilment, warn: s.pendingFulfilment > 0 },
    { label: "Payment / review exceptions", value: s.exceptions, warn: s.exceptions > 0 },
    { label: "Low stock", value: s.lowStockCount, warn: s.lowStockCount > 0 },
    { label: "Active products", value: `${s.activeProducts} / ${s.productCount}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Shop dashboard</h1>
        <nav className="flex gap-2 text-sm">
          {[
            ["Orders", "/admin/shop/orders"],
            ["Products", "/admin/shop/products"],
            ["Categories", "/admin/shop/categories"],
            ["Brands", "/admin/shop/brands"],
            ["Coupons", "/admin/shop/coupons"],
            ["Inventory", "/admin/shop/inventory"],
            ["Merchandising", "/admin/shop/merchandising"],
            ["Reviews", "/admin/shop/reviews"],
            ["Settings", "/admin/shop/settings"],
          ].map(([l, h]) => (
            <Link key={h} href={h} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-700">
              {l}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className={`mt-2 text-2xl font-bold ${c.warn ? "text-amber-600" : "text-gray-900"}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold text-gray-900">Recent orders</h2>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {s.recentOrders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/shop/orders/${o.id}`} className="font-mono font-semibold text-[#083f30]">
                    {o.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{o.email}</td>
                <td className="px-4 py-3">{o.status}</td>
                <td className="px-4 py-3">{o.payment_status}</td>
                <td className="px-4 py-3">{o.currency} {Number(o.grand_total).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(o.placed_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
