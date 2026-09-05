"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { cancelOrderAction, requestProformaAction, submitReturnAction } from "../actions/returns.actions";

type ReturnableItem = { id: string; name: string; quantity: number; returnable: number };

export function OrderActions({
  orderNumber,
  email,
  canCancel,
  returnable,
  canRequestProforma = false,
}: {
  orderNumber: string;
  email?: string | null;
  canCancel: boolean;
  returnable: { eligible: boolean; items: ReturnableItem[] } | null;
  canRequestProforma?: boolean;
}) {
  const t = useTranslations("Shop");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<"none" | "cancel" | "return">("none");
  const [cancelReason, setCancelReason] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});

  function doCancel() {
    setErr(null);
    startTransition(async () => {
      try {
        const res = await cancelOrderAction({ orderNumber, email: email || undefined, reason: cancelReason || undefined });
        setMsg(res.refundPending ? `${t("orderCancelled")} ${t("refundPendingNote")}` : t("orderCancelled"));
        setMode("none");
      } catch (e) {
        setErr(e instanceof Error ? e.message : t("somethingWrong"));
      }
    });
  }

  function doReturn() {
    setErr(null);
    const items = Object.entries(qty)
      .filter(([, q]) => q > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (!items.length || returnReason.trim().length < 2) {
      setErr(t("returnReason"));
      return;
    }
    startTransition(async () => {
      try {
        await submitReturnAction({ orderNumber, email: email || undefined, reason: returnReason, items });
        setMsg(t("returnSubmitted"));
        setMode("none");
      } catch (e) {
        setErr(e instanceof Error ? e.message : t("somethingWrong"));
      }
    });
  }

  function doProforma() {
    setErr(null);
    startTransition(async () => {
      try {
        const res = await requestProformaAction({ orderNumber, email: email || undefined });
        setMsg(t("proformaReady", { number: res.invoiceNumber }));
      } catch (e) {
        setErr(e instanceof Error ? e.message : t("somethingWrong"));
      }
    });
  }

  if (msg) return <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p>;

  const hasReturnable = returnable?.eligible && returnable.items.some((i) => i.returnable > 0);

  return (
    <div className="space-y-2">
      {err ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{err}</p> : null}

      {mode === "none" ? (
        <div className="flex flex-wrap gap-2">
          {canCancel ? (
            <button onClick={() => setMode("cancel")} className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700">
              {t("cancelOrder")}
            </button>
          ) : null}
          {hasReturnable ? (
            <button onClick={() => setMode("return")} className="rounded-full border border-[#083f30] px-4 py-2 text-sm font-semibold text-[#083f30]">
              {t("requestReturn")}
            </button>
          ) : null}
          {canRequestProforma ? (
            <button disabled={pending} onClick={doProforma} className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-50">
              {t("requestProforma")}
            </button>
          ) : null}
        </div>
      ) : null}

      {mode === "cancel" ? (
        <div className="rounded-xl border border-neutral-200 p-3">
          <input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={t("cancelReason")}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#083f30]"
          />
          <div className="mt-2 flex gap-2">
            <button disabled={pending} onClick={doCancel} className="rounded-full bg-[#e02e2a] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
              {t("confirmCancel")}
            </button>
            <button onClick={() => setMode("none")} className="rounded-full border border-neutral-300 px-3 py-2 text-sm">✕</button>
          </div>
        </div>
      ) : null}

      {mode === "return" && returnable ? (
        <div className="space-y-2 rounded-xl border border-neutral-200 p-3">
          <p className="text-sm font-semibold text-neutral-800">{t("returnItemsLabel")}</p>
          {returnable.items
            .filter((i) => i.returnable > 0)
            .map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="line-clamp-1 flex-1">{i.name}</span>
                <select
                  value={qty[i.id] ?? 0}
                  onChange={(e) => setQty((q) => ({ ...q, [i.id]: Number(e.target.value) }))}
                  className="rounded border border-neutral-200 px-2 py-1 text-sm"
                >
                  {Array.from({ length: i.returnable + 1 }, (_, n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          <textarea
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            rows={2}
            placeholder={t("returnReason")}
            className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#083f30]"
          />
          <div className="flex gap-2">
            <button disabled={pending} onClick={doReturn} className="rounded-full bg-[#083f30] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
              {t("requestReturn")}
            </button>
            <button onClick={() => setMode("none")} className="rounded-full border border-neutral-300 px-3 py-2 text-sm">✕</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
