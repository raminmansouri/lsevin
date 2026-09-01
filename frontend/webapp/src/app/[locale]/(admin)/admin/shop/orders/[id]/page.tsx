import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminOrder } from "@/features/shop/api/admin.repository";
import { getOrderRefundView } from "@/features/shop/server/shop-refund.service";
import {
  advanceOrderForm,
  markDeliveredForm,
  markOrderPaidForm,
  recordRefundForm,
  recordShipmentForm,
  reviewOrderForm,
} from "@/features/shop/actions/admin.actions";

export const dynamic = "force-dynamic";

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();
  const refundView = await getOrderRefundView(id).catch(() => null);

  const ship = order.addresses.find((a: any) => a.address_type === "shipping") ?? {};

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/shop/orders" className="text-sm font-medium text-[#083f30]">← Orders</Link>
        <h1 className="font-mono text-xl font-bold text-gray-900">{order.order_number}</h1>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold">{order.status}</span>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold">pay: {order.payment_status}</span>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold">fulfil: {order.fulfillment_status}</span>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold">review: {order.review_status}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <div className="space-y-4">
          <Card title="Items">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {order.items.map((it: any) => (
                  <tr key={it.id}>
                    <td className="py-2">
                      {it.name}
                      {it.variant_name ? <span className="text-gray-500"> · {it.variant_name}</span> : null}
                      <div className="text-xs text-gray-400">
                        {it.sku ?? "—"} · src {it.source_currency} {Number(it.source_unit_price).toFixed(2)}
                      </div>
                    </td>
                    <td className="py-2 text-center">×{it.quantity}</td>
                    <td className="py-2 text-right">{order.currency} {Number(it.line_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-3 space-y-1 border-t pt-3 text-sm">
              <Row k="Subtotal" v={`${order.currency} ${Number(order.subtotal).toFixed(2)}`} />
              <Row k="Shipping" v={`${order.currency} ${Number(order.shipping_total).toFixed(2)}`} />
              {order.tax_total > 0 ? <Row k="Tax" v={`${order.currency} ${Number(order.tax_total).toFixed(2)}`} /> : null}
              {order.discount_total > 0 ? <Row k="Discount" v={`− ${order.currency} ${Number(order.discount_total).toFixed(2)}`} /> : null}
              <Row k="Grand total" v={`${order.currency} ${Number(order.grand_total).toFixed(2)}`} bold />
              {order.payment_currency && order.payment_currency !== order.currency ? (
                <Row k="Payable" v={`${order.payment_currency} ${Number(order.payment_total).toFixed(2)} (rate ${order.fx_applied_rate})`} />
              ) : null}
            </dl>
            <p className="mt-2 text-xs text-gray-400">
              FX snapshot: <code>{JSON.stringify(order.fx_snapshot)}</code>
            </p>
          </Card>

          <Card title="Customer & shipping">
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

          <Card title="Payment attempts">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {order.payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-2">{p.provider} · {p.type}</td>
                    <td className="py-2 text-gray-500">{p.provider_transaction_id ?? "—"}</td>
                    <td className="py-2">{p.currency} {Number(p.amount).toFixed(2)}</td>
                    <td className="py-2 font-semibold">{p.status}</td>
                    <td className="py-2 text-gray-400">{new Date(p.create_date).toLocaleString()}</td>
                  </tr>
                ))}
                {!order.payments.length ? <tr><td className="py-3 text-gray-400">No attempts yet.</td></tr> : null}
              </tbody>
            </table>
          </Card>

          <Card title="Status history">
            <ul className="space-y-1 text-sm">
              {order.history.map((h: any) => (
                <li key={h.id} className="text-gray-600">
                  <span className="text-gray-400">{new Date(h.create_date).toLocaleString()}</span> · {h.from_status ?? "—"} → <b>{h.to_status}</b>
                  {h.note ? ` · ${h.note}` : ""}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          {order.review_status === "pending" ? (
            <Card title="Order review">
              <div className="grid grid-cols-2 gap-2">
                <form action={reviewOrderForm}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="decision" value="accepted" />
                  <button className="w-full rounded bg-green-700 px-3 py-2 text-sm font-semibold text-white">Accept</button>
                </form>
                <form action={reviewOrderForm} className="space-y-1">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <input name="reason" placeholder="Reason (required)" className={input} required />
                  <button className="w-full rounded bg-red-700 px-3 py-2 text-sm font-semibold text-white">Reject</button>
                </form>
              </div>
            </Card>
          ) : null}

          {order.payment_status !== "captured" ? (
            <Card title="Record manual payment">
              <form action={markOrderPaidForm} className="space-y-2">
                <input type="hidden" name="orderId" value={order.id} />
                <input name="reference" placeholder="Bank reference (optional)" className={input} />
                <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">Mark paid</button>
              </form>
            </Card>
          ) : null}

          <Card title="Move order forward">
            <form action={advanceOrderForm} className="space-y-2">
              <input type="hidden" name="orderId" value={order.id} />
              <select name="to" className={input}>
                {["processing", "shipped", "completed", "cancelled", "refunded"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input name="reason" placeholder="Reason (required to cancel)" className={input} />
              <button className="w-full rounded border border-[#083f30] px-3 py-2 text-sm font-semibold text-[#083f30]">Apply transition</button>
            </form>
          </Card>

          <Card title="Shipment">
            <form action={recordShipmentForm} className="space-y-2">
              <input type="hidden" name="orderId" value={order.id} />
              <input name="carrier" placeholder="Carrier" className={input} />
              <input name="trackingNumber" placeholder="Tracking number" className={input} />
              <p className="text-xs text-gray-500">Leave quantities at 0 to ship the whole order; set some for a partial shipment (SHP-V03-003).</p>
              {order.items.map((it: any) => (
                <div key={it.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="line-clamp-1 flex-1">{it.name} <span className="text-gray-400">(×{it.quantity})</span></span>
                  <input name={`qty:${it.id}`} type="number" min={0} max={it.quantity} defaultValue={0} className="h-8 w-16 rounded border border-gray-300 px-1 text-sm" />
                </div>
              ))}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="markShipped" defaultChecked /> mark shipped now
              </label>
              <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">Record shipment</button>
            </form>
            {order.shipments.map((s: any) => (
              <div key={s.id} className="mt-2 flex items-center justify-between rounded border border-gray-100 p-2 text-sm">
                <span>{s.shipment_number} · {s.carrier ?? "—"} · {s.status}</span>
                {s.status !== "delivered" ? (
                  <form action={markDeliveredForm}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="shipmentId" value={s.id} />
                    <button className="rounded bg-green-700 px-2 py-1 text-xs font-semibold text-white">Delivered</button>
                  </form>
                ) : null}
              </div>
            ))}
          </Card>

          {refundView && refundView.refundable > 0 ? (
            <Card title="Refund (manual)">
              <p className="mb-2 text-xs text-gray-500">
                Captured {refundView.currency} {refundView.capturedTotal.toFixed(2)} · already refunded{" "}
                {refundView.currency} {refundView.refundedTotal.toFixed(2)} · refundable{" "}
                <b>{refundView.currency} {refundView.refundable.toFixed(2)}</b>
              </p>
              <form action={recordRefundForm} className="space-y-2">
                <input type="hidden" name="orderId" value={order.id} />
                <input name="amount" type="number" step="0.01" max={refundView.refundable} defaultValue={refundView.refundable} className={input} />
                <input name="reason" placeholder="Reason (required)" className={input} required />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="restock" /> return stock to inventory (full refund only)</label>
                <button className="w-full rounded bg-red-700 px-3 py-2 text-sm font-semibold text-white">Record refund</button>
              </form>
            </Card>
          ) : null}
          {refundView && refundView.refunds.length ? (
            <Card title="Refund history">
              <ul className="space-y-1 text-sm">
                {refundView.refunds.map((r) => (
                  <li key={r.id} className="text-gray-600">
                    {r.currency} {r.amount.toFixed(2)} · {r.status}
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
