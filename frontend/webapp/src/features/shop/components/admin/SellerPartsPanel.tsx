"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import {
  advanceDefaultSellerPartAction,
  approveSellerPartForm,
  confirmDefaultSellerPickupAction,
  rejectSellerPartForm,
} from "../../actions/fulfilment-admin.actions";

/**
 * Admin order page: one block per seller part. The admin moves the DEFAULT seller's (Lsevin's)
 * part itself (preparing, shipped with a tracking code, ready for pickup, the customer's code) and
 * approves or rejects any seller's "delivered" request. Clinics move their own parts in the portal.
 */

export type AdminSellerPart = {
  sellerId: string;
  sellerName: string;
  isDefault: boolean;
  type: "shipping" | "pickup";
  status: "new" | "preparing" | "shipped" | "ready_for_pickup" | "delivery_requested" | "completed";
  shippingFee: number;
  feeLabel: string;
  deliveryMethodName: string | null;
  dueAt: string | null;
  trackingCode: string | null;
  carrier: string | null;
  rejectionReason: string | null;
  codeLocked: boolean;
  attemptsLeft: number;
};

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";
const btn = "rounded bg-[#083f30] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50";

export function SellerPartsPanel({ orderId, parts, open }: { orderId: string; parts: AdminSellerPart[]; open: boolean }) {
  const t = useTranslations("ShopAdmin");
  const s = (k: string, v?: Record<string, string | number>) => t(`sellerParts.${k}` as never, v as never);
  return (
    <div className="space-y-3" data-testid="admin-seller-parts">
      {parts.map((part) => (
        <div key={part.sellerId} data-testid="admin-seller-part" data-status={part.status} className="rounded-xl border border-gray-100 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-gray-900">
              🏪 {part.sellerName}
              <span className="ms-1 font-normal text-gray-500">· {s(part.type === "pickup" ? "typePickup" : "typeShipping")}</span>
            </p>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold">{s(`status.${part.status}`)}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {part.type === "shipping" ? `${s("fee")}: ${part.feeLabel}` : null}
            {part.deliveryMethodName ? ` · ${part.deliveryMethodName}` : null}
            {part.dueAt ? ` · ${s("due", { date: new Date(part.dueAt).toLocaleDateString() })}` : null}
          </p>
          {part.trackingCode ? (
            <p className="mt-1 text-xs text-gray-700">
              {s("tracking")}: <span className="font-mono">{part.trackingCode}</span>
              {part.carrier ? ` · ${part.carrier}` : null}
            </p>
          ) : null}
          {part.rejectionReason ? <p className="mt-1 text-xs text-red-700">{s("rejected", { reason: part.rejectionReason })}</p> : null}

          {open && part.isDefault ? <DefaultSellerSteps orderId={orderId} part={part} /> : null}
          {open && !part.isDefault && part.status !== "delivery_requested" && part.status !== "completed" ? (
            <p className="mt-2 text-xs text-gray-500">{s("sellerMoves")}</p>
          ) : null}

          {open && part.status === "delivery_requested" ? (
            <div className="mt-2 grid gap-2 border-t pt-2 sm:grid-cols-2">
              <form action={approveSellerPartForm}>
                <input type="hidden" name="orderId" value={orderId} />
                <input type="hidden" name="sellerId" value={part.sellerId} />
                <button className="w-full rounded bg-green-700 px-3 py-2 text-xs font-semibold text-white" data-action="approve-part">
                  {s("approve")}
                </button>
              </form>
              <form action={rejectSellerPartForm} className="space-y-1">
                <input type="hidden" name="orderId" value={orderId} />
                <input type="hidden" name="sellerId" value={part.sellerId} />
                <input name="reason" required minLength={2} maxLength={500} placeholder={s("rejectReason")} className={input} />
                <button className="w-full rounded bg-red-700 px-3 py-2 text-xs font-semibold text-white" data-action="reject-part">
                  {s("reject")}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function DefaultSellerSteps({ orderId, part }: { orderId: string; part: AdminSellerPart }) {
  const t = useTranslations("ShopAdmin");
  const s = (k: string, v?: Record<string, string | number>) => t(`sellerParts.${k}` as never, v as never);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");
  const [code, setCode] = useState("");

  const run = (action: () => Promise<{ ok: boolean; error?: string; reason?: string; attemptsLeft?: number }>) =>
    start(async () => {
      setError(null);
      const result = await action();
      if (!result.ok) {
        setError(
          result.reason === "wrong_code"
            ? s("wrongCode", { count: result.attemptsLeft ?? 0 })
            : result.reason === "code_locked"
              ? s("locked")
              : (result.error ?? s("failed")),
        );
      } else {
        setCode("");
      }
      router.refresh();
    });
  const move = (to: "preparing" | "shipped" | "ready_for_pickup" | "delivery_requested") =>
    run(() => advanceDefaultSellerPartAction({ orderId, sellerId: part.sellerId, to, trackingCode: tracking, carrier }));

  return (
    <div className="mt-2 space-y-2 border-t pt-2">
      {part.status === "new" ? (
        <button type="button" className={btn} disabled={pending} onClick={() => move("preparing")} data-action="part-preparing">
          {s("markPreparing")}
        </button>
      ) : null}
      {part.type === "shipping" && (part.status === "new" || part.status === "preparing") ? (
        <div className="space-y-1">
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder={s("trackingPlaceholder")} className={input} data-testid="part-tracking" />
          <input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder={s("carrierPlaceholder")} className={input} />
          <button type="button" className={btn} disabled={pending || tracking.trim().length < 3} onClick={() => move("shipped")} data-action="part-shipped">
            {s("markShipped")}
          </button>
        </div>
      ) : null}
      {part.type === "shipping" && part.status === "shipped" ? (
        <button type="button" className={btn} disabled={pending} onClick={() => move("delivery_requested")} data-action="part-request">
          {s("requestDelivery")}
        </button>
      ) : null}
      {part.type === "pickup" && (part.status === "new" || part.status === "preparing") ? (
        <button type="button" className={btn} disabled={pending} onClick={() => move("ready_for_pickup")} data-action="part-ready">
          {s("markReady")}
        </button>
      ) : null}
      {part.type === "pickup" && part.status === "ready_for_pickup" ? (
        <div className="space-y-1">
          {part.codeLocked ? <p className="text-xs text-red-700">{s("locked")}</p> : null}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            maxLength={12}
            placeholder={s("codePlaceholder")}
            className={input}
            data-testid="part-code"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btn}
              disabled={pending || part.codeLocked || code.trim().length < 6}
              onClick={() => run(() => confirmDefaultSellerPickupAction({ orderId, sellerId: part.sellerId, code }))}
              data-action="part-code"
            >
              {s("confirmCode")}
            </button>
            <button
              type="button"
              className="rounded border border-[#083f30] px-3 py-1.5 text-xs font-semibold text-[#083f30]"
              disabled={pending}
              onClick={() => (window.confirm(s("resendConfirm")) ? move("ready_for_pickup") : undefined)}
            >
              {s("resend")}
            </button>
          </div>
          {!part.codeLocked ? <p className="text-xs text-gray-500">{s("attemptsLeft", { count: part.attemptsLeft })}</p> : null}
        </div>
      ) : null}
      {error ? <p className="text-xs text-red-700" role="alert">{error}</p> : null}
    </div>
  );
}
