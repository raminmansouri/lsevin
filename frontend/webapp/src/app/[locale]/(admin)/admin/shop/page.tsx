import Link from "next/link";

import { getAdminDashboardSummary, getExceptionQueues } from "@/features/shop/api/admin.repository";

export const dynamic = "force-dynamic";

const EMPTY_SUMMARY = {
  ordersMonth: 0,
  paidSales: 0,
  avgOrderValue: 0,
  pendingFulfilment: 0,
  exceptions: 0,
  productCount: 0,
  activeProducts: 0,
  lowStockCount: 0,
  recentOrders: [] as any[],
};

export default async function AdminShopDashboardPage() {
  // One failing query must not blank the whole dashboard — each half degrades
  // independently and `error.tsx` catches anything that still slips through.
  const [s, exc] = await Promise.all([
    getAdminDashboardSummary().catch((e) => {
      console.error("[admin/shop] dashboard summary failed:", e);
      return EMPTY_SUMMARY;
    }),
    getExceptionQueues().catch((e) => {
      console.error("[admin/shop] exception queues failed:", e);
      return {} as Record<string, number>;
    }),
  ]);

  const exceptions: Array<{ label: string; value: number; href: string }> = [
    { label: "Stuck payments (>2d)", value: exc.stuck_payments ?? 0, href: "/admin/shop/orders?status=awaiting_payment" },
    { label: "Unfulfilled paid orders", value: exc.unfulfilled_paid ?? 0, href: "/admin/shop/orders?status=paid" },
    { label: "Failed payments (7d)", value: exc.recent_failed_payments ?? 0, href: "/admin/shop/orders?paymentStatus=failed" },
    { label: "Pending returns", value: exc.pending_returns ?? 0, href: "/admin/shop/returns" },
    { label: "Refunds pending", value: exc.refund_pending ?? 0, href: "/admin/shop/orders?status=cancelled" },
    { label: "Stalled shipments (>2d)", value: exc.stalled_shipments ?? 0, href: "/admin/shop/orders" },
  ];

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
            ["Returns", "/admin/shop/returns"],
            ["Relation report", "/admin/shop/reports/relations"],
            ["Stock report", "/admin/shop/reports/stock"],
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

      <h2 className="mb-3 mt-8 text-lg font-bold text-gray-900">Exception queues (SHP-V03-013)</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {exceptions.map((e) => (
          <Link
            key={e.label}
            href={e.href}
            className={`rounded-xl border p-4 ${e.value > 0 ? "border-amber-300 bg-amber-50" : "border-gray-100 bg-white"}`}
          >
            <div className="text-sm text-gray-600">{e.label}</div>
            <div className={`mt-1 text-xl font-bold ${e.value > 0 ? "text-amber-700" : "text-gray-400"}`}>{e.value}</div>
          </Link>
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
