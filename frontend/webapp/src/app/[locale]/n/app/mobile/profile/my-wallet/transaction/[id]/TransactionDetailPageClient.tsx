"use client";

import { useState } from "react";
import { useNavigate } from "@/hooks/use-navigate";
import {
  ArrowLeft,
  Download,
  Share2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  CreditCard,
  MapPin,
  FileText,
} from "lucide-react";

import type { WalletTransactionDetailData } from "../../types";
import {
  buildReceiptTitle,
  currencySymbol,
  formatAmount,
  formatLongDate,
  getStatusPresentation,
  shareTransactionText,
} from "../../utils";

interface TransactionDetailPageClientProps {
  transaction: WalletTransactionDetailData;
}

export default function TransactionDetailPageClient({
  transaction,
}: TransactionDetailPageClientProps) {
  const navigate = useNavigate();
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const status = getStatusPresentation(transaction.status);

  const handleShare = async () => {
    const text = shareTransactionText(transaction);
    const url = `${window.location.origin}/app/wallet/transaction/${transaction.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: buildReceiptTitle(transaction),
          text,
          url,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShareMessage("Transaction link copied.");
        window.setTimeout(() => setShareMessage(null), 2500);
      }
    } catch {
      // ignored
    }
  };

  const handleDownload = () => {
    window.open(
      `/app/wallet/transaction/${transaction.id}/receipt`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const statusIcon =
    status.tone === "success" ? (
      <CheckCircle2 size={24} className="text-green-600" />
    ) : status.tone === "warning" ? (
      <AlertCircle size={24} className="text-orange-600" />
    ) : status.tone === "danger" ? (
      <XCircle size={24} className="text-red-600" />
    ) : (
      <Clock size={24} className="text-gray-600" />
    );

  const statusColor =
    status.tone === "success"
      ? "bg-green-50 text-green-700 border-green-200"
      : status.tone === "warning"
      ? "bg-orange-50 text-orange-700 border-orange-200"
      : "bg-red-50 text-red-700 border-red-200";

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
            <h1 className="text-lg font-bold text-gray-900">Transaction Details</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <Share2 size={20} className="text-gray-600" />
            </button>
            <button
              onClick={handleDownload}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <Download size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">
        <div className="bg-white rounded-3xl p-6 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
            {statusIcon}
          </div>

          <div
            className={`text-4xl font-bold mb-2 ${
              transaction.direction === "credit"
                ? "text-green-600"
                : status.tone === "danger"
                ? "text-red-600"
                : "text-gray-900"
            }`}
          >
            {transaction.direction === "credit" ? "+" : ""}
            {currencySymbol(transaction.currencyCode)}
            {formatAmount(transaction.amount)}
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${statusColor}`}>
            <span className="text-sm font-semibold">{status.label}</span>
          </div>

          <p className="text-sm text-gray-600 mt-4">{formatLongDate(transaction.occurredAt)}</p>
          {shareMessage && <p className="text-xs text-[#083f30] mt-3">{shareMessage}</p>}
        </div>

        <div className="bg-white rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Transaction Information</h2>

          <div className="space-y-3">
            <div className="flex items-start justify-between py-3 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <FileText size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 mb-0.5">Transaction ID</p>
                  <p className="font-semibold text-gray-900 break-all">{transaction.transactionReference}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start justify-between py-3 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <CreditCard size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 mb-0.5">Payment Method</p>
                  <p className="font-semibold text-gray-900">{transaction.paymentMethodLabel}</p>
                </div>
              </div>
            </div>

            {transaction.bookingReference && (
              <div className="flex items-start justify-between py-3 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <FileText size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 mb-0.5">Booking Reference</p>
                    <p className="font-semibold text-gray-900">{transaction.bookingReference}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start justify-between py-3 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <FileText size={20} className="text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-0.5">Description</p>
                  <p className="font-semibold text-gray-900">{transaction.description}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start justify-between py-3">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-0.5">Provider</p>
                  <p className="font-semibold text-gray-900 mb-1">
                    {transaction.providerName ?? "LSevin Wallet"}
                  </p>
                  {transaction.providerAddress && (
                    <p className="text-sm text-gray-600">{transaction.providerAddress}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Payment Breakdown</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">
                {currencySymbol(transaction.currencyCode)}
                {transaction.subtotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Service Fee</span>
              <span className="font-semibold text-gray-900">
                {currencySymbol(transaction.currencyCode)}
                {transaction.fee.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">
                {currencySymbol(transaction.currencyCode)}
                {transaction.total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {(transaction.status === "completed" || transaction.status === "refunded") && (
          <div className="space-y-2">
            <button
              onClick={handleDownload}
              className="w-full h-14 bg-white border-2 border-gray-300 rounded-xl font-semibold text-gray-900 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Download Receipt
            </button>

            {transaction.bookingId && (
              <button
                onClick={() => navigate(`/app/booking-detail/${transaction.bookingId}`)}
                className="w-full h-14 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-all"
              >
                View Booking Details
              </button>
            )}
          </div>
        )}

        {transaction.status === "failed" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <XCircle size={20} className="text-red-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900 mb-1">Payment Failed</h3>
                <p className="text-sm text-red-700 mb-4">
                  This payment could not be processed. Please try again or use a different payment method.
                </p>
                <button
                  onClick={() =>
                    transaction.transactionType === "topup"
                      ? navigate("/app/wallet")
                      : transaction.bookingId
                      ? navigate(`/app/booking-detail/${transaction.bookingId}`)
                      : navigate("/app/support")
                  }
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Retry Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {(transaction.status === "pending" || transaction.status === "processing") && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-orange-900 mb-1">Payment Pending</h3>
                <p className="text-sm text-orange-700">
                  This transaction is still being processed. Refresh the wallet or check back shortly for the final status.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-100 rounded-2xl p-5 text-center">
          <p className="text-sm text-gray-600 mb-3">Need help with this transaction?</p>
          <button
            onClick={() => navigate("/app/support")}
            className="px-6 py-3 bg-white text-[#083f30] font-semibold rounded-xl hover:shadow-md transition-all"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
