"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { contentLocaleFor } from "../../../domain/content";
import { ToursErrorAlert } from "../../shared/error-alert";
import { formatMoney } from "../../shared/format";
import { TourPrice, useTourDateFormat } from "../common";

type Method = { code: string; name: string; description?: string | null; isWallet?: boolean; provider?: string | null };

/**
 * Pays a pending tour booking through the platform payment engine (C-081,
 * C-092, C-093): methods from /api/booking-pro/payments/methods, payment via
 * /api/booking-pro/payments/create-intent (wallet settles immediately, online
 * card redirects to the gateway). The voucher page reconciles the result.
 */
export function PaymentPanel({
  bookingId,
  amount,
  currency,
  deadline,
  timeZone,
  onPaid,
}: {
  bookingId: string;
  amount: number;
  currency: string;
  deadline: string | null;
  timeZone: string;
  onPaid: () => void;
}) {
  const t = useTranslations("TourApp.booking.payment");
  const locale = useLocale();
  const fmt = useTourDateFormat();
  const [methods, setMethods] = useState<Method[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "paying" | "redirecting" | "insufficient" | "failed" | "pending">("idle");

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await fetch(`/api/booking-pro/payments/methods?locale=${encodeURIComponent(contentLocaleFor(locale))}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { items?: Method[] };
      // Only methods that actually move money now; pay-on-delivery / receipts are not offered for tours.
      const items = (json.items ?? []).filter((m) => m.code === "wallet" || m.isWallet || ["gateway_card", "card", "online_card", "zarinpal", "btcpay"].includes(m.code));
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
        body: JSON.stringify({ bookingId, paymentMethodCode: selected, returnUrl: `${window.location.origin}/${locale}/tours/bookings/${bookingId}` }),
      });
      const json = (await res.json().catch(() => ({}))) as { status?: string; actionUrl?: string | null };
      if (!res.ok) {
        setState("failed");
        return;
      }
      if (json.status === "requires_action" && json.actionUrl) {
        setState("redirecting");
        window.location.assign(json.actionUrl);
        return;
      }
      if (json.status === "insufficient_balance") {
        setState("insufficient");
        return;
      }
      if (json.status === "succeeded" || json.status === "not_required" || json.status === "already_paid") {
        onPaid();
        return;
      }
      if (json.status === "pending_review" || json.status === "pending_collection") {
        setState("pending");
        return;
      }
      setState("failed");
    } catch {
      setState("failed");
    }
  }

  return (
    <section aria-labelledby="payment-title" className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="payment-panel">
      <h2 id="payment-title" className="text-base font-bold text-slate-900">
        {t("title")}
      </h2>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-slate-600">{t("amountDue")}</span>
        <TourPrice amount={amount} currency={currency} className="text-xl font-extrabold text-slate-900" testId="amount-due" />
      </div>
      {deadline ? (
        <p className="text-xs text-slate-500" suppressHydrationWarning>
          {t("deadline", { time: fmt.instant(deadline, timeZone) })}
        </p>
      ) : null}

      {loadError ? (
        <ToursErrorAlert message={t("methodsError")} onRetry={() => void load()} />
      ) : methods === null ? (
        <p role="status" className="text-sm text-slate-500">
          {t("methodsLoading")}
        </p>
      ) : methods.length === 0 ? (
        <p className="text-sm text-slate-600">{t("noMethods")}</p>
      ) : (
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-semibold text-slate-800">{t("method")}</legend>
          {methods.map((m) => (
            <label key={m.code} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl px-3 ring-1 ring-slate-200 has-[:checked]:ring-2 has-[:checked]:ring-emerald-600" data-testid={`method-${m.code}`}>
              <input type="radio" name="payment-method" checked={selected === m.code} onChange={() => setSelected(m.code)} className="size-5 accent-emerald-700" />
              {m.code === "wallet" || m.isWallet ? <Wallet className="size-5 text-emerald-700" aria-hidden="true" /> : <CreditCard className="size-5 text-emerald-700" aria-hidden="true" />}
              <span className="text-sm">
                <span className="block font-semibold text-slate-900">{m.code === "wallet" ? t("wallet") : m.name}</span>
                {m.description && m.description !== m.code ? <span className="text-xs text-slate-500">{m.description}</span> : null}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {state === "insufficient" ? <ToursErrorAlert message={t("insufficient")} testId="payment-error" /> : null}
      {state === "failed" ? <ToursErrorAlert message={t("failed")} testId="payment-error" /> : null}
      {state === "pending" ? <p role="status" className="rounded-xl bg-sky-50 p-3 text-sm text-sky-900">{t("pending")}</p> : null}
      {state === "redirecting" ? <p role="status" className="text-sm text-slate-600">{t("redirecting")}</p> : null}

      <button
        type="button"
        onClick={pay}
        disabled={!selected || state === "paying" || state === "redirecting"}
        className="min-h-12 w-full rounded-2xl bg-emerald-700 text-sm font-bold text-white disabled:opacity-50"
        data-testid="pay"
      >
        {state === "paying" ? t("paying") : t("pay", { amount: formatMoney(amount, currency, locale) })}
      </button>
      <Link href={`/tours/bookings/${bookingId}`} className="block min-h-11 content-center text-center text-sm font-medium text-slate-600 underline">
        {t("later")}
      </Link>
    </section>
  );
}
