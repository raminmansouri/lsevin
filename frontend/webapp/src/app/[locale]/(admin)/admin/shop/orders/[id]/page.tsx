import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getAdminOrder } from "@/features/shop/api/admin.repository";
import { markSellerReceivedForm } from "@/features/shop/actions/fulfilment-admin.actions";
import { OfficePickupPanel } from "@/features/shop/components/admin/OfficePickupPanel";
import { getOfficePickup } from "@/features/shop/server/office-pickup.service";
import { listOrderSellerParts } from "@/features/shop/server/seller-handover.service";
import { getOrderRefundView } from "@/features/shop/server/shop-refund.service";
import { getOrderInvoices } from "@/features/shop/server/invoicing.service";
import {
  advanceOrderForm,
  issueInvoiceForm,
  markDeliveredForm,
  markOrderPaidForm,
  recordRefundForm,
  recordShipmentForm,
  reviewOrderForm,
} from "@/features/shop/actions/admin.actions";

import { Fragment } from "react";

export const dynamic = "force-dynamic";

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";
const TRANSITIONS = ["processing", "shipped", "completed", "cancelled", "refunded"];

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("ShopAdmin");
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();
  const [refundView, invoices, sellerParts, officePickup] = await Promise.all([
    getOrderRefundView(id).catch(() => null),
    getOrderInvoices(id).catch(() => []),
    listOrderSellerParts(id),
    order.fulfillment_mode === "office_pickup" ? getOfficePickup(id) : Promise.resolve(null),
  ]);
  const tf = (k: string, v?: Record<string, string | number>) => t(`orderFulfilment.${k}` as never, v as never);
  const isOfficePickup = order.fulfillment_mode === "office_pickup";
  const sellersPending = sellerParts.filter((p) => !p.received_at).length;
  const cancelled = ["cancelled", "refunded"].includes(order.status);

  const d = (k: string) => t(`orderDetail.${k}` as never);
  const orderStatus = (v: string) => (t.has(`enum.orderStatus.${v}` as never) ? t(`enum.orderStatus.${v}` as never) : v);
  const paymentStatus = (v: string) => (t.has(`enum.paymentStatus.${v}` as never) ? t(`enum.paymentStatus.${v}` as never) : v);
  const shipmentStatus = (v: string) => (t.has(`enum.shipmentStatus.${v}` as never) ? t(`enum.shipmentStatus.${v}` as never) : v);
  const reviewStatus = (v: string) => (v && t.has(`enum.reviewStatus.${v}` as never) ? t(`enum.reviewStatus.${v}` as never) : v);

  const ship = order.addresses.find((a: any) => a.address_type === "shipping") ?? {};

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/admin/shop/orders" className="text-sm font-medium text-[#083f30]">{t("nav.orders")}</Link>
        <h1 className="font-mono text-xl font-bold text-gray-900">{order.order_number}</h1>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold">{orderStatus(order.status)}</span>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold">{t("orders.colPayment")}: {paymentStatus(order.payment_status)}</span>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold">{t("orders.colFulfilment")}: {shipmentStatus(order.fulfillment_status)}</span>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold">{t("orders.colReview")}: {reviewStatus(order.review_status)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <div className="space-y-4">
          <Card title={d("items")}>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {(() => {
                  const multiSeller = new Set(order.items.map((i: any) => i.seller_id)).size > 1;
                  return order.items.map((it: any, index: number) => (
                    <Fragment key={it.id}>
                      {multiSeller && (index === 0 || order.items[index - 1].seller_id !== it.seller_id) ? (
                        <tr>
                          <td colSpan={3} className="bg-[#083f30]/5 px-2 pb-1 pt-3 text-xs font-bold text-[#083f30]">
                            🏪 {it.seller_name ?? "—"}
                          </td>
                        </tr>
                      ) : null}
                      <tr>
                        <td className="py-2">
                          {it.name}
                          {it.variant_name ? <span className="text-gray-500"> · {it.variant_name}</span> : null}
                          <div className="text-xs text-gray-400">
                            {it.sku ?? "—"} · {it.source_currency} {Number(it.source_unit_price).toFixed(2)}
                            {it.seller_name && !multiSeller ? <span className="text-[#083f30]"> · 🏪 {it.seller_name}</span> : null}
                          </div>
                        </td>
                        <td className="py-2 text-center">×{it.quantity}</td>
                        <td className="py-2 text-right">{order.currency} {Number(it.line_total).toFixed(2)}</td>
                      </tr>
                    </Fragment>
                  ));
                })()}
              </tbody>
            </table>
            <dl className="mt-3 space-y-1 border-t pt-3 text-sm">
              <Row k={d("subtotal")} v={`${order.currency} ${Number(order.subtotal).toFixed(2)}`} />
              <Row k={d("shipping")} v={`${order.currency} ${Number(order.shipping_total).toFixed(2)}`} />
              {order.tax_total > 0 ? <Row k={d("tax")} v={`${order.currency} ${Number(order.tax_total).toFixed(2)}`} /> : null}
              {order.discount_total > 0 ? <Row k={d("discount")} v={`− ${order.currency} ${Number(order.discount_total).toFixed(2)}`} /> : null}
              <Row k={d("grandTotal")} v={`${order.currency} ${Number(order.grand_total).toFixed(2)}`} bold />
              {order.payment_currency && order.payment_currency !== order.currency ? (
                <Row k={d("payable")} v={`${order.payment_currency} ${Number(order.payment_total).toFixed(2)} (${order.fx_applied_rate})`} />
              ) : null}
            </dl>
            <p className="mt-2 text-xs text-gray-400" dir="ltr">
              {d("fxSnapshot")}: <code>{JSON.stringify(order.fx_snapshot)}</code>
            </p>
          </Card>

          <Card title={d("customerShipping")}>
            <p className="text-sm">{order.email}</p>
            <p className="mt-1 text-sm text-gray-600">
              {ship.full_name}
              <br />
              {ship.address_line_1}{ship.address_line_2 ? `, ${ship.address_line_2}` : ""}
              <br />
              {ship.city}, {ship.country} {ship.postal_code ?? ""}
              <br />
              {ship.phone_number ?? ""}
            </p>
          </Card>

          <Card title={d("paymentAttempts")}>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {order.payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-2">{p.provider} · {p.type}</td>
                    <td className="py-2 text-gray-500">{p.provider_transaction_id ?? "—"}</td>
                    <td className="py-2">{p.currency} {Number(p.amount).toFixed(2)}</td>
                    <td className="py-2 font-semibold">{paymentStatus(p.status)}</td>
                    <td className="py-2 text-gray-400">{new Date(p.create_date).toLocaleString()}</td>
                  </tr>
                ))}
                {!order.payments.length ? <tr><td className="py-3 text-gray-400">{d("noAttempts")}</td></tr> : null}
              </tbody>
            </table>
          </Card>

          <Card title={d("statusHistory")}>
            <ul className="space-y-1 text-sm">
              {order.history.map((h: any) => (
                <li key={h.id} className="text-gray-600">
                  <span className="text-gray-400">{new Date(h.create_date).toLocaleString()}</span> · {h.from_status ? orderStatus(h.from_status) : "—"} → <b>{orderStatus(h.to_status)}</b>
                  {h.note ? ` · ${h.note}` : ""}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Lsevin sends every order: first every partner seller's items are received, then the
              order is shipped, or handed over at the office with the customer's code. */}
          <Card title={tf("title")}>
            <p className="text-sm font-semibold text-gray-900" data-testid="admin-fulfilment-mode">
              {isOfficePickup ? tf("officePickup") : tf("delivery")}
              {order.delivery_method_name ? <span className="font-normal text-gray-500"> · {order.delivery_method_name}</span> : null}
            </p>
            {order.promised_ready_at ? (
              <p className="mt-1 text-xs text-gray-500">
                {t("officePickup.promised" as never, { date: new Date(order.promised_ready_at).toLocaleDateString() } as never)}
              </p>
            ) : null}
            {sellerParts.length ? (
              <div className="mt-3 border-t pt-2">
                <p className="mb-1 text-xs font-bold text-gray-700">{tf("sellers")}</p>
                <ul className="space-y-1 text-sm">
                  {sellerParts.map((part) => (
                    <li key={part.seller_id} className="flex items-center justify-between gap-2">
                      <span>
                        🏪 {part.seller_name ?? "—"}
                        <span className="block text-xs text-gray-500">
                          {part.received_at
                            ? tf("receivedOn", { date: new Date(part.received_at).toLocaleDateString() })
                            : tf("notReceived", { date: part.due_at ? new Date(part.due_at).toLocaleDateString() : "—" })}
                        </span>
                      </span>
                      {!part.received_at && !cancelled ? (
                        <form action={markSellerReceivedForm}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="sellerId" value={part.seller_id} />
                          <button className="rounded bg-[#083f30] px-2 py-1 text-xs font-semibold text-white" data-action="seller-received">
                            {t("inbound.markReceived" as never)}
                          </button>
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {!sellersPending ? <p className="mt-1 text-xs text-green-700">{tf("allReceived")}</p> : null}
              </div>
            ) : null}
          </Card>

          {isOfficePickup ? (
            <Card title={t("officePickup.title" as never)}>
              <OfficePickupPanel
                orderId={order.id}
                state={officePickup}
                sellersPending={sellersPending}
                paid={Boolean(order.paid_at) && ["paid", "processing"].includes(order.status)}
                cancelled={cancelled}
              />
            </Card>
          ) : null}

          {order.review_status === "pending" ? (
            <Card title={d("orderReview")}>
              <div className="grid grid-cols-2 gap-2">
                <form action={reviewOrderForm}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="decision" value="accepted" />
                  <button className="w-full rounded bg-green-700 px-3 py-2 text-sm font-semibold text-white">{d("accept")}</button>
                </form>
                <form action={reviewOrderForm} className="space-y-1">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <input name="reason" placeholder={d("rejectReasonPlaceholder")} className={input} required />
                  <button className="w-full rounded bg-red-700 px-3 py-2 text-sm font-semibold text-white">{d("reject")}</button>
                </form>
              </div>
            </Card>
          ) : null}

          {order.payment_status !== "captured" ? (
            <Card title={d("recordManualPayment")}>
              <form action={markOrderPaidForm} className="space-y-2">
                <input type="hidden" name="orderId" value={order.id} />
                <input name="reference" placeholder={d("bankReferencePlaceholder")} className={input} />
                <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">{d("markPaid")}</button>
              </form>
            </Card>
          ) : null}

          <Card title={d("moveForward")}>
            <form action={advanceOrderForm} className="space-y-2">
              <input type="hidden" name="orderId" value={order.id} />
              <select name="to" className={input}>
                {TRANSITIONS.map((s) => (
                  <option key={s} value={s}>{orderStatus(s)}</option>
                ))}
              </select>
              <input name="reason" placeholder={d("transitionReasonPlaceholder")} className={input} />
              <button className="w-full rounded border border-[#083f30] px-3 py-2 text-sm font-semibold text-[#083f30]">{d("applyTransition")}</button>
            </form>
          </Card>

          {!isOfficePickup ? (
          <Card title={d("shipment")}>
            <form action={recordShipmentForm} className="space-y-2">
              <input type="hidden" name="orderId" value={order.id} />
              <input name="carrier" placeholder={d("carrierPlaceholder")} className={input} />
              <input name="trackingNumber" placeholder={d("trackingPlaceholder")} className={input} />
              <p className="text-xs text-gray-500">{d("partialHint")}</p>
              {order.items.map((it: any) => (
                <div key={it.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="line-clamp-1 flex-1">{it.name} <span className="text-gray-400">(×{it.quantity})</span></span>
                  <input name={`qty:${it.id}`} type="number" min={0} max={it.quantity} defaultValue={0} className="h-8 w-16 rounded border border-gray-300 px-1 text-sm" />
                </div>
              ))}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="markShipped" defaultChecked /> {d("markShippedNow")}
              </label>
              <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">{d("recordShipment")}</button>
            </form>
            {order.shipments.map((s: any) => (
              <div key={s.id} className="mt-2 flex items-center justify-between rounded border border-gray-100 p-2 text-sm">
                <span>{s.shipment_number} · {s.carrier ?? "—"} · {shipmentStatus(s.status)}</span>
                {s.status !== "delivered" ? (
                  <form action={markDeliveredForm}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="shipmentId" value={s.id} />
                    <button className="rounded bg-green-700 px-2 py-1 text-xs font-semibold text-white">{d("delivered")}</button>
                  </form>
                ) : null}
              </div>
            ))}
          </Card>
          ) : null}

          {refundView && refundView.refundable > 0 ? (
            <Card title={d("refundManual")}>
              <p className="mb-2 text-xs text-gray-500">
                {d("refundCapturedInfo")
                  .replace("{captured}", `${refundView.currency} ${refundView.capturedTotal.toFixed(2)}`)
                  .replace("{refunded}", `${refundView.currency} ${refundView.refundedTotal.toFixed(2)}`)
                  .replace("{refundable}", `${refundView.currency} ${refundView.refundable.toFixed(2)}`)}
              </p>
              <form action={recordRefundForm} className="space-y-2">
                <input type="hidden" name="orderId" value={order.id} />
                <input name="amount" type="number" step="0.01" max={refundView.refundable} defaultValue={refundView.refundable} className={input} />
                <input name="reason" placeholder={d("refundReasonPlaceholder")} className={input} required />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="restock" /> {d("restockNote")}</label>
                <button className="w-full rounded bg-red-700 px-3 py-2 text-sm font-semibold text-white">{d("recordRefund")}</button>
              </form>
            </Card>
          ) : null}
          <Card title={d("invoices")}>
            <div className="mb-2 flex gap-2">
              <form action={issueInvoiceForm}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="type" value="proforma" />
                <button className="rounded border border-[#083f30] px-3 py-1.5 text-xs font-semibold text-[#083f30]">{d("issueProforma")}</button>
              </form>
              <form action={issueInvoiceForm}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="type" value="standard" />
                <button className="rounded bg-[#083f30] px-3 py-1.5 text-xs font-semibold text-white">{d("issueInvoice")}</button>
              </form>
            </div>
            {invoices.length ? (
              <ul className="space-y-1 text-sm">
                {invoices.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between text-gray-600">
                    <span>
                      {d(`invoiceType_${inv.type}` as never)} · <span className="font-mono text-xs">{inv.invoiceNumber}</span> · {inv.status}
                      {" · "}{inv.currency} {inv.total.toFixed(2)}
                    </span>
                    {inv.pdfUrl ? <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#083f30]">{t("pdf")}</a> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">{d("noInvoices")}</p>
            )}
          </Card>

          {refundView && refundView.refunds.length ? (
            <Card title={d("refundHistory")}>
              <ul className="space-y-1 text-sm">
                {refundView.refunds.map((r) => (
                  <li key={r.id} className="text-gray-600">
                    {r.currency} {r.amount.toFixed(2)} · {paymentStatus(r.status)}
                    {r.refundedAt ? ` · ${new Date(r.refundedAt).toLocaleString()}` : ""}
                    {r.reason ? ` · ${r.reason}` : ""}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-sm font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}
function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold" : "text-gray-600"}`}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
