"use client";

import { AlertCircle, ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import type { WalletHistoryPageData } from "@/app/[locale]/n/app/mobile/profile/my-wallet/types";
import { currencySymbol, formatAmount, formatTransactionDate, getStatusPresentation } from "@/app/[locale]/n/app/mobile/profile/my-wallet/utils";

import { Reveal } from "../components/motion";

type Transaction = WalletHistoryPageData["transactions"][number];

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold text-[#8c6b2c]">{label}</p>
      <div className="flex flex-col gap-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-4 py-2 text-start text-sm font-bold transition ${
              value === option.value ? "bg-[#083f30] text-[#eacb7f]" : "text-[#3d4b45] hover:bg-[#f6f1e6]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Desktop wallet history (>= 1280px). Filters and data come from TransactionsPageClient. */
export function DesktopTransactionsLayout({
  transactions,
  summaryCurrency,
  netText,
  type,
  status,
  period,
  onType,
  onStatus,
  onPeriod,
  onClear,
  activeCount,
  onOpen,
}: {
  transactions: Transaction[];
  summaryCurrency: string;
  netText: string;
  type: string;
  status: string;
  period: string;
  onType: (value: string) => void;
  onStatus: (value: string) => void;
  onPeriod: (value: string) => void;
  onClear: () => void;
  activeCount: number;
  onOpen: (id: string) => void;
}) {
  const t = useTranslations("MobileProfile.transactions");
  const tt = useTranslations("MobileProfile");

  return (
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      {/* Hero */}
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg flex items-end justify-between gap-10 overflow-hidden rounded-[36px] px-12 py-12 text-white">
          <Reveal className="space-y-3">
            <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">LEDGER</span>
            <h1 className="text-[40px] font-black leading-tight">{t("title")}</h1>
            <p className="text-base text-white/70">{t("summary", { count: transactions.length, currency: summaryCurrency })}</p>
          </Reveal>
          <Reveal delay={150} className="text-end">
            <p className="lsd-gold-text text-[48px] font-black leading-none" dir="ltr">
              {netText}
            </p>
            <p className="mt-2 text-sm text-white/60">{t("total")}</p>
          </Reveal>
        </div>
      </section>

      <div className="lsd-container mt-10 grid grid-cols-[280px_1fr] items-start gap-8">
        {/* Filters, always visible */}
        <aside className="sticky top-28 space-y-7 rounded-[26px] bg-white p-6 ring-1 ring-[#e7dcc4]">
          <FilterGroup
            label={t("transactionType")}
            value={type}
            onChange={onType}
            options={[
              { value: "all", label: t("types.all") },
              { value: "credit", label: t("types.credit") },
              { value: "debit", label: t("types.debit") },
            ]}
          />
          <FilterGroup
            label={t("status")}
            value={status}
            onChange={onStatus}
            options={[
              { value: "all", label: t("statuses.all") },
              { value: "completed", label: t("statuses.completed") },
              { value: "pending", label: t("statuses.pending") },
              { value: "failed", label: t("statuses.failed") },
            ]}
          />
          <FilterGroup
            label={t("timePeriod")}
            value={period}
            onChange={onPeriod}
            options={[
              { value: "all", label: t("periods.all") },
              { value: "today", label: t("periods.today") },
              { value: "week", label: t("periods.week") },
              { value: "month", label: t("periods.month") },
              { value: "3months", label: t("periods.threeMonths") },
            ]}
          />
          {activeCount > 0 ? (
            <button type="button" onClick={onClear} className="w-full rounded-full py-2.5 text-sm font-bold text-[#8c6b2c] ring-1 ring-[#e7dcc4] transition hover:bg-[#fbf3de]">
              {tt("clearAll")}
            </button>
          ) : null}
        </aside>

        {/* List */}
        <div className="overflow-hidden rounded-[30px] bg-white ring-1 ring-[#e7dcc4]">
          {transactions.length ? (
            <ul className="divide-y divide-[#f1ead9]">
              {transactions.map((transaction) => {
                const presentation = getStatusPresentation(transaction.status, t);
                const credit = transaction.direction === "credit";
                const danger = presentation.tone === "danger";
                return (
                  <li key={transaction.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(transaction.id)}
                      className="grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-6 px-8 py-5 text-start transition hover:bg-[#fbf8f1]"
                    >
                      <span
                        className={`grid h-12 w-12 place-items-center rounded-full ${
                          credit ? "bg-[#083f30] text-[#eacb7f]" : danger ? "bg-[#fdf1ef] text-[#b2453a]" : "bg-[#f6f1e6] text-[#8c6b2c]"
                        }`}
                      >
                        {credit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-[#0e1a16]">{transaction.title}</span>
                        <span className="mt-0.5 block truncate text-sm text-[#6b6150]">{transaction.subtitle ?? t("lsevinWallet")}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-[#8a8170]">
                        <Clock size={13} />
                        {formatTransactionDate(transaction.occurredAt, t)}
                      </span>
                      <span className="flex min-w-[150px] flex-col items-end gap-1">
                        <span className={`font-black ${credit ? "text-[#0f5a45]" : danger ? "text-[#b2453a]" : "text-[#0e1a16]"}`} dir="ltr">
                          {credit ? "+" : ""}
                          {currencySymbol(transaction.currencyCode)}
                          {formatAmount(transaction.amount)}
                        </span>
                        <span
                          className={`flex items-center gap-1 text-xs font-bold ${
                            presentation.tone === "success" ? "text-[#0f5a45]" : presentation.tone === "warning" ? "text-[#b08a3c]" : "text-[#b2453a]"
                          }`}
                        >
                          {presentation.tone === "success" ? <CheckCircle2 size={12} /> : presentation.tone === "warning" ? <AlertCircle size={12} /> : <XCircle size={12} />}
                          {presentation.label}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-8 py-20 text-center">
              <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-[#f6f1e6] text-[#c9a55a]">
                <Clock size={26} />
              </span>
              <h3 className="text-lg font-black text-[#0e1a16]">{t("noTransactionsFound")}</h3>
              <p className="mt-2 text-sm text-[#6b6150]">{t("tryAdjustingFilters")}</p>
              <button type="button" onClick={onClear} className="lsd-btn lsd-btn-green mt-6 h-12 px-7 text-sm">
                {tt("clearFilters")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}