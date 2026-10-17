import { NextRequest, NextResponse } from "next/server";

import { csvResponse, toCsv, type CsvColumn } from "@/accounting/lib/csv";
import { assertAccounting } from "@/accounting/server/access";
import {
  getTrialBalanceForScope,
  listAuditLog,
  listJournalEntries,
  listPendingDeposits,
  listPendingWithdrawals,
} from "@/accounting/server/admin-queries";
import { listBookingPaymentsForReview, listPartlyPaidBookings } from "@/accounting/server/booking-payments.queries";
import { listProviderPayoutsDue } from "@/accounting/server/provider-payouts.queries";

/**
 * CSV export for the accounting reports.
 *
 * A route handler rather than a server action because a download needs a real HTTP
 * response with Content-Disposition. `/api/**` gets no middleware, so the capability
 * check here is the only thing between this and the open internet — these files contain
 * customer names, emails, IBANs and every amount the platform holds. It authorises
 * against the financial panel session, so an admin cookie does not open it.
 */

function pickName(name: Record<string, string> | null, locale: string): string {
  if (!name) return "";
  return name[locale.startsWith("fa") ? "fa-IR" : "en-US"] ?? Object.values(name)[0] ?? "";
}

export async function GET(request: NextRequest) {
  try {
    await assertAccounting("read");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const report = request.nextUrl.searchParams.get("report") ?? "";
  const locale = request.nextUrl.searchParams.get("locale") ?? "fa";
  const stamp = new Date().toISOString().slice(0, 10);

  switch (report) {
    case "trial-balance": {
      // The same scope the screen was showing, so the file and the page agree.
      const scope = request.nextUrl.searchParams.get("scope");
      const rows = await getTrialBalanceForScope(
        scope === "in_workflow" || scope === "all" ? scope : "in_books"
      );
      const columns: CsvColumn<(typeof rows)[number]>[] = [
        { header: "code", value: (r) => r.accountCode },
        { header: "account", value: (r) => pickName(r.accountName, locale) },
        { header: "type", value: (r) => r.accountType },
        { header: "currency", value: (r) => r.currencyCode },
        { header: "debit", value: (r) => r.totalDebit },
        { header: "credit", value: (r) => r.totalCredit },
        { header: "balance", value: (r) => r.balance },
      ];
      return csvResponse(`trial-balance-${stamp}.csv`, toCsv(rows, columns));
    }

    case "journal": {
      const rows = await listJournalEntries(5000);
      const columns: CsvColumn<(typeof rows)[number]>[] = [
        { header: "entry_number", value: (r) => r.entryNumber },
        { header: "date", value: (r) => r.entryDate },
        { header: "description", value: (r) => r.description },
        { header: "source", value: (r) => r.sourceType },
        { header: "status", value: (r) => r.status },
        { header: "lines", value: (r) => r.lineCount },
        { header: "total_debit", value: (r) => r.totalDebit },
        { header: "currency", value: (r) => r.baseCurrencyCode },
      ];
      return csvResponse(`journal-${stamp}.csv`, toCsv(rows, columns));
    }

    case "deposits": {
      // Same three lists as the page: reservation payments to review, partly paid
      // reservations, and wallet top-ups, one row each with a `queue` column.
      const [review, partlyPaid, wallet] = await Promise.all([
        listBookingPaymentsForReview(5000),
        listPartlyPaidBookings(5000),
        listPendingDeposits(5000),
      ]);
      type DepositCsvRow = {
        queue: string;
        createdAt: string | null;
        customerName: string | null;
        customerEmail: string | null;
        booking: string | null;
        method: string | null;
        status: string;
        currencyCode: string;
        amount: string | null;
        totalAmount: string | null;
        paidAmount: string | null;
        remainingAmount: string | null;
        reference: string | null;
      };
      const rows: DepositCsvRow[] = [
        ...review.map((r) => ({
          queue: "booking_review",
          createdAt: r.createdAt,
          customerName: r.customerName,
          customerEmail: r.customerEmail,
          booking: r.confirmationCode ?? r.bookingId,
          method: r.method,
          status: "pending_review",
          currencyCode: r.paymentCurrencyCode,
          amount: r.amount,
          totalAmount: r.totalAmount,
          paidAmount: r.paidAmount,
          remainingAmount: r.remainingAmount,
          reference: null,
        })),
        ...partlyPaid.map((r) => ({
          queue: "booking_partly_paid",
          createdAt: r.lastPaymentAt,
          customerName: r.customerName,
          customerEmail: r.customerEmail,
          booking: r.confirmationCode ?? r.bookingId,
          method: null,
          status: r.kind,
          currencyCode: r.currencyCode,
          amount: null,
          totalAmount: r.totalAmount,
          paidAmount: r.paidAmount,
          remainingAmount: r.remainingAmount,
          reference: null,
        })),
        ...wallet.map((r) => ({
          queue: "wallet_topup",
          createdAt: r.createdAt,
          customerName: r.customerName,
          customerEmail: r.customerEmail,
          booking: null,
          method: r.method,
          status: r.status,
          currencyCode: r.currencyCode,
          amount: r.amount,
          totalAmount: null,
          paidAmount: null,
          remainingAmount: null,
          reference: r.externalReference,
        })),
      ];
      const columns: CsvColumn<DepositCsvRow>[] = [
        { header: "queue", value: (r) => r.queue },
        { header: "created_at", value: (r) => r.createdAt },
        { header: "customer", value: (r) => r.customerName },
        { header: "email", value: (r) => r.customerEmail },
        { header: "booking", value: (r) => r.booking },
        { header: "method", value: (r) => r.method },
        { header: "status", value: (r) => r.status },
        { header: "currency", value: (r) => r.currencyCode },
        { header: "amount", value: (r) => r.amount },
        { header: "total", value: (r) => r.totalAmount },
        { header: "paid", value: (r) => r.paidAmount },
        { header: "remaining", value: (r) => r.remainingAmount },
        { header: "reference", value: (r) => r.reference },
      ];
      return csvResponse(`deposits-${stamp}.csv`, toCsv(rows, columns));
    }

    case "withdrawals": {
      // Provider payouts first (what doctors, hotels and others are owed), one row per
      // ledger entry, then customer wallet withdrawals, with a `queue` column.
      const [providers, wallet] = await Promise.all([listProviderPayoutsDue(), listPendingWithdrawals(5000)]);
      type WithdrawalCsvRow = {
        queue: string;
        createdAt: string;
        customerName: string | null;
        customerEmail: string | null;
        provider: string | null;
        booking: string | null;
        entryType: string | null;
        status: string;
        currencyCode: string;
        amount: string;
        feeAmount: string | null;
        netAmount: string | null;
        destinationType: string | null;
        destinationIban: string | null;
        destinationHolderName: string | null;
        destinationAddress: string | null;
        destinationNetwork: string | null;
      };
      const rows: WithdrawalCsvRow[] = [
        ...providers.flatMap((g) =>
          g.entries.map((e) => ({
            queue: "provider_payout",
            createdAt: e.createdAt,
            customerName: e.customerName,
            customerEmail: null,
            provider: g.providerName,
            booking: e.confirmationCode ?? e.bookingId,
            entryType: e.entryType,
            status: e.status,
            currencyCode: e.currencyCode,
            amount: e.amount,
            feeAmount: null,
            netAmount: e.amount,
            destinationType: g.payoutAccount ? "bank_iban" : null,
            destinationIban: g.payoutAccount?.iban ?? null,
            destinationHolderName: g.payoutAccount?.holderName ?? null,
            destinationAddress: null,
            destinationNetwork: null,
          }))
        ),
        ...wallet.map((r) => ({
          queue: "wallet_withdrawal",
          createdAt: r.createdAt,
          customerName: r.customerName,
          customerEmail: r.customerEmail,
          provider: null,
          booking: null,
          entryType: null,
          status: r.status,
          currencyCode: r.currencyCode,
          amount: r.amount,
          feeAmount: r.feeAmount,
          netAmount: r.netAmount,
          destinationType: r.destinationType,
          destinationIban: r.destinationIban,
          destinationHolderName: r.destinationHolderName,
          destinationAddress: r.destinationAddress,
          destinationNetwork: r.destinationNetwork,
        })),
      ];
      const columns: CsvColumn<WithdrawalCsvRow>[] = [
        { header: "queue", value: (r) => r.queue },
        { header: "provider", value: (r) => r.provider },
        { header: "booking", value: (r) => r.booking },
        { header: "entry_type", value: (r) => r.entryType },
        { header: "created_at", value: (r) => r.createdAt },
        { header: "customer", value: (r) => r.customerName },
        { header: "email", value: (r) => r.customerEmail },
        { header: "status", value: (r) => r.status },
        { header: "currency", value: (r) => r.currencyCode },
        { header: "gross", value: (r) => r.amount },
        { header: "fee", value: (r) => r.feeAmount },
        { header: "net", value: (r) => r.netAmount },
        { header: "destination_type", value: (r) => r.destinationType },
        { header: "iban", value: (r) => r.destinationIban },
        { header: "holder", value: (r) => r.destinationHolderName },
        { header: "crypto_address", value: (r) => r.destinationAddress },
        { header: "network", value: (r) => r.destinationNetwork },
      ];
      return csvResponse(`withdrawals-${stamp}.csv`, toCsv(rows, columns));
    }

    case "audit": {
      const rows = await listAuditLog(10000);
      const columns: CsvColumn<(typeof rows)[number]>[] = [
        { header: "occurred_at", value: (r) => r.occurredAt },
        { header: "actor", value: (r) => r.actorName ?? r.actorUserId },
        { header: "action", value: (r) => r.action },
        { header: "entity_type", value: (r) => r.entityType },
        { header: "entity_id", value: (r) => r.entityId },
      ];
      return csvResponse(`audit-log-${stamp}.csv`, toCsv(rows, columns));
    }

    default:
      return NextResponse.json(
        { error: "Unknown report. Use trial-balance, journal, deposits, withdrawals or audit." },
        { status: 400 }
      );
  }
}
