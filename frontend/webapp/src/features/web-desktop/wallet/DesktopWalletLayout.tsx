"use client";

import Image from "next/image";
import { AlertCircle, ArrowDownLeft, ArrowLeft, ArrowUpRight, CheckCircle2, Clock, Eye, EyeOff, History, Plus, Tag, X, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Reveal, Tilt } from "../components/motion";

type Direction = "credit" | "debit";
type Filter = "all" | Direction;

type Transaction = {
  id: string;
  title: string;
  subtitle?: string | null;
  direction: Direction;
  amount: number;
  currencyCode: string;
  occurredAt: string;
  status: string;
};

type TopUpResult = { status: "succeeded" | "cancelled" | "failed" | string; message?: string | null; referenceId?: string | null };

/** Desktop wallet (>= 1280px). All state and actions come from WalletPageClient; the top-up modal stays shared. */
export function DesktopWalletLayout({
  balanceText,
  showBalance,
  onToggleBalance,
  currencies,
  selectedCurrency,
  onSelectCurrency,
  onTopUp,
  onApplyCoupon,
  onViewAll,
  topUpResult,
  onDismissResult,
  transactions,
  filterMode,
  onFilter,
  onOpenTransaction,
  formatMoney,
  formatWhen,
  renderStatus,
}: {
  balanceText: string;
  showBalance: boolean;
  onToggleBalance: () => void;
  currencies: { code: string; label: string }[];
  selectedCurrency: string;
  onSelectCurrency: (code: string) => void;
  onTopUp: () => void;
  onApplyCoupon: () => void;
  onViewAll: () => void;
  topUpResult: TopUpResult | null;
  onDismissResult: () => void;
  transactions: Transaction[];
  filterMode: Filter;
  onFilter: (mode: Filter) => void;
  onOpenTransaction: (id: string) => void;
  formatMoney: (amount: number, currency: string) => string;
  formatWhen: (date: string) => string;
  renderStatus: (status: string) => ReactNode;
}) {
  const t = useTranslations("MobileProfile.wallet");
  const currencyLabel = currencies.find((currency) => currency.code === selectedCurrency)?.label ?? selectedCurrency;
  const resultTone =
    topUpResult?.status === "succeeded"
      ? { box: "border-[#bfe3d2] bg-[#eef8f3]", title: "text-[#0f5a45]", icon: <CheckCircle2 size={20} className="text-[#0f5a45]" /> }
      : topUpResult?.status === "cancelled"
        ? { box: "border-[#f0dcae] bg-[#fdf7e8]", title: "text-[#8c6b2c]", icon: <AlertCircle size={20} className="text-[#b08a3c]" /> }
        : { box: "border-[#f1c7c0] bg-[#fdf1ef]", title: "text-[#8f2f26]", icon: <XCircle size={20} className="text-[#b2453a]" /> };

  return (
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      {/* Top-up result after returning from the gateway */}
      {topUpResult ? (
        <section className="lsd-container pt-6">
          <div role="status" aria-live="polite" className={`flex items-start gap-4 rounded-[20px] border px-6 py-5 ${resultTone.box}`}>
            <span className="mt-0.5 shrink-0">{resultTone.icon}</span>
            <div className="min-w-0 flex-1">
              <p className={`font-bold ${resultTone.title}`}>{t(`topUpResult.${topUpResult.status}Title` as never)}</p>
              <p className="mt-1 text-sm text-[#3d4b45]">{topUpResult.message || t(`topUpResult.${topUpResult.status}Body` as never)}</p>
              {topUpResult.referenceId ? (
                <p className="mt-2 text-xs text-[#6b6150]">{t("topUpResult.reference", { reference: topUpResult.referenceId })}</p>
              ) : null}
            </div>
            <button type="button" onClick={onDismissResult} aria-label={t("topUpResult.dismiss")} className="shrink-0 rounded-full p-1.5 text-[#6b6150] transition hover:bg-black/5">
              <X size={16} />
            </button>
          </div>
        </section>
      ) : null}

      {/* Hero: balance, currencies, actions, and the wallet card */}
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg relative grid grid-cols-[1.2fr_0.8fr] items-center gap-10 overflow-hidden rounded-[36px] px-12 py-12 text-white">
          <Reveal className="relative space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">PRIVATE WALLET</span>
              <p className="text-sm text-white/65">{t("totalBalance")}</p>
              <div className="flex items-center gap-4">
                <p className="lsd-gold-text text-[52px] font-black leading-none [overflow-wrap:anywhere]" dir="ltr">
                  {showBalance ? balanceText : "••••••"}
                </p>
                <button
                  type="button"
                  onClick={onToggleBalance}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
                >
                  {showBalance ? <Eye size={19} /> : <EyeOff size={19} />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  type="button"
                  onClick={() => onSelectCurrency(currency.code)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    selectedCurrency === currency.code ? "bg-[#eacb7f] text-[#062a20]" : "bg-white/10 text-white/80 hover:bg-white/20"
                  }`}
                >
                  {currency.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={onTopUp} className="lsd-btn lsd-btn-gold h-13 px-7 py-3.5">
                <Plus size={18} />
                {t("topUpWallet")}
              </button>
              <button
                type="button"
                onClick={onApplyCoupon}
                className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-bold text-white/85 ring-1 ring-white/20 transition hover:bg-white/10"
              >
                <Tag size={16} />
                {t("applyCoupon")}
              </button>
              <button type="button" onClick={onViewAll} className="inline-flex h-12 items-center gap-2 px-3 text-sm font-bold text-[#eacb7f] transition hover:text-white">
                <History size={16} />
                {t("viewAll")}
              </button>
            </div>
          </Reveal>

          <Reveal delay={150} className="relative flex justify-center">
            <Tilt max={8} className="w-full max-w-[380px]">
              <div className="lsd-champagne-bg flex aspect-[1.586] flex-col justify-between rounded-[24px] border border-[#eacb7f] p-7 text-[#0e1a16] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold tracking-[0.4em] text-[#8c6b2c]">L SEVIN</span>
                  <Image src="/brand/lsevin-mark.png" alt="" aria-hidden="true" width={30} height={42} />
                </div>
                <div>
                  <p className="text-xs text-[#6b6150]">{t("lsevinWallet")}</p>
                  <p className="mt-1 text-2xl font-black text-[#083f30] [overflow-wrap:anywhere]" dir="ltr">
                    {showBalance ? balanceText : "••••••"}
                  </p>
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-mono text-xs tracking-[0.3em] text-[#8c6b2c]">•••• •••• ••••</span>
                  <span className="rounded-full bg-[#083f30] px-3 py-1 text-xs font-bold text-[#eacb7f]">{currencyLabel}</span>
                </div>
              </div>
            </Tilt>
          </Reveal>
        </div>
      </section>

      {/* Transactions */}
      <section className="lsd-container mt-12">
        <div className="overflow-hidden rounded-[30px] bg-white ring-1 ring-[#e7dcc4]">
          <div className="flex items-center justify-between gap-6 border-b border-[#efe7d5] px-8 py-6">
            <h2 className="text-xl font-black text-[#0e1a16]">{t("recentTransactions")}</h2>
            <div className="flex gap-1 rounded-full bg-[#f6f1e6] p-1">
              {(
                [
                  ["all", t("filters.filter")],
                  ["credit", t("filters.credits")],
                  ["debit", t("filters.debits")],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onFilter(mode)}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                    filterMode === mode ? "bg-[#083f30] text-[#eacb7f]" : "text-[#6b6150] hover:text-[#083f30]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ul className="divide-y divide-[#f1ead9]">
            {transactions.map((transaction) => {
              const credit = transaction.direction === "credit";
              return (
                <li key={transaction.id}>
                  <button
                    type="button"
                    onClick={() => onOpenTransaction(transaction.id)}
                    className="group grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-6 px-8 py-5 text-start transition hover:bg-[#fbf8f1]"
                  >
                    <span className={`grid h-12 w-12 place-items-center rounded-full ${credit ? "bg-[#083f30] text-[#eacb7f]" : "bg-[#f6f1e6] text-[#8c6b2c]"}`}>
                      {credit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-[#0e1a16]">{transaction.title}</span>
                      <span className="mt-0.5 block truncate text-sm text-[#6b6150]">{transaction.subtitle ?? t("lsevinWallet")}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#8a8170]">
                      <Clock size={13} />
                      {formatWhen(transaction.occurredAt)}
                    </span>
                    <span className="flex min-w-[150px] flex-col items-end gap-1">
                      <span className={`font-black ${credit ? "text-[#0f5a45]" : "text-[#0e1a16]"}`} dir="ltr">
                        {credit ? "+" : ""}
                        {formatMoney(transaction.amount, transaction.currencyCode)}
                      </span>
                      {renderStatus(transaction.status)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={onViewAll}
            className="flex w-full items-center justify-center gap-2 border-t border-[#efe7d5] py-4 text-sm font-bold text-[#083f30] transition hover:bg-[#fbf8f1]"
          >
            {t("viewAll")}
            <ArrowLeft size={15} className="ltr:rotate-180" />
          </button>
        </div>
      </section>
    </div>
  );
}