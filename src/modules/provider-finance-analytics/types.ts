export type CurrencyCode = string;

export type DateRangeInput = {
  from?: string;
  to?: string;
  currencyCode?: CurrencyCode;
  timeZone?: string;
};

export type FinanceOverview = {
  providerId: string;
  currencyCode: CurrencyCode;
  grossRevenue: string;
  netRevenue: string;
  platformFeeAmount: string;
  providerPayableAmount: string;
  refundedAmount: string;
  walletAvailableAmount: string;
  walletPendingAmount: string;
  pendingLedgerAmount: string;
  approvedLedgerAmount: string;
  paidLedgerAmount: string;
  withdrawalPendingAmount: string;
  bookingsCount: number;
  paidBookingsCount: number;
  averageOrderValue: string;
};

export type ProviderWalletAccount = {
  id: string;
  providerId: string;
  currencyCode: CurrencyCode;
  availableAmount: string;
  pendingAmount: string;
  lockedAmount: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ProviderWalletTransaction = {
  id: string;
  providerId: string;
  walletAccountId: string;
  direction: "credit" | "debit";
  transactionType: string;
  status: string;
  amount: string;
  currencyCode: CurrencyCode;
  counterpartyType: string | null;
  counterpartyUserId: string | null;
  customerId: string | null;
  bookingId: string | null;
  settlementBatchId: string | null;
  withdrawalRequestId: string | null;
  referenceType: string | null;
  referenceId: string | null;
  externalReference: string | null;
  notes: string | null;
  createdAt: string;
};

export type PayoutAccount = {
  id: string;
  providerId: string;
  accountHolderName: string;
  bankName: string | null;
  iban: string | null;
  swiftCode: string | null;
  accountNumberLast4: string | null;
  country: string | null;
  currencyCode: CurrencyCode;
  isDefault: boolean;
};

export type WithdrawalRequest = {
  id: string;
  providerId: string;
  walletAccountId: string;
  payoutAccountId: string | null;
  amount: string;
  currencyCode: CurrencyCode;
  status: string;
  requestedByUserId: string | null;
  reviewedByUserId: string | null;
  reviewNote: string | null;
  gatewayReference: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  paidAt: string | null;
};

export type SettlementBatch = {
  id: string;
  providerId: string;
  settlementNumber: string;
  periodStart: string;
  periodEnd: string;
  currencyCode: CurrencyCode;
  grossAmount: string;
  platformFeeAmount: string;
  providerPayableAmount: string;
  adjustmentAmount: string;
  payoutAmount: string;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  paidAt: string | null;
};

export type SettlementItem = {
  id: string;
  settlementBatchId: string;
  bookingId: string | null;
  chargeLineId: string | null;
  ledgerId: string | null;
  itemType: string;
  description: string;
  grossAmount: string;
  platformFeeAmount: string;
  providerPayableAmount: string;
  currencyCode: CurrencyCode;
  createdAt: string;
};

export type CompensationPolicy = {
  id: string;
  name: string;
  description: string | null;
  scopeType: string;
  scopeId: string | null;
  appliesTo: string;
  feeMode: string;
  platformPercent: string;
  platformFixedAmount: string;
  minimumPlatformAmount: string;
  providerPercentOverride: string | null;
  gatewayFeeMode: string;
  currencyCode: CurrencyCode | null;
  priority: number;
  isActive: boolean;
  effectiveFrom: string | null;
  effectiveTo: string | null;
};

export type MoneyTransfer = {
  id: string;
  providerId: string | null;
  bookingId: string | null;
  sourcePartyType: string;
  sourceUserId: string | null;
  targetPartyType: string;
  targetUserId: string | null;
  amount: string;
  currencyCode: CurrencyCode;
  transferType: string;
  status: string;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type FinanceAdminOverview = {
  currencyCode: CurrencyCode;
  totalGrossRevenue: string;
  totalPlatformFees: string;
  totalProviderPayable: string;
  totalRefunds: string;
  totalPaidOut: string;
  pendingWithdrawals: string;
  providersWithBalance: number;
  bookingsCount: number;
};

export type ReportKpis = {
  providerId?: string;
  currencyCode: CurrencyCode;
  bookingsCount: number;
  paidBookingsCount: number;
  cancelledBookingsCount: number;
  grossRevenue: string;
  netRevenue: string;
  platformFeeAmount: string;
  providerPayableAmount: string;
  refundedAmount: string;
  averageOrderValue: string;
  averageRating: string;
  reviewsCount: number;
  servicesCount: number;
  activeServicesCount: number;
  staffCount: number;
};

export type TimeSeriesPoint = {
  bucket: string;
  bookingsCount: number;
  grossRevenue: string;
  netRevenue: string;
  providerPayableAmount: string;
  refundedAmount: string;
};

export type ServicePerformanceRow = {
  serviceId: string;
  serviceName: string;
  bookingsCount: number;
  grossRevenue: string;
  providerPayableAmount: string;
  rating: string | null;
  reviewCount: number;
};

export type StaffPerformanceRow = {
  staffId: string;
  staffName: string;
  bookingsCount: number;
  grossRevenue: string;
  rating: string | null;
  reviewCount: number;
};

export type ReportSnapshot = {
  id: string;
  providerId: string | null;
  reportKey: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  currencyCode: CurrencyCode;
  payload: Record<string, unknown>;
  createdByUserId: string | null;
  createdAt: string;
};

export type ProviderReportsBundle = {
  kpis: ReportKpis;
  timeSeries: TimeSeriesPoint[];
  servicePerformance: ServicePerformanceRow[];
  staffPerformance: StaffPerformanceRow[];
};


export type BookingEarningRow = {
  bookingId:string; bookingDate:string|null; bookingStatus:string; paymentStatus:string|null; staffId:string|null; staffName:string|null; currencyCode:CurrencyCode;
  grossAmount:string; platformFeeAmount:string; providerPayableAmount:string; refundReversalAmount:string; netProviderPayableAmount:string;
  ledgerPendingAmount:string; ledgerApprovedAmount:string; ledgerPaidAmount:string; settlementNumber:string|null; settlementStatus:string|null;
  compensationRuleId:string|null; compensationMode:string|null; compensationPercent:string; compensationFixedAmount:string;
  estimatedStaffCompensation:string; staffPaymentAmount:string; staffPaymentStatus:string|null; staffPaidAt:string|null;
};
export type BookingEarningsSummary = { bookingsCount:number; grossAmount:string; platformFeeAmount:string; providerPayableAmount:string; refundReversalAmount:string; netProviderPayableAmount:string; staffCompensationEstimated:string; staffCompensationPaid:string; staffCompensationOutstanding:string; };
export type StaffCompensationRule = { id:string; providerId:string; staffId:string; staffName:string; calculationMode:"percent"|"fixed"|"hybrid"; percentValue:string; fixedAmount:string; currencyCode:CurrencyCode; effectiveFrom:string; effectiveTo:string|null; isActive:boolean; notes:string|null; createdAt:string; };
export type StaffFinanceProfile = { staffId:string; providerId:string; staffName:string; providerName:string; };
