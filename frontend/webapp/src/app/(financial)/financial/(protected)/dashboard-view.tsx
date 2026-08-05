import Link from "next/link";

import { formatAmount } from "@/accounting/lib/format";
import type { MonthlyVolumeRow, PendingDocumentRow } from "@/accounting/server/analytics.queries";
import type { EntryListRow } from "@/accounting/server/manual-entry.queries";

/**
 * The dashboard, laid out to match the prototype: four headline metrics, a
 * six-month volume chart, then the most recent documents.
 *
 * Every number here is read from the ledger. The prototype's figures were
 * illustrative; these are not, which is why a quiet month shows a flat bar rather
 * than being dropped from the chart.
 */

const STATUS: Record<string, { text: string; className: string }> = {
  draft: { text: "پیش‌نویس", className: "bg-zinc-100 text-zinc-600" },
  temporary: { text: "موقت", className: "bg-amber-50 text-amber-800" },
  approved: { text: "تأییدشده", className: "bg-blue-50 text-blue-800" },
  posted: { text: "قطعی", className: "bg-emerald-50 text-emerald-800" },
  reversed: { text: "برگشتی", className: "bg-purple-50 text-purple-800" },
  rejected: { text: "ردشده", className: "bg-red-50 text-red-800" },
};

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "danger" | "warn";
}) {
  return (
    <div className="rounded-2xl border border-[#dfe5eb] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,.08)]">
      <div className="text-xs text-[#6b7785]">{label}</div>
      <div
        className={`mt-1 text-2xl font-black ${
          tone === "danger" ? "text-[#d64545]" : tone === "warn" ? "text-[#d99000]" : ""
        }`}
        dir="ltr"
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-[#6b7785]">{hint}</div>}
    </div>
  );
}

export function DashboardView({
  monthly,
  pending,
  recent,
  systemBalanceLabel,
  driftCount,
}: {
  monthly: MonthlyVolumeRow[];
  pending: PendingDocumentRow[];
  recent: EntryListRow[];
  systemBalanceLabel: string;
  driftCount: number;
}) {
  const postedTotal = recent
    .filter((e) => e.status === "posted")
    .reduce((sum, e) => sum + Number(e.totalDebit), 0);

  const unbalanced = pending.filter((p) => p.isUnbalanced).length;

  // Bars are scaled against the busiest month so the tallest always fills the
  // frame; scaling against a fixed ceiling makes every month look empty early on.
  const peak = Math.max(...monthly.map((m) => Number(m.totalDebit)), 1);

  return (
    <div className="space-y-4">
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="گردش بدهکار اسناد اخیر"
          value={postedTotal.toLocaleString("fa-IR", { maximumFractionDigits: 0 })}
          hint="ریال — فقط اسناد قطعی"
        />
        <Metric
          label="اسناد در انتظار"
          value={pending.length.toLocaleString("fa-IR")}
          hint="پیش‌نویس، موقت یا تأییدشده"
          tone={pending.length > 0 ? "warn" : undefined}
        />
        <Metric
          label="اسناد نامتوازن"
          value={unbalanced.toLocaleString("fa-IR")}
          hint="قابل قطعی‌شدن نیستند"
          tone={unbalanced > 0 ? "danger" : undefined}
        />
        <Metric
          label="مغایرت کیف پول"
          value={driftCount.toLocaleString("fa-IR")}
          hint={systemBalanceLabel}
          tone={driftCount > 0 ? "danger" : undefined}
        />
      </div>

      <div className="mb-2.5 mt-4 flex items-center justify-between gap-2.5">
        <h3 className="text-lg font-semibold">گردش شش ماه اخیر</h3>
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] text-emerald-800">
          از دفتر کل
        </span>
      </div>

      <div className="rounded-2xl border border-[#dfe5eb] bg-white shadow-[0_10px_30px_rgba(15,23,42,.08)]">
        <div className="flex h-60 items-end gap-4 border-t border-[#dfe5eb] p-4 pb-9 pt-8">
          {monthly.map((m) => {
            const value = Number(m.totalDebit);
            const height = Math.max((value / peak) * 100, 2);
            return (
              // The column must be full-height for the bar's percentage to resolve
              // against something; a percentage height inside an auto-height parent
              // computes to zero, which flattens every bar to a line.
              <div
                key={m.month}
                className="relative flex h-full flex-1 items-end"
                style={{ minWidth: 30 }}
              >
                <div
                  className="w-full rounded-t-[10px] bg-gradient-to-b from-[#1c8b66] to-[#0c5f46]"
                  style={{ height: `${height}%`, minHeight: 4 }}
                />
                <b
                  className="absolute right-1/2 translate-x-1/2 whitespace-nowrap text-[11px] font-normal"
                  style={{ bottom: `calc(${height}% + 6px)` }}
                >
                  {value === 0
                    ? "—"
                    : value >= 1_000_000
                      ? `${(value / 1_000_000).toLocaleString("fa-IR", { maximumFractionDigits: 1 })}م`
                      : value.toLocaleString("fa-IR", { maximumFractionDigits: 0 })}
                </b>
                <span className="absolute -bottom-7 right-1/2 translate-x-1/2 whitespace-nowrap text-[11px] text-[#6b7785]">
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-2.5 mt-4 flex items-center justify-between gap-2.5">
        <h3 className="text-lg font-semibold">آخرین اسناد</h3>
        <Link
          href="/financial/entries"
          className="rounded-xl border border-[#0c5f46] bg-[#0c5f46] px-3 py-2 text-xs text-white transition hover:-translate-y-px"
        >
          + سند جدید
        </Link>
      </div>

      <div className="overflow-auto rounded-2xl border border-[#dfe5eb] bg-white shadow-[0_10px_30px_rgba(15,23,42,.08)]">
        <table className="w-full min-w-[760px] text-[13px]">
          <thead>
            <tr className="bg-[#f8fafc] text-[#637083]">
              <th className="p-2.5 font-bold">شماره سند</th>
              <th className="p-2.5 font-bold">تاریخ</th>
              <th className="p-2.5 font-bold">شرح</th>
              <th className="p-2.5 font-bold">بدهکار</th>
              <th className="p-2.5 font-bold">بستانکار</th>
              <th className="p-2.5 font-bold">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-[#6b7785]">
                  هنوز سندی ثبت نشده است.
                </td>
              </tr>
            )}
            {recent.slice(0, 8).map((e) => {
              const s = STATUS[e.status] ?? { text: e.status, className: "bg-zinc-100" };
              return (
                <tr key={e.id} className="border-b border-[#edf1f5] last:border-0 hover:bg-[#fcfdfd]">
                  <td className="p-2.5 text-center font-mono" dir="ltr">
                    {e.entryNumber}
                  </td>
                  <td className="p-2.5 text-center" dir="ltr">
                    {e.entryDate}
                  </td>
                  <td className="p-2.5 text-center">{e.description ?? "—"}</td>
                  <td className="p-2.5 text-center" dir="ltr">
                    {formatAmount(e.totalDebit, e.baseCurrencyCode)}
                  </td>
                  <td className="p-2.5 text-center" dir="ltr">
                    {formatAmount(e.totalCredit, e.baseCurrencyCode)}
                  </td>
                  <td className="p-2.5 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] ${s.className}`}>
                      {s.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
