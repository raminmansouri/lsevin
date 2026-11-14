"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Loader2, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { formatMoney } from "@/features/tours/ui/shared/format";
import { cn } from "@/lib/utils";

import { Money } from "../common";

type Method = { code: string; name: string; description?: string | null; isWallet?: boolean };

/**
 * Pays a pending stay through the platform payment engine
 * (/api/booking-pro/payments/methods + create-intent): wallet settles at once,
 * card redirects to the gateway and returns to this booking page, which
 * reconciles. An uncertain result is shown as "processing", never as failed.
 */
export function StayPaymentPanel({ bookingId, amount, currency, deadlineLabel, onPaid }: { bookingId: string; amount: number; currency: string; deadlineLabel: string | null; onPaid: () => void }) {
  const t = useTranslations("StayApp.pay");
  const locale = useLocale();
  const [methods, setMethods] = useState<Method[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "paying" | "redirecting" | "insufficient" | "failed" | "pending" | "processing">("idle");

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await fetch(`/api/booking-pro/payments/methods?locale=${encodeURIComponent(contentLocaleFor(locale))}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { items?: Method[] };
      // Only methods that move money now; pay-on-arrival / receipts are not offered here.
      const items = (json.items ?? []).filter((m) => m.code === "wallet" || m.isWallet || ["gateway_card", "card", "online_card", "zarinpal", "zibal", "btcpay"].includes(m.code));
      setMethods(items);
      setSelected((s) => s ?? items[0]?.code ?? null);
    } catch {
      setLoadError(true);
    }
  }, [locale]);

  useEffect(() => {
    void load();
  }, [load]);

  async function pay() {
    if (!selected) return;
    setState("paying");
    try {
      const res = await fetch("/api/booking-pro/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, paymentMethodCode: selected, returnUrl: `${window.location.origin}/${locale}/stays/bookings/${bookingId}` }),
      });
      const json = (await res.json().catch(() => ({}))) as { status?: string; actionUrl?: string | null };
      if (!res.ok) {
        // 5xx/timeout: money may or may not have moved; never claim it failed.
        setState(res.status >= 500 ? "processing" : "failed");
        return;
      }
      if (json.status === "requires_action" && json.actionUrl) {
        setState("redirecting");
        window.location.assign(json.actionUrl);
        return;
      }
      if (json.status === "insufficient_balance") return setState("insufficient");
      if (json.status === "succeeded" || json.status === "not_required" || json.status === "already_paid") return onPaid();
      if (json.status === "pending_review" || json.status === "pending_collection") return setState("pending");
      setState("failed");
    } catch {
      setState("processing");
    }
  }

  return (
    <section aria-labelledby="stay-pay-title" className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="stay-payment-panel">
      <h2 id="stay-pay-title" className="font-bold">
        {t("title")}
      </h2>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-slate-600">{t("amountDue")}</span>
        <Money amount={amount} currency={currency} className="text-xl font-extrabold" />
      </div>
      {deadlineLabel ? <p className="text-xs text-amber-800">{t("deadline", { time: deadlineLabel })}</p> : null}
      {loadError ? (
        <p role="alert" className="text-sm text-red-700">
          {t("methodsError")}{" "}
          <button type="button" onClick={load} className="font-semibold underline">
            ↻
          </button>
        </p>
      ) : methods == null ? (
        <Loader2 className="size-5 animate-spin text-slate-400" aria-label="…" />
      ) : methods.length === 0 ? (
        <p className="text-sm text-slate-700">{t("noMethods")}</p>
      ) : (
        <fieldset>
          <legend className="text-sm font-semibold">{t("methods")}</legend>
          <div className="mt-2 space-y-2">
            {methods.map((m) => (
              <label key={m.code} className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 ring-1", selected === m.code ? "bg-emerald-50 ring-emerald-600" : "ring-slate-200")}>
                <input type="radio" name="stay-pay-method" value={m.code} checked={selected === m.code} onChange={() => setSelected(m.code)} className="accent-emerald-700" />
                {m.code === "wallet" || m.isWallet ? <Wallet className="size-5 text-emerald-700" aria-hidden="true" /> : <CreditCard className="size-5 text-emerald-700" aria-hidden="true" />}
                <span className="text-sm font-medium">{m.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {state !== "idle" && state !== "paying" ? (
        <p role="status" className={cn("rounded-xl p-3 text-sm", state === "failed" || state === "insufficient" ? "bg-red-50 text-red-800" : "bg-sky-50 text-sky-900")} data-testid="stay-pay-state">
          {t(state)}
        </p>
      ) : null}
      <button
        type="button"
        disabled={!selected || state === "paying" || state === "redirecting"}
        onClick={pay}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-orange-500 text-base font-bold text-white hover:bg-orange-600 disabled:opacity-50"
        data-testid="stay-pay"
      >
        {state === "paying" ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : null}
        {state === "paying" ? t("paying") : t("pay", { amount: formatMoney(amount, currency, locale) })}
      </button>
    </section>
  );
}
