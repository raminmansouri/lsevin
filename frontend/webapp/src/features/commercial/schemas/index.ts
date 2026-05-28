import { z } from 'zod';

export const CompensationPolicyFormSchema = z.object({
  policyId: z.string().uuid().optional(),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  scopeType: z.enum(['global', 'provider_type', 'provider', 'service_definition', 'provider_service', 'addon']),
  scopeId: z.string().optional().nullable(),
  appliesTo: z.enum(['main_booking', 'child_booking', 'addon']),
  feeMode: z.enum(['percent', 'fixed', 'hybrid']),
  platformPercent: z.coerce.number().min(0),
  platformFixedAmount: z.coerce.number().min(0),
  minimumPlatformAmount: z.coerce.number().min(0),
  providerPercentOverride: z.coerce.number().min(0).max(100).optional().nullable(),
  gatewayFeeMode: z.enum(['platform_pays', 'provider_pays', 'split']),
  currencyCode: z.string().max(10).optional().nullable(),
  priority: z.coerce.number().int().min(0),
  isActive: z.boolean().default(true),
  effectiveFrom: z.string().optional().nullable(),
  effectiveTo: z.string().optional().nullable(),
  metadataText: z.string().default('{}'),
}).transform((value) => ({
  ...value,
  metadata: (() => {
    try {
      return value.metadataText?.trim() ? JSON.parse(value.metadataText) : {};
    } catch {
      return {};
    }
  })(),
}));

export type CompensationPolicyFormInput = z.infer<typeof CompensationPolicyFormSchema>;

export const RefundRequestLineSchema = z.object({
  chargeLineId: z.string().uuid().optional().nullable(),
  bookingChildId: z.string().uuid().optional().nullable(),
  bookingAddonId: z.string().uuid().optional().nullable(),
  lineType: z.enum(['main_service', 'child_booking', 'addon']),
  quantity: z.coerce.number().int().positive().default(1),
  paymentRefundAmount: z.coerce.number().positive(),
});

export const RefundRequestSchema = z.object({
  bookingId: z.string().uuid(),
  paymentId: z.string().uuid().optional().nullable(),
  requestedByUserId: z.string().uuid().optional().nullable(),
  refundScope: z.enum(['full', 'partial']).default('full'),
  reason: z.string().min(3),
  customerNote: z.string().optional().nullable(),
  adminNote: z.string().optional().nullable(),
  refundLines: z.array(RefundRequestLineSchema).default([]),
});

export type RefundRequestInput = z.infer<typeof RefundRequestSchema>;


export const BookingPaymentPolicyFormSchema = z.object({
  policyId: z.string().uuid().optional(),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  scopeType: z.enum(['global', 'provider_type', 'provider', 'service_definition', 'provider_service']),
  scopeId: z.string().optional().nullable(),
  collectionMode: z.enum(['free_booking', 'deposit_percent', 'deposit_fixed', 'full_prepay']),
  depositType: z.enum(['none', 'percent', 'fixed']).default('none'),
  depositValue: z.coerce.number().min(0),
  minimumDueNowAmount: z.coerce.number().min(0),
  capDueNowAmount: z.coerce.number().min(0).optional().nullable(),
  dueNowRoundingMode: z.enum(['none', 'up_100', 'up_1000', 'up_10000']).default('none'),
  balanceDueTrigger: z.enum(['manual', 'before_service', 'on_arrival', 'after_confirmation']).default('manual'),
  allowWalletForDueNow: z.boolean().default(true),
  allowGatewayForDueNow: z.boolean().default(true),
  depositRefundableMode: z.enum(['always_refundable', 'never_refundable', 'policy_based']).default('policy_based'),
  priority: z.coerce.number().int().min(0),
  isActive: z.boolean().default(true),
  metadataText: z.string().default('{}'),
}).transform((value) => ({
  ...value,
  metadata: (() => {
    try {
      return value.metadataText?.trim() ? JSON.parse(value.metadataText) : {};
    } catch {
      return {};
    }
  })(),
}));

export type BookingPaymentPolicyFormInput = z.infer<typeof BookingPaymentPolicyFormSchema>;
