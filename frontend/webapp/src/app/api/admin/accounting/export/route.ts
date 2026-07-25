import { NextRequest, NextResponse } from "next/server";

import { csvResponse, toCsv, type CsvColumn } from "@/accounting/lib/csv";
import { assertAccounting } from "@/accounting/server/access";
import {
  getTrialBalance,
  listAuditLog,
  listJournalEntries,
  listPendingDeposits,
  listPendingWithdrawals,
} from "@/accounting/server/admin-queries";

/**
 * CSV export for the accounting reports.
 *
 * A route handler rather than a server action because a download needs a real HTTP
 * response with Content-Disposition. `/api/**` gets no middleware, so the capability
 * check here is the only thing between this and the open internet — these files contain
 * customer names, emails, IBANs and every amount the platform holds.
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
      const rows = await getTrialBalance();
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
      const rows = await listPendingDeposits(5000);
      const columns: CsvColumn<(typeof rows)[number]>[] = [
        { header: "created_at", value: (r) => r.createdAt },
        { header: "customer", value: (r) => r.customerName },
        { header: "email", value: (r) => r.customerEmail },
        { header: "method", value: (r) => r.method },
        { header: "status", value: (r) => r.status },
        { header: "currency", value: (r) => r.currencyCode },
        { header: "amount", value: (r) => r.amount },
        { header: "reference", value: (r) => r.externalReference },
      ];
      return csvResponse(`deposits-${stamp}.csv`, toCsv(rows, columns));
    }

    case "withdrawals": {
      const rows = await listPendingWithdrawals(5000);
      const columns: CsvColumn<(typeof rows)[number]>[] = [
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
