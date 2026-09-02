import Link from "next/link";
import { getTranslations } from "next-intl/server";

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

const NAV: Array<[navKey: string, href: string]> = [
  ["orders", "/admin/shop/orders"],
  ["products", "/admin/shop/products"],
  ["categories", "/admin/shop/categories"],
  ["brands", "/admin/shop/brands"],
  ["attributes", "/admin/shop/attributes"],
  ["coupons", "/admin/shop/coupons"],
  ["inventory", "/admin/shop/inventory"],
  ["delivery", "/admin/shop/delivery"],
  ["merchandising", "/admin/shop/merchandising"],
  ["reviews", "/admin/shop/reviews"],
  ["returns", "/admin/shop/returns"],
  ["relationReport", "/admin/shop/reports/relations"],
  ["stockReport", "/admin/shop/reports/stock"],
  ["settings", "/admin/shop/settings"],
];

export default async function AdminShopDashboardPage() {
  const t = await getTranslations("ShopAdmin");
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

  const orderStatus = (v: string) => (t.has(`enum.orderStatus.${v}` as never) ? t(`enum.orderStatus.${v}` as never) : v);
  const paymentStatus = (v: string) => (t.has(`enum.paymentStatus.${v}` as never) ? t(`enum.paymentStatus.${v}` as never) : v);

  const exceptions = [
    { key: "excStuckPayments", value: exc.stuck_payments ?? 0, href: "/admin/shop/orders?status=awaiting_payment" },
    { key: "excUnfulfilledPaid", value: exc.unfulfilled_paid ?? 0, href: "/admin/shop/orders?status=paid" },
    { key: "excFailedPayments", value: exc.recent_failed_payments ?? 0, href: "/admin/shop/orders?paymentStatus=failed" },
    { key: "excPendingReturns", value: exc.pending_returns ?? 0, href: "/admin/shop/returns" },
    { key: "excRefundsPending", value: exc.refund_pending ?? 0, href: "/admin/shop/orders?status=cancelled" },
    { key: "excStalledShipments", value: exc.stalled_shipments ?? 0, href: "/admin/shop/orders" },
  ];

  const cards = [
    { key: "cardOrdersMonth", value: s.ordersMonth },
    { key: "cardPaidSales", value: s.paidSales.toFixed(2) },
    { key: "cardAvgOrder", value: s.avgOrderValue.toFixed(2) },
    { key: "cardPendingFulfilment", value: s.pendingFulfilment, warn: s.pendingFulfilment > 0 },
    { key: "cardExceptions", value: s.exceptions, warn: s.exceptions > 0 },
    { key: "cardLowStock", value: s.lowStockCount, warn: s.lowStockCount > 0 },
    { key: "cardActiveProducts", value: `${s.activeProducts} / ${s.productCount}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.title")}</h1>
        <nav className="flex flex-wrap gap-2 text-sm">
          {NAV.map(([navKey, h]) => (
            <Link key={h} href={h} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-700">
              {t(`nav.${navKey}` as never)}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.key} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">{t(`dashboard.${c.key}` as never)}</div>
            <div className={`mt-2 text-2xl font-bold ${c.warn ? "text-amber-600" : "text-gray-900"}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold text-gray-900">{t("dashboard.exceptionsTitle")}</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {exceptions.map((e) => (
          <Link
            key={e.key}
            href={e.href}
            className={`rounded-xl border p-4 ${e.value > 0 ? "border-amber-300 bg-amber-50" : "border-gray-100 bg-white"}`}
          >
            <div className="text-sm text-gray-600">{t(`dashboard.${e.key}` as never)}</div>
            <div className={`mt-1 text-xl font-bold ${e.value > 0 ? "text-amber-700" : "text-gray-400"}`}>{e.value}</div>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold text-gray-900">{t("dashboard.recentOrders")}</h2>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">{t("dashboard.colOrder")}</th>
              <th className="px-4 py-3">{t("dashboard.colEmail")}</th>
              <th className="px-4 py-3">{t("dashboard.colStatus")}</th>
              <th className="px-4 py-3">{t("dashboard.colPayment")}</th>
              <th className="px-4 py-3">{t("dashboard.colTotal")}</th>
              <th className="px-4 py-3">{t("dashboard.colPlaced")}</th>
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
                <td className="px-4 py-3">{orderStatus(o.status)}</td>
                <td className="px-4 py-3">{paymentStatus(o.payment_status)}</td>
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
