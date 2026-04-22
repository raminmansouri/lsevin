"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "@/hooks/use-navigate";
import {
  ArrowLeft,
  Filter,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

import type { WalletHistoryPageData } from "../types";
import {
  currencySymbol,
  formatAmount,
  formatTransactionDate,
  getStatusPresentation,
  matchesHistoryPeriod,
  matchesHistoryStatus,
  transactionNetAmount,
} from "../utils";

interface TransactionsPageClientProps {
  initialData: WalletHistoryPageData;
}

export default function TransactionsPageClient({ initialData }: TransactionsPageClientProps) {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  const filteredTransactions = useMemo(() => {
    return initialData.transactions.filter((transaction) => {
      if (selectedType !== "all" && transaction.direction !== selectedType) return false;
      if (!matchesHistoryStatus(transaction.status, selectedStatus)) return false;
      if (!matchesHistoryPeriod(transaction.occurredAt, selectedPeriod)) return false;
      return true;
    });
  }, [initialData.transactions, selectedPeriod, selectedStatus, selectedType]);

  const clearFilters = () => {
    setSelectedType("all");
    setSelectedStatus("all");
    setSelectedPeriod("all");
  };

  const activeFiltersCount = [selectedType, selectedStatus, selectedPeriod].filter(
    (value) => value !== "all"
  ).length;

  const summaryCurrency = initialData.defaultCurrency || "USD";
  const summaryNet = transactionNetAmount(filteredTransactions, summaryCurrency);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">All Transactions</h1>
          </div>

          <button
            onClick={() => setShowFilters(true)}
            className="relative h-10 px-4 text-sm font-semibold text-[#083f30] hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
          >
            <Filter size={16} />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#083f30] text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="bg-white rounded-2xl p-4">
          <p className="text-sm text-gray-600 mb-1">
            Showing {filteredTransactions.length} transactions • Net in {summaryCurrency}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {summaryNet > 0 ? "+" : ""}
              {currencySymbol(summaryCurrency)}
              {Math.abs(summaryNet).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-sm text-gray-500">total</span>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-2">
        {filteredTransactions.map((transaction) => {
          const status = getStatusPresentation(transaction.status);
          const isCredit = transaction.direction === "credit";
          const amountTone = isCredit
            ? "text-green-600"
            : status.tone === "danger"
            ? "text-red-600"
            : "text-gray-900";
          const iconBg = isCredit
            ? "bg-green-50"
            : status.tone === "danger"
            ? "bg-red-50"
            : "bg-gray-50";
          const iconTone = isCredit
            ? "text-green-600"
            : status.tone === "danger"
            ? "text-red-600"
            : "text-gray-600";

          return (
            <button
              key={transaction.id}
              onClick={() => navigate(`/app/wallet/transaction/${transaction.id}`)}
              className="w-full bg-white rounded-2xl p-4 border border-gray-200 hover:border-[#083f30] hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                  <div className={iconTone}>
                    {isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="font-semibold text-gray-900 mb-0.5 line-clamp-1">{transaction.title}</div>
                  <div className="text-sm text-gray-600 mb-1 line-clamp-1">
                    {transaction.subtitle ?? "LSevin Wallet"}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>{formatTransactionDate(transaction.occurredAt)}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className={`font-bold mb-1 ${amountTone}`}>
                    {isCredit ? "+" : ""}
                    {currencySymbol(transaction.currencyCode)}
                    {formatAmount(transaction.amount)}
                  </div>
                  <div
                    className={`flex items-center justify-end gap-1 text-xs ${
                      status.tone === "success"
                        ? "text-green-600"
                        : status.tone === "warning"
                        ? "text-orange-600"
                        : "text-red-600"
                    }`}
                  >
                    {status.tone === "success" && <CheckCircle2 size={12} />}
                    {status.tone === "warning" && <AlertCircle size={12} />}
                    {status.tone === "danger" && <XCircle size={12} />}
                    <span>{status.label}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {filteredTransactions.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={28} className="text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">No Transactions Found</h3>
            <p className="text-sm text-gray-600 mb-6">Try adjusting your filters</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-0">
          <div className="bg-white rounded-t-3xl w-full max-w-lg animate-slide-up">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Filter Transactions</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={24} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Transaction Type</label>
                <div className="space-y-2">
                  {[
                    { value: "all", label: "All Types" },
                    { value: "credit", label: "Money In" },
                    { value: "debit", label: "Money Out" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedType(option.value)}
                      className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${
                        selectedType === option.value
                          ? "border-[#083f30] bg-[#083f30]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="font-medium text-gray-900">{option.label}</span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedType === option.value ? "border-[#083f30]" : "border-gray-300"
                        }`}
                      >
                        {selectedType === option.value && <div className="w-3 h-3 bg-[#083f30] rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Status</label>
                <div className="space-y-2">
                  {[
                    { value: "all", label: "All Statuses" },
                    { value: "completed", label: "Completed" },
                    { value: "pending", label: "Pending" },
                    { value: "failed", label: "Failed" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedStatus(option.value)}
                      className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${
                        selectedStatus === option.value
                          ? "border-[#083f30] bg-[#083f30]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="font-medium text-gray-900">{option.label}</span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedStatus === option.value ? "border-[#083f30]" : "border-gray-300"
                        }`}
                      >
                        {selectedStatus === option.value && <div className="w-3 h-3 bg-[#083f30] rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Time Period</label>
                <div className="space-y-2">
                  {[
                    { value: "all", label: "All Time" },
                    { value: "today", label: "Today" },
                    { value: "week", label: "Last 7 Days" },
                    { value: "month", label: "Last 30 Days" },
                    { value: "3months", label: "Last 3 Months" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedPeriod(option.value)}
                      className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${
                        selectedPeriod === option.value
                          ? "border-[#083f30] bg-[#083f30]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="font-medium text-gray-900">{option.label}</span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPeriod === option.value ? "border-[#083f30]" : "border-gray-300"
                        }`}
                      >
                        {selectedPeriod === option.value && <div className="w-3 h-3 bg-[#083f30] rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 h-14 rounded-xl border-2 border-gray-300 font-bold text-gray-900 hover:bg-gray-50 transition-all active:scale-95"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 h-14 rounded-xl bg-[#083f30] text-white font-bold hover:bg-[#0a5a44] transition-all active:scale-95"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
