import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { formatShopMoney } from "./money";
import { OrderActions } from "./OrderActions";
import type { OrderDetail, OrderSummary } from "../types/domain";
import { shopImageSrc } from "../lib/image";

function statusTone(s: string): string {
  if (["paid", "captured", "completed", "delivered", "accepted"].includes(s)) return "bg-emerald-50 text-emerald-700";
  if (["cancelled", "failed", "rejected", "returned"].includes(s)) return "bg-red-50 text-red-700";
  if (["awaiting_payment", "pending", "processing", "packed", "ready", "shipped", "partially_shipped"].includes(s))
    return "bg-amber-50 text-amber-700";
  return "bg-neutral-100 text-neutral-600";
}

export async function StatusPill({ status }: { status: string }) {
  const t = await getTranslations("Shop");
  // every order/payment/shipment enum value has a Shop.status.* entry (see messages/*.json)
  const key = `status.${status}` as Parameters<typeof t>[0];
  let label = status;
  try {
    label = t(key);
  } catch {
    label = status;
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone(status)}`}>{label}</span>
  );
}

export async function OrderRow({ order, locale }: { order: OrderSummary; locale: string }) {
  const t = await getTranslations("Shop");
  return (
    <Link
      href={`/n/app/mobile/shop/order/${order.orderNumber}`}
      className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-neutral-900">{t("orderNumber", { number: order.orderNumber })}</span>
        <StatusPill status={order.status} />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
        <span>{t("placedOn", { date: new Date(order.placedAt).toLocaleDateString(locale) })}</span>
        <span className="text-sm font-extrabold text-[#e02e2a]">
          {formatShopMoney(order.grandTotal, order.currency, locale)}
        </span>
      </div>
    </Link>
  );
}

type OrderInvoice = {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  currency: string;
  total: number;
  issueDate: string;
  pdfUrl: string | null;
};

export async function OrderDetailView({
  order,
  locale,
  confirmation = false,
  email,
  canCancel = false,
  returnable = null,
  invoices = [],
  canRequestProforma = false,
}: {
  order: OrderDetail;
  locale: string;
  confirmation?: boolean;
  email?: string | null;
  canCancel?: boolean;
  returnable?: { eligible: boolean; items: Array<{ id: string; name: string; quantity: number; returnable: number }> } | null;
  invoices?: OrderInvoice[];
  canRequestProforma?: boolean;
}) {
  const t = await getTranslations("Shop");
  const paid = ["paid", "processing", "shipped", "completed", "partially_shipped"].includes(order.status);

  return (
    <div className="space-y-3 p-4 pb-24">
      {confirmation ? (
        <div className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/[0.04]">
          <div className="text-4xl">{paid ? "✅" : order.status === "cancelled" ? "❌" : "🕓"}</div>
          <p className="mt-2 text-base font-bold text-neutral-900">
            {paid ? t("orderConfirmedTitle") : order.paymentStatus === "failed" ? t("orderPaymentFailed") : t("orderAwaitingPayment")}
          </p>
          <p className="mt-1 text-sm text-neutral-500">{t("orderNumber", { number: order.orderNumber })}</p>
        </div>
      ) : null}

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-neutral-900">{t("orderNumber", { number: order.orderNumber })}</span>
          <StatusPill status={order.status} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
          <span>{t("placedOn", { date: new Date(order.placedAt).toLocaleString(locale) })}</span>
          <span className="flex items-center gap-1">
            {t("paymentStatus")}: <StatusPill status={order.paymentStatus} />
          </span>
          <span className="flex items-center gap-1">
            {t("fulfillmentStatus")}: <StatusPill status={order.fulfillmentStatus} />
          </span>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
        <p className="mb-2 text-sm font-bold text-neutral-900">{t("items")}</p>
        {order.items.map((it) => (
          <div key={it.id} className="flex gap-3 border-b border-neutral-100 py-2 last:border-0">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
              {it.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shopImageSrc(it.imageUrl)} alt={it.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm text-neutral-800">{it.name}</p>
              {it.variantName ? <p className="text-xs text-neutral-500">{it.variantName}</p> : null}
              <p className="text-xs text-neutral-500">×{it.quantity}</p>
            </div>
            <span className="text-sm font-semibold">
              {formatShopMoney(it.lineTotal, order.currency, locale)}
            </span>
          </div>
        ))}
        <div className="mt-2 space-y-1 pt-1 text-sm text-neutral-600">
          <Line label={t("subtotal")} value={formatShopMoney(order.subtotal, order.currency, locale)} />
          <Line label={t("shipping")} value={order.shippingTotal === 0 ? t("freeShipping") : formatShopMoney(order.shippingTotal, order.currency, locale)} />
          {order.taxTotal > 0 ? <Line label={t("tax")} value={formatShopMoney(order.taxTotal, order.currency, locale)} /> : null}
          {order.discountTotal > 0 ? <Line label={t("discount")} value={`− ${formatShopMoney(order.discountTotal, order.currency, locale)}`} /> : null}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-2 text-base font-extrabold">
          <span>{t("grandTotal")}</span>
          <span className="text-[#e02e2a]">{formatShopMoney(order.grandTotal, order.currency, locale)}</span>
        </div>
        {order.paymentCurrency && order.paymentTotal != null && order.paymentCurrency !== order.currency ? (
          <p className="mt-1 text-xs text-neutral-500">
            {t("payInCurrency", { currency: order.paymentCurrency })}: {order.paymentCurrency}{" "}
            {formatShopMoney(order.paymentTotal, order.paymentCurrency, locale)}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
        <p className="mb-1 text-sm font-bold text-neutral-900">{t("shippingAddress")}</p>
        <p className="text-sm text-neutral-600">
          {order.shippingAddress.fullName}
          <br />
          {order.shippingAddress.addressLine1}
          {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}
          <br />
          {order.shippingAddress.city}, {order.shippingAddress.country}
          {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ""}
        </p>
      </div>

      {order.shipments.length ? (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <p className="mb-2 text-sm font-bold text-neutral-900">{t("fulfillmentStatus")}</p>
          {order.shipments.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-1 text-sm">
              <span className="text-neutral-600">
                {s.carrier ?? "—"} · {s.trackingNumber ?? "—"}
                {s.shippedAt ? ` · ${new Date(s.shippedAt).toLocaleDateString(locale)}` : ""}
              </span>
              <StatusPill status={s.status} />
            </div>
          ))}
        </div>
      ) : null}

      {order.returns.length ? (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <p className="mb-2 text-sm font-bold text-neutral-900">{t("returnsHeading")}</p>
          {order.returns.map((r) => (
            <div key={r.id} className="border-b border-neutral-100 py-2 text-sm last:border-0">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">
                  {r.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                </span>
                <StatusPill status={r.status} />
              </div>
              {r.reason ? <p className="text-xs text-neutral-400">{r.reason}</p> : null}
              {r.reviewNote ? <p className="text-xs text-amber-700">{r.reviewNote}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {canCancel || returnable?.eligible || canRequestProforma ? (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <OrderActions
            orderNumber={order.orderNumber}
            email={email}
            canCancel={canCancel}
            returnable={returnable}
            canRequestProforma={canRequestProforma}
          />
        </div>
      ) : null}

      {invoices.length ? (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <p className="mb-2 text-sm font-bold text-neutral-900">{t("invoicesTitle")}</p>
          <ul className="space-y-1 text-sm">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-2">
                <span className="text-neutral-700">
                  {t(`invoiceType_${inv.type}` as never)} · <span className="font-mono text-xs">{inv.invoiceNumber}</span>
                  <span className="ms-1 text-xs text-neutral-400">{inv.status}</span>
                </span>
                {inv.pdfUrl ? (
                  <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#083f30]">
                    {t("viewPdf")}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {order.paymentStatus !== "captured" && order.status === "awaiting_payment" ? (
        <Link
          href={`/n/app/mobile/shop/orders`}
          className="block rounded-full bg-[#083f30] px-6 py-3 text-center text-sm font-bold text-white"
        >
          {t("myOrders")}
        </Link>
      ) : (
        <Link
          href="/n/app/mobile/shop"
          className="block rounded-full border-2 border-[#083f30] px-6 py-3 text-center text-sm font-bold text-[#083f30]"
        >
          {t("continueShopping")}
        </Link>
      )}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium text-neutral-800">{value}</span>
    </div>
  );
}
