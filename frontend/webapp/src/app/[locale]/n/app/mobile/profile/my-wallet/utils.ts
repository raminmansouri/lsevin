import type {
  WalletPaymentMethod,
  WalletTransactionDetailData,
  WalletTransactionRow,
  WalletTransactionStatus,
} from "./types";

type Translate = (key: string, values?: Record<string, unknown>) => string;

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

export function formatTransactionDate(dateString: string, t: Translate) {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const candidate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (candidate.getTime() === today.getTime()) {
    return t("todayAt", {
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    });
  }

  if (candidate.getTime() === yesterday.getTime()) {
    return t("yesterdayAt", {
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    });
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

export function getStatusPresentation(status: WalletTransactionStatus, t: Translate) {
  switch (status) {
    case "completed":
      return { label: t("statuses.completed"), tone: "success" as const };
    case "refunded":
      return { label: t("statuses.refunded"), tone: "success" as const };
    case "pending":
      return { label: t("statuses.pending"), tone: "warning" as const };
    case "processing":
      return { label: t("statuses.processing"), tone: "warning" as const };
    case "cancelled":
      return { label: t("statuses.cancelled"), tone: "danger" as const };
    case "failed":
    default:
      return { label: t("statuses.failed"), tone: "danger" as const };
  }
}

export function getPaymentMethodLabel(method: WalletPaymentMethod | null, t: Translate) {
  switch (method) {
    case "card":
      return t("paymentMethods.card");
    case "bank":
      return t("paymentMethods.bankTransfer");
    case "crypto":
      return t("paymentMethods.crypto");
    case "apple":
      return t("paymentMethods.applePay");
    case "wallet":
      return t("lsevinWallet");
    default:
      return t("paymentMethods.unknown");
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

export function buildReceiptTitle(transaction: WalletTransactionDetailData, t: Translate) {
  return t("share.receiptTitle", { title: transaction.title });
}

export function shareTransactionText(transaction: WalletTransactionDetailData, t: Translate) {
  return [
    buildReceiptTitle(transaction, t),
    t("share.reference", { reference: transaction.transactionReference }),
    t("share.amount", { amount: `${currencySymbol(transaction.currencyCode)}${formatAmount(transaction.total)}` }),
    t("share.status", { status: getStatusPresentation(transaction.status, t).label }),
    t("share.date", { date: formatLongDate(transaction.occurredAt) }),
  ].join("\n");
}

export function transactionNetAmount(rows: WalletTransactionRow[], currencyCode: string) {
  return rows
    .filter((row) => row.currencyCode === currencyCode)
    .reduce((sum, row) => sum + row.amount, 0);
}
