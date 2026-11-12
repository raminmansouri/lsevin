"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import { confirmOfficePickupAction, markOfficeReadyAction } from "../../actions/fulfilment-admin.actions";

/**
 * Admin, office pickup orders: mark ready (sends the customer the code), then type the customer's
 * code to hand the order over. "Send a new code" re-issues it (also the way out of a lock).
 */
export function OfficePickupPanel({
  orderId,
  state,
  sellersPending,
  paid,
  cancelled,
}: {
  orderId: string;
  state: { status: "ready" | "picked_up"; readyAt: string; pickedUpAt: string | null; locked: boolean; attemptsLeft: number } | null;
  sellersPending: number;
  paid: boolean;
  cancelled: boolean;
}) {
  const t = useTranslations("ShopAdmin.officePickup");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const btn = "rounded px-3 py-2 text-sm font-semibold disabled:opacity-50";

  const ready = (resend: boolean) => {
    if (resend && !window.confirm(t("resendConfirm"))) return;
    setError("");
    setNotice("");
    start(async () => {
      const result = await markOfficeReadyAction({ orderId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotice(t("codeSent"));
      setCode("");
      router.refresh();
    });
  };

  const confirm = () => {
    setError("");
    setNotice("");
    if (!/^\s*[\d۰-۹٠-٩][\d۰-۹٠-٩\s-]*$/.test(code)) {
      setError(t("codeFormat"));
      return;
    }
    start(async () => {
      const result = await confirmOfficePickupAction({ orderId, code });
      if (!result.ok) {
        setError(
          result.reason === "wrong_code"
            ? t("wrongCode", { count: result.attemptsLeft ?? 0 })
            : result.reason === "code_locked"
              ? t("locked")
              : result.error
        );
      } else {
        setCode("");
      }
      router.refresh();
    });
  };

  if (cancelled) return <p className="text-sm text-gray-500">{t("cancelled")}</p>;
  if (state?.status === "picked_up") {
    return (
      <p className="text-sm font-semibold text-green-700" data-testid="office-picked-up">
        {t("pickedUp", { date: new Date(state.pickedUpAt ?? state.readyAt).toLocaleString() })}
      </p>
    );
  }

  return (
    <div className="space-y-3" data-testid="office-pickup-panel">
      {error ? <p role="alert" className="text-sm font-semibold text-red-700">{error}</p> : null}
      {notice && !error ? <p role="status" className="text-sm text-green-700">{notice}</p> : null}
      {!state ? (
        <>
          {!paid ? <p className="text-sm text-gray-500">{t("notPaid")}</p> : null}
          {paid && sellersPending > 0 ? <p className="text-sm text-amber-700">{t("waitingForSellers", { count: sellersPending })}</p> : null}
          <button
            type="button"
            disabled={pending || !paid || sellersPending > 0}
            onClick={() => ready(false)}
            className={`${btn} w-full bg-[#083f30] text-white`}
            data-action="office-ready"
          >
            {t("markReady")}
          </button>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-500">{t("readySince", { date: new Date(state.readyAt).toLocaleString() })}</p>
          {state.locked ? (
            <p className="rounded bg-amber-50 p-2 text-sm text-amber-900" data-testid="code-locked">{t("locked")}</p>
          ) : (
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                confirm();
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setCode("");
                  setError("");
                }
              }}
            >
              <label htmlFor={`office-code-${orderId}`} className="block text-sm font-semibold">{t("codeLabel")}</label>
              <div className="flex gap-2">
                <input
                  id={`office-code-${orderId}`}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={11}
                  dir="ltr"
                  aria-invalid={Boolean(error)}
                  className="h-9 w-36 rounded border border-gray-300 px-2 text-center font-mono text-lg tracking-[0.3em]"
                  data-testid="office-code-input"
                />
                <button type="submit" disabled={pending || !code.trim()} className={`${btn} bg-green-700 text-white`} data-action="office-confirm">
                  {t("confirm")}
                </button>
              </div>
              {state.attemptsLeft < 5 ? <p className="text-xs text-gray-500">{t("attemptsLeft", { count: state.attemptsLeft })}</p> : null}
            </form>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => ready(true)}
            className={`${btn} w-full border border-[#083f30] text-[#083f30]`}
            data-action="office-resend"
          >
            {t("resend")}
          </button>
        </>
      )}
    </div>
  );
}
