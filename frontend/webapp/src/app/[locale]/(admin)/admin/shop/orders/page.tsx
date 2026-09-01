import Link from "next/link";

import { listAdminOrders } from "@/features/shop/api/admin.repository";

export const dynamic = "force-dynamic";

const ORDER_STATUSES = ["", "awaiting_payment", "paid", "processing", "shipped", "completed", "cancelled", "refunded"];
const PAYMENT_STATUSES = ["", "pending", "captured", "failed", "refunded"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const val = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) as string | undefined;

  const filters = {
    q: val("q"),
    status: val("status") || undefined,
    paymentStatus: val("paymentStatus") || undefined,
    fulfillmentStatus: val("fulfillmentStatus") || undefined,
  };
  const rows = await listAdminOrders(filters);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">← Dashboard</Link>
      </div>

      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Order #, email…"
          className="h-9 w-56 rounded-lg border border-gray-200 px-3 text-sm"
        />
        <select name="status" defaultValue={filters.status ?? ""} className="h-9 rounded-lg border border-gray-200 px-2 text-sm">
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s || "Any status"}</option>
          ))}
        </select>
        <select name="paymentStatus" defaultValue={filters.paymentStatus ?? ""} className="h-9 rounded-lg border border-gray-200 px-2 text-sm">
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s || "Any payment"}</option>
          ))}
        </select>
        <button className="h-9 rounded-lg bg-[#083f30] px-4 text-sm font-semibold text-white">Filter</button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Fulfilment</th>
              <th className="px-4 py-3">Review</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/shop/orders/${o.id}`} className="font-mono font-semibold text-[#083f30]">
                    {o.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{o.email}</td>
                <td className="px-4 py-3">{o.item_count}</td>
                <td className="px-4 py-3">{o.status}</td>
                <td className="px-4 py-3">{o.payment_status}</td>
                <td className="px-4 py-3">{o.fulfillment_status}</td>
                <td className="px-4 py-3">{o.review_status}</td>
                <td className="px-4 py-3">{o.currency} {Number(o.grand_total).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(o.placed_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-400">No orders match.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
