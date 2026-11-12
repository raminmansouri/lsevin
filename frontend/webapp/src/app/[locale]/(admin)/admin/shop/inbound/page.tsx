import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { markSellerReceivedForm } from "@/features/shop/actions/fulfilment-admin.actions";
import { listInboundParts } from "@/features/shop/server/seller-handover.service";

export const dynamic = "force-dynamic";

/**
 * Items to receive from partner sellers (e.g. clinics). Lsevin sends every order, so each seller
 * hands its items to Lsevin by its due date (paid date + its handling days). Grouped by seller,
 * with the seller's address and phone for whoever collects; "received" per seller per order.
 */
export default async function AdminInboundPage() {
  const t = await getTranslations("ShopAdmin");
  const locale = await getLocale();
  const sellers = await listInboundParts(locale.split("-")[0] || "fa");
  const i = (k: string, v?: Record<string, string | number>) => t(`inbound.${k}` as never, v as never);
  const statusLabel = (s: string) => (s === "picked_up" ? i("statusHanded") : s === "ready_for_pickup" ? i("statusReady") : i("statusNew"));

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{i("title")}</h1>
        <Link href="/admin/shop/orders" className="text-sm font-medium text-[#083f30]">{t("nav.orders")}</Link>
      </div>
      <p className="mb-4 max-w-3xl text-xs text-gray-500">{i("hint")}</p>

      {!sellers.length ? <p className="text-sm text-gray-400" data-testid="inbound-empty">{i("empty")}</p> : null}

      <div className="space-y-4">
        {sellers.map((group) => (
          <section key={group.sellerId} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm" data-testid="inbound-seller">
            <h2 className="text-base font-bold text-gray-900">🏪 {group.seller?.name || group.sellerName}</h2>
            <div className="mt-1 space-y-0.5 text-xs text-gray-600">
              {group.seller?.address ? <p>{group.seller.address}</p> : null}
              {group.seller?.phone ? (
                <p>
                  <a href={`tel:${group.seller.phone.replace(/[^\d+]/g, "")}`} dir="ltr" className="font-semibold text-[#083f30]">
                    {group.seller.phone}
                  </a>
                </p>
              ) : null}
            </div>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-start text-xs text-gray-500">
                  <th className="py-1 text-start">{i("order")}</th>
                  <th className="py-1 text-start">{i("items")}</th>
                  <th className="py-1 text-start">{i("due")}</th>
                  <th className="py-1 text-start">{i("sellerStatus")}</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {group.parts.map((part) => (
                  <tr key={part.orderId} data-overdue={part.overdue}>
                    <td className="py-2 align-top">
                      <Link href={`/admin/shop/orders/${part.orderId}`} className="font-mono text-[#083f30]">{part.orderNumber}</Link>
                      <span className="block text-xs text-gray-400">
                        {part.fulfillmentMode === "office_pickup" ? i("fulfilmentPickup") : i("fulfilmentDelivery")}
                      </span>
                    </td>
                    <td className="py-2 align-top text-xs text-gray-700">
                      {part.items.map((item, index) => (
                        <span key={index} className="block">{item.name} ×{item.quantity}</span>
                      ))}
                    </td>
                    <td className="py-2 align-top text-xs">
                      {part.dueAt ? new Date(part.dueAt).toLocaleDateString(locale) : "—"}
                      {part.overdue ? (
                        <span className="ms-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">{i("overdue")}</span>
                      ) : null}
                    </td>
                    <td className="py-2 align-top text-xs text-gray-600">{statusLabel(part.sellerStatus)}</td>
                    <td className="py-2 text-end align-top">
                      <form action={markSellerReceivedForm}>
                        <input type="hidden" name="orderId" value={part.orderId} />
                        <input type="hidden" name="sellerId" value={group.sellerId} />
                        <button className="rounded bg-[#083f30] px-3 py-1.5 text-xs font-semibold text-white" data-action="seller-received">
                          {i("markReceived")}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
}
