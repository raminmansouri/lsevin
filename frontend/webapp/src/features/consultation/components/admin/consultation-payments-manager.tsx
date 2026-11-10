"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Check, ExternalLink, Loader2, RotateCcw, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/features/finance/lib/money";

import {
  approveReceiptAction,
  listConsultationPaymentsAction,
  markRefundedAction,
  rejectReceiptAction,
  type AdminPaymentsData,
} from "../../server/admin-payments";
import { CONSULTATION_TRANSLATION_KEY } from "../../types";
import { formatSessionDate, formatSessionTime } from "../doctor-panel/panel-format";

/**
 * Video consultation money that needs an admin: transfer receipts from patients outside Iran
 * (approve to confirm the booking, or reject with a note), and refunds owed after a cancellation
 * or a doctor who never joined (pay them back outside the app, then mark them done). Also where
 * which payment methods those patients see is set in the payment method settings.
 */
export function ConsultationPaymentsManager() {
  const t = useTranslations(CONSULTATION_TRANSLATION_KEY);
  const locale = useLocale();
  const [data, setData] = useState<AdminPaymentsData | undefined>(undefined);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reload = useCallback(async () => {
    try {
      const result = await listConsultationPaymentsAction();
      if (result.ok && result.data) {
        setData(result.data);
      } else {
        toast.error(result.error || t("errors.generic"));
      }
    } catch {
      toast.error(t("errors.generic"));
    }
  }, [t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const run = (id: string | null, task: () => Promise<{ ok: boolean; error?: string }>, success: string) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        const result = await task();
        if (!result.ok) {
          toast.error(result.error || t("errors.generic"));
          return;
        }
        toast.success(success);
        await reload();
      } catch {
        toast.error(t("errors.generic"));
      } finally {
        setPendingId(null);
      }
    });
  };

  const money = (amount: number, currency: string) =>
    formatMoney({ amount, currencyCode: currency }, { locale });
  const when = (iso: string) => `${formatSessionDate(locale, iso)} · ${formatSessionTime(locale, iso)}`;

  const receipts = data?.payments?.filter((p) => p.status === "awaiting_review") ?? [];
  const refunds = data?.payments?.filter((p) => p.status === "needs_refund") ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.payments.title")}</CardTitle>
        <CardDescription>{t("admin.payments.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {data === undefined && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
          </div>
        )}
        {data && data.payments === null && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {t("admin.payments.migrationMissing")}
          </p>
        )}

        {data?.payments && (
          <>
            {/* Foreign patients now pay with the payment-settings methods, as a service booking does. */}
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              {t("admin.payments.methodsFromSettings")}
            </p>

            <section className="space-y-2">
              <p className="text-sm font-medium">{t("admin.payments.receipts", { count: receipts.length })}</p>
              {receipts.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("admin.payments.noReceipts")}</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {receipts.map((row) => (
                    <li key={row.id} className={`space-y-2 p-3 text-sm ${pendingId === row.id ? "animate-pulse" : ""}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">
                          {row.patientName ?? "—"} · {row.doctorName}
                        </p>
                        <p className="font-bold" dir="ltr">{money(row.amount, row.currency)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {[row.methodName, when(row.scheduledAt), row.patientPhone, row.patientEmail].filter(Boolean).join(" · ")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {row.receiptUrl && (
                          <Button asChild size="sm" variant="outline">
                            <a href={row.receiptUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                              {t("admin.payments.viewReceipt")}
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() =>
                            run(row.id, async () => {
                              const result = await approveReceiptAction(row.id);
                              if (result.ok && result.data?.outcome === "refund") {
                                toast.warning(t("admin.payments.approvedButLost"));
                              }
                              return result;
                            }, t("admin.payments.approved"))
                          }
                        >
                          <Check className="h-4 w-4" />
                          {t("admin.payments.approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => {
                            const note = window.prompt(t("admin.payments.rejectPrompt"));
                            if (!note) return;
                            run(row.id, () => rejectReceiptAction({ paymentId: row.id, note }), t("admin.payments.rejected"));
                          }}
                        >
                          <X className="h-4 w-4 text-red-600" />
                          {t("admin.payments.reject")}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <p className="text-sm font-medium">{t("admin.payments.refunds", { count: refunds.length })}</p>
              {refunds.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("admin.payments.noRefunds")}</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {refunds.map((row) => (
                    <li key={row.id} className={`space-y-2 p-3 text-sm ${pendingId === row.id ? "animate-pulse" : ""}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">
                          {row.patientName ?? "—"} · {row.doctorName}
                        </p>
                        <p className="font-bold" dir="ltr">{money(row.amount, row.currency)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {[
                          t(`admin.payments.reason.${row.refundReason ?? "slotLost"}`),
                          row.doctorCancelReason,
                          when(row.scheduledAt),
                          row.gateway === "receipt" ? t("admin.payments.byReceipt") : row.referenceId,
                          row.cardPan,
                          row.patientPhone,
                          row.patientEmail,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => {
                          if (!window.confirm(t("admin.payments.confirmRefunded"))) return;
                          run(row.id, () => markRefundedAction(row.id), t("admin.payments.refundedDone"));
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                        {t("admin.payments.markRefunded")}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
