"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  Plus,
  CreditCard,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Filter,
  Tag,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { useNavigate } from "@/hooks/use-navigate";
import { createWalletTopUpIntentAction } from "./actions";
import type {
  CreateTopUpIntentInput,
  WalletPageData,
  WalletPaymentMethod,
  WalletTransactionRow,
} from "./types";

interface WalletPageClientProps {
  initialData: WalletPageData;
}

function getQuickAmounts(currency: string) {
  if (currency === "IRR") return [1000000, 2500000, 5000000, 10000000] as const;
  if (currency === "IRT") return [100000, 250000, 500000, 1000000] as const;
  return [100, 250, 500, 1000] as const;
}

function currencySymbol(currency: string) {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "AED":
      return "AED ";
    case "IRR":
      return "﷼ ";
    case "IRT":
      return "تومان ";
    default:
      return `${currency} `;
  }
}

function formatAmount(amount: number, locale: string) {
  return Math.abs(amount).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateString: string, locale: string, t: ReturnType<typeof useTranslations>) {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const candidate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (candidate.getTime() === today.getTime()) {
    return t("todayAt", { time: date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }) });
  }

  if (candidate.getTime() === yesterday.getTime()) {
    return t("yesterdayAt", { time: date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }) });
  }

  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TransactionStatus({ status, t }: { status: WalletTransactionRow["status"]; t: ReturnType<typeof useTranslations> }) {
  if (status === "completed") {
    return (
      <div className="flex items-center gap-1 text-xs text-green-600">
        <CheckCircle2 size={12} />
        <span>{t("statuses.completed")}</span>
      </div>
    );
  }

  if (status === "pending" || status === "processing") {
    return (
      <div className="flex items-center gap-1 text-xs text-amber-600">
        <Clock size={12} />
        <span>{status === "pending" ? t("statuses.pending") : t("statuses.processing")}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-red-600">
      <AlertCircle size={12} />
      <span>{status === "failed" ? t("statuses.failed") : t("statuses.cancelled")}</span>
    </div>
  );
}

export default function WalletPageClient({
  initialData,
}: WalletPageClientProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("MobileProfile.wallet");

  const [showBalance, setShowBalance] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState(
    initialData.defaultCurrency || "USD"
  );
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number | null>(null);
  const [topUpMethod, setTopUpMethod] = useState<
    Exclude<WalletPaymentMethod, "wallet"> | null
  >(null);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(
    initialData.paymentGateways?.[0]?.code ?? null
  );
  const [filterMode, setFilterMode] = useState<"all" | "credit" | "debit">("all");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, startSubmitting] = useTransition();

  const balances = initialData.balances;
  const transactions = useMemo(() => {
    return initialData.transactions.filter((transaction) => {
      if (filterMode === "all") return true;
      return transaction.direction === filterMode;
    });
  }, [filterMode, initialData.transactions]);

  const quickAmounts = getQuickAmounts(selectedCurrency);
  const onlineCardGateways = initialData.paymentGateways ?? [];

  const handleTopUp = () => {
    if (!topUpAmount || !topUpMethod) {
      return;
    }

    setSubmitError(null);

    startSubmitting(async () => {
      const payload: CreateTopUpIntentInput = {
        amount: topUpAmount,
        currencyCode: selectedCurrency,
        paymentMethod: topUpMethod,
        gateway: topUpMethod === "card" ? selectedGateway : null,
      };

      const result = await createWalletTopUpIntentAction(payload);

      if (!result.ok) {
        setSubmitError(result.message);
        return;
      }

      setShowTopUpModal(false);
      setTopUpAmount(null);
      setTopUpMethod(null);

      if (result.redirectUrl) {
        router.push(result.redirectUrl);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">{t("title")}</h1>
          </div>

          <button
            onClick={() => navigate("/app/wallet/history")}
            className="h-10 px-4 text-sm font-semibold text-[#083f30] hover:underline"
          >
            {t("viewAll")}
          </button>
        </div>
      </div>

      <div className="px-5 py-6">
        <div className="bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-3xl p-6 shadow-xl">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/80 text-sm mb-2">{t("totalBalance")}</p>
              <div className="flex items-baseline gap-3">
                {showBalance ? (
                  <>
                    <span className="text-4xl font-bold text-white">
                      {currencySymbol(selectedCurrency)}
                      {(balances[selectedCurrency] ?? 0).toLocaleString(locale, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-white/60 text-lg">{selectedCurrency}</span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-white">••••••</span>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowBalance((value) => !value)}
              className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              {showBalance ? (
                <Eye size={20} className="text-white" />
              ) : (
                <EyeOff size={20} className="text-white" />
              )}
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            {initialData.supportedCurrencies.map((currency) => (
              <button
                key={currency}
                onClick={() => setSelectedCurrency(currency)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  selectedCurrency === currency
                    ? "bg-[#eacb7f] text-[#083f30]"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {currency}
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setShowTopUpModal(true)}
              className="bg-[#eacb7f] hover:bg-[#d4b76c] rounded-xl px-8 py-4 transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-[#083f30] rounded-full flex items-center justify-center">
                <Plus size={20} className="text-white" />
              </div>
              <span className="text-[#083f30] font-bold">{t("topUpWallet")}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-5">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => navigate("/app/coupon")}
            className="flex-1 h-12 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-900 hover:border-[#083f30] transition-all flex items-center justify-center gap-2"
          >
            <Tag size={18} />
            {t("applyCoupon")}
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{t("recentTransactions")}</h2>
          <button
            onClick={() =>
              setFilterMode((current) =>
                current === "all" ? "credit" : current === "credit" ? "debit" : "all"
              )
            }
            className="text-sm font-semibold text-[#083f30] hover:underline"
          >
            <Filter size={16} className="inline-block mr-1" />
            {filterMode === "all"
              ? t("filters.filter")
              : filterMode === "credit"
              ? t("filters.credits")
              : t("filters.debits")}
          </button>
        </div>

        <div className="space-y-2">
          {transactions.map((transaction) => (
            <button
              key={transaction.id}
              onClick={() => navigate(`/app/wallet/transaction/${transaction.id}`)}
              className="w-full bg-white rounded-2xl p-4 border border-gray-200 hover:border-[#083f30] hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                    transaction.direction === "credit" ? "bg-green-50" : "bg-gray-50"
                  }`}
                >
                  <div
                    className={
                      transaction.direction === "credit"
                        ? "text-green-600"
                        : "text-gray-600"
                    }
                  >
                    {transaction.direction === "credit" ? (
                      <ArrowDownLeft size={20} />
                    ) : (
                      <ArrowUpRight size={20} />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="font-semibold text-gray-900 mb-0.5 line-clamp-1">
                    {transaction.title}
                  </div>
                  <div className="text-sm text-gray-600 mb-1 line-clamp-1">
                    {transaction.subtitle ?? t("lsevinWallet")}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>{formatDate(transaction.occurredAt, locale, t)}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div
                    className={`font-bold mb-1 ${
                      transaction.direction === "credit"
                        ? "text-green-600"
                        : "text-gray-900"
                    }`}
                  >
                    {transaction.direction === "credit" ? "+" : ""}
                    {currencySymbol(transaction.currencyCode)}
                    {formatAmount(transaction.amount, locale)}
                  </div>
                  <TransactionStatus status={transaction.status} t={t} />
                </div>
              </div>
            </button>
          ))}
        </div>

        {transactions.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={28} className="text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">{t("noTransactionsYet")}</h3>
            <p className="text-sm text-gray-600 mb-6">
              {t("emptyDescription")}
            </p>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="px-6 py-3 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors"
            >
              {t("topUpWallet")}
            </button>
          </div>
        )}
      </div>

      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-0">
          <div className="bg-white rounded-t-3xl w-full max-w-lg animate-slide-up">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{t("topUpWallet")}</h2>
                <button
                  onClick={() => {
                    setShowTopUpModal(false);
                    setTopUpAmount(null);
                    setTopUpMethod(null);
                    setSubmitError(null);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  {t("selectAmount")}
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTopUpAmount(amount)}
                      className={`h-14 rounded-xl border-2 font-bold transition-all ${
                        topUpAmount === amount
                          ? "border-[#083f30] bg-[#083f30]/5 text-[#083f30]"
                          : "border-gray-200 hover:border-gray-300 text-gray-900"
                      }`}
                    >
                      {currencySymbol(selectedCurrency)}
                      {amount.toLocaleString(locale)}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    {currencySymbol(selectedCurrency)}
                  </span>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    value={topUpAmount ?? ""}
                    onChange={(e) => {
                      const parsed = Number(e.target.value);
                      setTopUpAmount(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
                    }}
                    placeholder={t("enterCustomAmount")}
                    className="w-full h-14 pl-14 pr-4 border-2 border-gray-200 rounded-xl font-semibold focus:border-[#083f30] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  {t("paymentMethod")}
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: "card",
                      name: t("paymentMethods.onlineCard"),
                      icon: <CreditCard size={24} />,
                      details: onlineCardGateways.length ? t("paymentMethods.cardDetails") : t("paymentMethods.noGateway"),
                    },
                    {
                      id: "bank",
                      name: t("paymentMethods.bankTransfer"),
                      icon: <Building2 size={24} />,
                      details: t("paymentMethods.bankDetails"),
                    },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() =>
                        setTopUpMethod(method.id as Exclude<WalletPaymentMethod, "wallet">)
                      }
                      className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                        topUpMethod === method.id
                          ? "border-[#083f30] bg-[#083f30]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-[#083f30]">
                        {method.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900">{method.name}</div>
                        <div className="text-sm text-gray-600">{method.details}</div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          topUpMethod === method.id
                            ? "border-[#083f30]"
                            : "border-gray-300"
                        }`}
                      >
                        {topUpMethod === method.id && (
                          <div className="w-3 h-3 bg-[#083f30] rounded-full" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {topUpMethod === "card" ? (
                  <div className="mt-4 space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500">{t("gateway")}</div>
                    {onlineCardGateways.length === 0 ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        {t("noOnlineGateway")}
                      </div>
                    ) : null}
                    {onlineCardGateways.map((gateway) => (
                      <button
                        key={gateway.code}
                        type="button"
                        onClick={() => setSelectedGateway(gateway.code)}
                        className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
                          selectedGateway === gateway.code
                            ? "border-[#083f30] bg-white"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900">{gateway.displayName}</div>
                            <div className="text-xs text-gray-600">{t("gatewayCurrencyNote", { currency: gateway.currency, selectedCurrency })}</div>
                          </div>
                          <div
                            className={`h-5 w-5 rounded-full border-2 ${
                              selectedGateway === gateway.code
                                ? "border-[#083f30] bg-[#083f30]"
                                : "border-gray-300"
                            }`}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {submitError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white p-6 pb-24 border-t border-gray-200">
              <button
                onClick={handleTopUp}
                disabled={!topUpAmount || !topUpMethod || (topUpMethod === "card" && !selectedGateway) || isSubmitting}
                className={`w-full h-14 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  topUpAmount && topUpMethod && !(topUpMethod === "card" && !selectedGateway) && !isSubmitting
                    ? "bg-[#083f30] text-white hover:bg-[#0a5a44] shadow-lg active:scale-95"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t("processing")}
                  </>
                ) : (
                  <>
                    {t("topUpAmount", { amount: `${currencySymbol(selectedCurrency)}${topUpAmount?.toLocaleString(locale) ?? "0"}` })}
                    
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
