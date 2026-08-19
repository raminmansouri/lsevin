import type { DateRangeInput } from "./types";

export const ECONOMICS_QUEUE_LIMIT = 8;
export const ECONOMICS_REFUND_DRAG_PERCENT = 10;
export const ECONOMICS_CONCENTRATION_PERCENT = 40;

export type ProviderEconomicsSignal = "refund_drag" | "revenue_concentration" | "settlement_in_progress";

export type ProviderServiceEconomicsRow = {
  providerServiceId: string;
  nameTranslations: Record<string, string>;
  completedBookings: number;
  settlementGrossAmount: string;
  platformFeeAmount: string;
  providerPayableAmount: string;
  appliedReversalAmount: string;
  pendingReversalAmount: string;
  retainedProviderPayableAmount: string;
  pendingLedgerAmount: string;
  approvedLedgerAmount: string;
  paidLedgerAmount: string;
  providerSharePercent: number;
  refundDragPercent: number;
  retainedRevenueSharePercent: number;
  signals: ProviderEconomicsSignal[];
};

export type ProviderEconomicsPulse = {
  range: Required<Pick<DateRangeInput, "from" | "to" | "currencyCode">>;
  completedBookings: number;
  settlementGrossAmount: string;
  platformFeeAmount: string;
  providerPayableAmount: string;
  appliedReversalAmount: string;
  pendingReversalAmount: string;
  retainedProviderPayableAmount: string;
  pendingLedgerAmount: string;
  approvedLedgerAmount: string;
  paidLedgerAmount: string;
  topServiceRevenueSharePercent: number;
  servicesWithRefundDrag: number;
  servicesWithSettlementInProgress: number;
  rows: ProviderServiceEconomicsRow[];
  attentionQueue: ProviderServiceEconomicsRow[];
};
