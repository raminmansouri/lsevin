import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listAdminOrders } from "@/features/shop/api/admin.repository";

export const dynamic = "force-dynamic";

const ORDER_STATUSES = [
  "",
  "pending",
  "awaiting_payment",
  "paid",
  "processing",
  "partially_shipped",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
  "partially_refunded",
  "returned",
];
const PAYMENT_STATUSES = ["", "pending", "authorized", "captured", "failed", "voided", "partially_refunded", "refunded"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("ShopAdmin");
  const sp = await searchParams;
  const val = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) as string | undefined;

  const filters = {
    q: val("q"),
    status: val("status") || undefined,
    paymentStatus: val("paymentStatus") || undefined,
    fulfillmentStatus: val("fulfillmentStatus") || undefined,
  };
  const rows = await listAdminOrders(filters);

  const orderStatus = (v: string) => (t.has(`enum.orderStatus.${v}` as never) ? t(`enum.orderStatus.${v}` as never) : v);
  const paymentStatus = (v: string) => (t.has(`enum.paymentStatus.${v}` as never) ? t(`enum.paymentStatus.${v}` as never) : v);
  const reviewStatus = (v: string) => (v && t.has(`enum.reviewStatus.${v}` as never) ? t(`enum.reviewStatus.${v}` as never) : v);
  const shipmentStatus = (v: string) => (t.has(`enum.shipmentStatus.${v}` as never) ? t(`enum.shipmentStatus.${v}` as never) : v);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("orders.title")}</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
      </div>

      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder={t("orders.searchPlaceholder")}
          className="h-9 w-56 rounded-lg border border-gray-200 px-3 text-sm"
        />
        <select name="status" defaultValue={filters.status ?? ""} className="h-9 rounded-lg border border-gray-200 px-2 text-sm">
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s ? orderStatus(s) : t("orders.anyStatus")}</option>
          ))}
        </select>
        <select name="paymentStatus" defaultValue={filters.paymentStatus ?? ""} className="h-9 rounded-lg border border-gray-200 px-2 text-sm">
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s ? paymentStatus(s) : t("orders.anyPayment")}</option>
          ))}
        </select>
        <button className="h-9 rounded-lg bg-[#083f30] px-4 text-sm font-semibold text-white">{t("common.filter")}</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">{t("orders.colOrder")}</th>
              <th className="px-4 py-3">{t("orders.colCustomer")}</th>
              <th className="px-4 py-3">{t("orders.colItems")}</th>
              <th className="px-4 py-3">{t("orders.colStatus")}</th>
              <th className="px-4 py-3">{t("orders.colPayment")}</th>
              <th className="px-4 py-3">{t("orders.colFulfilment")}</th>
              <th className="px-4 py-3">{t("orders.colReview")}</th>
              <th className="px-4 py-3">{t("orders.colTotal")}</th>
              <th className="px-4 py-3">{t("orders.colPlaced")}</th>
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
                <td className="px-4 py-3">{orderStatus(o.status)}</td>
                <td className="px-4 py-3">{paymentStatus(o.payment_status)}</td>
                <td className="px-4 py-3">{shipmentStatus(o.fulfillment_status)}</td>
                <td className="px-4 py-3">{reviewStatus(o.review_status)}</td>
                <td className="px-4 py-3">{o.currency} {Number(o.grand_total).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(o.placed_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-400">{t("orders.noneMatch")}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
