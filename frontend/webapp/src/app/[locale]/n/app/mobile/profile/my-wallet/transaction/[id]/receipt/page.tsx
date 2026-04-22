import { notFound } from "next/navigation";

import { getWalletTransactionDetailAction } from "../../../actions";
import { currencySymbol, formatLongDate } from "../../../utils";

interface WalletReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default async function WalletReceiptPage({ params }: WalletReceiptPageProps) {
  const { id } = await params;
  const transaction = await getWalletTransactionDetailAction(id);

  if (!transaction) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-10 gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-gray-500 mb-3">LSevin</p>
            <h1 className="text-3xl font-bold">Transaction Receipt</h1>
            <p className="text-sm text-gray-500 mt-2">{formatLongDate(transaction.occurredAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Reference</p>
            <p className="font-semibold break-all">{transaction.transactionReference}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-gray-200 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Transaction</p>
            <p className="font-semibold text-lg">{transaction.title}</p>
            <p className="text-sm text-gray-600 mt-2">{transaction.description}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Provider</p>
            <p className="font-semibold text-lg">{transaction.providerName ?? "LSevin Wallet"}</p>
            {transaction.providerAddress && (
              <p className="text-sm text-gray-600 mt-2">{transaction.providerAddress}</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 overflow-hidden mb-8">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 font-semibold">
            Payment breakdown
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">
                {currencySymbol(transaction.currencyCode)}
                {transaction.subtotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Service Fee</span>
              <span className="font-semibold">
                {currencySymbol(transaction.currencyCode)}
                {transaction.fee.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span>
                {currencySymbol(transaction.currencyCode)}
                {transaction.total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 p-5 space-y-3 mb-8">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">Status</span>
            <span className="font-semibold">{transaction.status}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">Payment Method</span>
            <span className="font-semibold">{transaction.paymentMethodLabel}</span>
          </div>
          {transaction.bookingReference && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600">Booking Reference</span>
              <span className="font-semibold">{transaction.bookingReference}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500">
          Save this page as PDF from your browser to keep a copy of the receipt.
        </p>
      </div>
    </div>
  );
}
