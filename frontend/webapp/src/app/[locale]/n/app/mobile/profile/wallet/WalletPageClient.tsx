"use client";

import { useEffect, useMemo, useState, useTransition, type ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  CreditCard,
  Building2,
  Bitcoin,
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
  X,
} from "lucide-react";

import { useNavigate } from "@/hooks/use-navigate";
import { createWalletCryptoTopUpAction, createWalletTopUpIntentAction } from "./actions";
import type {
  CreateTopUpIntentInput,
  WalletPageData,
  WalletPaymentMethod,
  WalletTransactionRow,
} from "./types";

interface WalletPageClientProps {
  initialData: WalletPageData;
}

/** The three outcomes verifyWalletTopUpPayment can report. */
type TopUpStatus = "succeeded" | "cancelled" | "failed";

type TopUpResult = {
  status: TopUpStatus;
  message: string | null;
  referenceId: string | null;
};

const TOP_UP_STATUSES: TopUpStatus[] = ["succeeded", "cancelled", "failed"];

const isTopUpStatus = (value: string | null): value is TopUpStatus =>
  !!value && TOP_UP_STATUSES.includes(value as TopUpStatus);

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("MobileProfile.wallet");

  // A gateway returns the customer to this page after a top-up, and the outcome
  // exists only in the query string the callback route appends. Nothing read it,
  // so someone who had just paid landed on their wallet with no confirmation at
  // all — and, because the balance was rendered before the payment settled, often
  // on a stale number too. Read it once, tell them, refresh the balance, then
  // strip the params so a reload cannot resurrect an old verdict.
  const [topUpResult, setTopUpResult] = useState<TopUpResult | null>(null);

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

  // Crypto top-up state (receipt travels as multipart FormData).
  const [cryptoNetwork, setCryptoNetwork] = useState("");
  const [cryptoTxHash, setCryptoTxHash] = useState("");
  const [cryptoReceipt, setCryptoReceipt] = useState<File | null>(null);
  const [cryptoReceiptPreview, setCryptoReceiptPreview] = useState<string | null>(null);
  const [cryptoReceiptError, setCryptoReceiptError] = useState<string | null>(null);
  const [cryptoSubmitted, setCryptoSubmitted] = useState(false);

  useEffect(() => {
    // `payment` is what the booking flow already uses and what the callback keeps
    // for compatibility; `walletPaymentStatus` is the wallet-specific name.
    const raw =
      searchParams.get("payment") ?? searchParams.get("walletPaymentStatus");
    if (!raw) return;

    const status: TopUpStatus = isTopUpStatus(raw) ? raw : "failed";
    const message = searchParams.get("message");

    setTopUpResult({
      status,
      message,
      referenceId: searchParams.get("referenceId"),
    });

    if (status === "succeeded") {
      toast.success(t("topUpResult.succeededToast"));
      // The server component rendered the balance before the gateway settled.
      router.refresh();
    } else if (status === "cancelled") {
      toast.info(t("topUpResult.cancelledToast"));
    } else {
      toast.error(message || t("topUpResult.failedToast"));
    }

    router.replace(pathname, { scroll: false });
  }, [searchParams, pathname, router, t]);

  const balances = initialData.balances;
  const transactions = useMemo(() => {
    return initialData.transactions.filter((transaction) => {
      if (filterMode === "all") return true;
      return transaction.direction === filterMode;
    });
  }, [filterMode, initialData.transactions]);

  const quickAmounts = getQuickAmounts(selectedCurrency);
  const onlineCardGateways = initialData.paymentGateways ?? [];

  const closeTopUpModal = () => {
    setShowTopUpModal(false);
    setTopUpAmount(null);
    setTopUpMethod(null);
    setSubmitError(null);
    setCryptoNetwork("");
    setCryptoTxHash("");
    setCryptoReceipt(null);
    setCryptoReceiptPreview(null);
    setCryptoReceiptError(null);
    setCryptoSubmitted(false);
  };

  const handleReceiptChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCryptoReceiptError(null);
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setCryptoReceipt(null);
      setCryptoReceiptPreview(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setCryptoReceipt(null);
      setCryptoReceiptPreview(null);
      setCryptoReceiptError(t("crypto.receiptWrongType"));
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setCryptoReceipt(null);
      setCryptoReceiptPreview(null);
      setCryptoReceiptError(t("crypto.receiptTooLarge"));
      return;
    }

    setCryptoReceipt(file);
    setCryptoReceiptPreview(URL.createObjectURL(file));
  };

  const handleTopUp = () => {
    if (!topUpAmount || !topUpMethod) {
      return;
    }

    setSubmitError(null);

    if (topUpMethod === "crypto") {
      if (!cryptoReceipt) {
        setSubmitError(t("crypto.receiptRequired"));
        return;
      }

      startSubmitting(async () => {
        const formData = new FormData();
        formData.append("amount", String(topUpAmount));
        formData.append("currencyCode", selectedCurrency);
        formData.append("network", cryptoNetwork.trim());
        formData.append("txHash", cryptoTxHash.trim());
        formData.append("receipt", cryptoReceipt);

        const result = await createWalletCryptoTopUpAction(formData);

        if (!result.ok) {
          setSubmitError(result.message);
          return;
        }

        setCryptoSubmitted(true);
        router.refresh();
      });
      return;
    }

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

      closeTopUpModal();

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
            onClick={() => navigate("/n/app/mobile/profile/my-wallet/history")}
            className="h-10 px-4 text-sm font-semibold text-[#083f30] hover:underline"
          >
            {t("viewAll")}
          </button>
        </div>
      </div>

      {topUpResult ? (
        <div className="px-5 pt-5">
          <div
            role="status"
            aria-live="polite"
            className={`flex items-start gap-3 rounded-2xl border p-4 ${
              topUpResult.status === "succeeded"
                ? "border-emerald-200 bg-emerald-50"
                : topUpResult.status === "cancelled"
                  ? "border-amber-200 bg-amber-50"
                  : "border-red-200 bg-red-50"
            }`}
          >
            {topUpResult.status === "succeeded" ? (
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
            ) : topUpResult.status === "cancelled" ? (
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-600" />
            ) : (
              <XCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
            )}

            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-semibold ${
                  topUpResult.status === "succeeded"
                    ? "text-emerald-900"
                    : topUpResult.status === "cancelled"
                      ? "text-amber-900"
                      : "text-red-900"
                }`}
              >
                {t(`topUpResult.${topUpResult.status}Title`)}
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {topUpResult.message || t(`topUpResult.${topUpResult.status}Body`)}
              </p>
              {topUpResult.referenceId ? (
                <p className="mt-2 text-xs text-gray-500">
                  {t("topUpResult.reference", { reference: topUpResult.referenceId })}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setTopUpResult(null)}
              aria-label={t("topUpResult.dismiss")}
              className="shrink-0 rounded-full p-1 text-gray-500 transition-colors hover:bg-black/5"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : null}

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
              onClick={() => navigate(`/n/app/mobile/profile/my-wallet/transaction/${transaction.id}`)}
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
                  onClick={closeTopUpModal}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>
            </div>

            {cryptoSubmitted ? (
              <div className="p-6 pb-24 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                  <Clock size={30} className="text-amber-600" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{t("crypto.submitted")}</h3>
                <div className="mb-6 inline-flex items-center gap-1 text-sm text-amber-600">
                  <Clock size={14} />
                  <span>{t("statuses.pending")}</span>
                </div>
                <button
                  onClick={closeTopUpModal}
                  className="w-full h-14 rounded-xl bg-[#083f30] font-bold text-white transition-colors hover:bg-[#0a5a44]"
                >
                  {t("crypto.done")}
                </button>
              </div>
            ) : (
              <>
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
                      <span className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
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
                        className="w-full h-14 ps-14 pe-4 border-2 border-gray-200 rounded-xl font-semibold focus:border-[#083f30] focus:outline-none transition-colors"
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
                        {
                          id: "crypto",
                          name: t("paymentMethods.crypto"),
                          icon: <Bitcoin size={24} />,
                          details: t("paymentMethods.cryptoDetails"),
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
                          <div className="flex-1 text-start">
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
                            className={`w-full rounded-xl border-2 p-3 text-start transition-all ${
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

                    {topUpMethod === "crypto" ? (
                      <div className="mt-4 space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
                        <div>
                          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">{t("crypto.depositAddress")}</div>
                          <div
                            dir="ltr"
                            style={{ direction: "ltr", unicodeBidi: "isolate" }}
                            className="break-all rounded-xl border border-dashed border-gray-300 bg-white p-3 text-start font-mono text-sm text-gray-800"
                          >
                            {t("crypto.depositAddressValue")}
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">{t("crypto.network")}</label>
                          <input
                            type="text"
                            value={cryptoNetwork}
                            onChange={(e) => setCryptoNetwork(e.target.value)}
                            placeholder="USDT TRC20"
                            className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-3 text-start focus:border-[#083f30] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                            {t("crypto.receiptImage")} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleReceiptChange}
                            className="block w-full text-sm text-gray-600 file:me-3 file:rounded-lg file:border-0 file:bg-[#083f30] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#0a5a44]"
                          />
                          {cryptoReceiptError ? (
                            <p className="mt-1 text-xs text-red-600">{cryptoReceiptError}</p>
                          ) : null}
                          {cryptoReceiptPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cryptoReceiptPreview}
                              alt={t("crypto.receiptImage")}
                              className="mt-2 max-h-40 w-auto rounded-lg border border-gray-200 object-contain"
                            />
                          ) : null}
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">{t("crypto.txHash")}</label>
                          <input
                            type="text"
                            dir="ltr"
                            style={{ direction: "ltr", unicodeBidi: "isolate" }}
                            value={cryptoTxHash}
                            onChange={(e) => setCryptoTxHash(e.target.value)}
                            className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-3 text-start font-mono text-sm focus:border-[#083f30] focus:outline-none"
                          />
                        </div>
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
                    disabled={
                      !topUpAmount ||
                      !topUpMethod ||
                      (topUpMethod === "card" && !selectedGateway) ||
                      (topUpMethod === "crypto" && !cryptoReceipt) ||
                      isSubmitting
                    }
                    className={`w-full h-14 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      topUpAmount &&
                      topUpMethod &&
                      !(topUpMethod === "card" && !selectedGateway) &&
                      !(topUpMethod === "crypto" && !cryptoReceipt) &&
                      !isSubmitting
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
