import type {
  WalletPaymentMethod,
  WalletTransactionDetailData,
  WalletTransactionRow,
  WalletTransactionStatus,
} from "./types";

export function currencySymbol(currency: string) {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "AED":
      return "AED ";
    default:
      return `${currency} `;
  }
}

export function formatAmount(amount: number) {
  return Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatTransactionDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const candidate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (candidate.getTime() === today.getTime()) {
    return `Today, ${date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  if (candidate.getTime() === yesterday.getTime()) {
    return `Yesterday, ${date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatLongDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusPresentation(status: WalletTransactionStatus) {
  switch (status) {
    case "completed":
      return { label: "Completed", tone: "success" as const };
    case "refunded":
      return { label: "Refunded", tone: "success" as const };
    case "pending":
      return { label: "Pending", tone: "warning" as const };
    case "processing":
      return { label: "Processing", tone: "warning" as const };
    case "cancelled":
      return { label: "Cancelled", tone: "danger" as const };
    case "failed":
    default:
      return { label: "Failed", tone: "danger" as const };
  }
}

export function getPaymentMethodLabel(method: WalletPaymentMethod | null) {
  switch (method) {
    case "card":
      return "Card";
    case "bank":
      return "Bank Transfer";
    case "apple":
      return "Apple Pay";
    case "wallet":
      return "LSevin Wallet";
    default:
      return "Unknown";
  }
}

export function matchesHistoryStatus(
  status: WalletTransactionStatus,
  selectedStatus: string
) {
  if (selectedStatus === "all") return true;
  if (selectedStatus === "completed") return status === "completed" || status === "refunded";
  if (selectedStatus === "pending") return status === "pending" || status === "processing";
  if (selectedStatus === "failed") return status === "failed" || status === "cancelled";
  return status === selectedStatus;
}

export function matchesHistoryPeriod(dateString: string, selectedPeriod: string) {
  if (selectedPeriod === "all") return true;

  const now = new Date();
  const candidate = new Date(dateString);
  const candidateDay = new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (selectedPeriod === "today") {
    return candidateDay.getTime() === today.getTime();
  }

  const diffMs = now.getTime() - candidate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (selectedPeriod === "week") return diffMs <= 7 * dayMs;
  if (selectedPeriod === "month") return diffMs <= 30 * dayMs;
  if (selectedPeriod === "3months") return diffMs <= 90 * dayMs;

  return true;
}

export function buildReceiptTitle(transaction: WalletTransactionDetailData) {
  return `${transaction.title} Receipt`;
}

export function shareTransactionText(transaction: WalletTransactionDetailData) {
  return [
    buildReceiptTitle(transaction),
    `Reference: ${transaction.transactionReference}`,
    `Amount: ${currencySymbol(transaction.currencyCode)}${formatAmount(transaction.total)}`,
    `Status: ${getStatusPresentation(transaction.status).label}`,
    `Date: ${formatLongDate(transaction.occurredAt)}`,
  ].join("\n");
}

export function transactionNetAmount(rows: WalletTransactionRow[], currencyCode: string) {
  return rows
    .filter((row) => row.currencyCode === currencyCode)
    .reduce((sum, row) => sum + row.amount, 0);
}
