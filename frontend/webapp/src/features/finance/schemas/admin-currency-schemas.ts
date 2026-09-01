import { z } from 'zod';

export const CurrencyFormSchema = z.object({
  code: z.string().trim().min(3).max(10).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  nativeName: z.string().trim().max(120).optional().nullable(),
  symbol: z.string().trim().min(1).max(20),
  decimalDigits: z.coerce.number().int().min(0).max(6),
  isIso: z.coerce.boolean().default(true),
  isActive: z.coerce.boolean().default(true),
  isDisplayEnabled: z.coerce.boolean().default(true),
  isPaymentEnabled: z.coerce.boolean().default(false),
  isSettlementEnabled: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

export const CurrencyDeleteSchema = z.object({
  code: z.string().trim().min(3).max(10).transform((value) => value.toUpperCase()),
});

export const ExchangeRateFormSchema = z.object({
  baseCurrencyCode: z.string().trim().min(3).max(10).transform((value) => value.toUpperCase()),
  quoteCurrencyCode: z.string().trim().min(3).max(10).transform((value) => value.toUpperCase()),
  rate: z.coerce.number().positive(),
  source: z.string().trim().min(2).max(80).default('manual_admin'),
  expiresAt: z.string().optional().nullable(),
});

export type CurrencyFormInput = z.infer<typeof CurrencyFormSchema>;
export type CurrencyDeleteInput = z.infer<typeof CurrencyDeleteSchema>;
export type ExchangeRateFormInput = z.infer<typeof ExchangeRateFormSchema>;
