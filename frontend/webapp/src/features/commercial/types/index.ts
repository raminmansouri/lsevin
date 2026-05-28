export type CompensationPolicyScopeType =
  | 'global'
  | 'provider_type'
  | 'provider'
  | 'service_definition'
  | 'provider_service'
  | 'addon';

export type CompensationAppliesTo = 'main_booking' | 'child_booking' | 'addon';
export type CompensationFeeMode = 'percent' | 'fixed' | 'hybrid';
export type GatewayFeeMode = 'platform_pays' | 'provider_pays' | 'split';

export interface CompensationPolicy {
  id: string;
  name: string;
  description: string | null;
  scopeType: CompensationPolicyScopeType;
  scopeId: string | null;
  appliesTo: CompensationAppliesTo;
  feeMode: CompensationFeeMode;
  platformPercent: number;
  platformFixedAmount: number;
  minimumPlatformAmount: number;
  providerPercentOverride: number | null;
  gatewayFeeMode: GatewayFeeMode;
  currencyCode: string | null;
  priority: number;
  isActive: boolean;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  metadata: Record<string, unknown>;
}

export interface ProviderLedgerEntry {
  id: string;
  providerId: string;
  bookingId: string | null;
  bookingChildId: string | null;
  chargeLineId: string | null;
  entryType: 'earning' | 'adjustment' | 'reversal' | 'payout';
  amount: number;
  currencyCode: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  providerName?: string | null;
}

export interface RefundRequestLineInput {
  chargeLineId?: string | null;
  bookingChildId?: string | null;
  bookingAddonId?: string | null;
  lineType: 'main_service' | 'child_booking' | 'addon';
  quantity?: number;
  paymentRefundAmount: number;
}

export interface RefundRequestRecord {
  id: string;
  booking_id: string;
  payment_id: string | null;
  requested_by_user_id: string | null;
  refund_scope: 'full' | 'partial';
  reason: string;
  customer_note: string | null;
  admin_note: string | null;
  status: 'requested' | 'approved' | 'rejected' | 'processing' | 'refunded' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
  payment_amount?: number | null;
  payment_currency?: string | null;
  payment_status?: string | null;
  booking_status?: string | null;
}


export type BookingCollectionMode = 'free_booking' | 'deposit_percent' | 'deposit_fixed' | 'full_prepay';
export type BookingPaymentPolicyScopeType = 'global' | 'provider_type' | 'provider' | 'service_definition' | 'provider_service';

export interface BookingPaymentPolicyRecord {
  id: string;
  name: string;
  description: string | null;
  scopeType: BookingPaymentPolicyScopeType;
  scopeId: string | null;
  collectionMode: BookingCollectionMode;
  depositType: 'none' | 'percent' | 'fixed';
  depositValue: number;
  minimumDueNowAmount: number;
  capDueNowAmount: number | null;
  dueNowRoundingMode: 'none' | 'up_100' | 'up_1000' | 'up_10000';
  balanceDueTrigger: 'manual' | 'before_service' | 'on_arrival' | 'after_confirmation';
  allowWalletForDueNow: boolean;
  allowGatewayForDueNow: boolean;
  depositRefundableMode: 'always_refundable' | 'never_refundable' | 'policy_based';
  priority: number;
  isActive: boolean;
  metadata: Record<string, unknown>;
}

export interface BookingPaymentTermsRecord {
  id: string;
  draftId?: string | null;
  bookingId?: string | null;
  policyId?: string | null;
  collectionMode: BookingCollectionMode;
  paymentCurrencyCode: string;
  totalAmount: number;
  dueNowAmount: number;
  dueLaterAmount: number;
  depositPercent?: number | null;
  depositFixedAmount?: number | null;
  balanceDueTrigger: 'manual' | 'before_service' | 'on_arrival' | 'after_confirmation';
  depositRefundableMode: 'always_refundable' | 'never_refundable' | 'policy_based';
  termsSnapshot: Record<string, unknown>;
  schedule?: Array<{
    id?: string;
    line_no: number;
    line_type: 'reservation_due' | 'remaining_balance';
    label: string;
    amount: number;
    currency_code: string;
    status: string;
    metadata: Record<string, unknown>;
  }>;
}
