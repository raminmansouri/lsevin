import * as z from "zod/v4";

const BankAccountSchema = z.object({
  id: z.string().trim().min(1),
  bankName: z.string().trim().max(100).optional().default(""),
  accountHolder: z.string().trim().max(100).optional().default(""),
  accountNumber: z.string().trim().max(60).optional().default(""),
  iban: z.string().trim().max(60).optional().default(""),
  cardNumber: z.string().trim().max(60).optional().default(""),
  note: z.string().trim().max(300).optional().default(""),
});

export const SavePaymentMethodSchema = z.object({
  code: z.enum(["pay_on_delivery", "bank_receipt"]),
  displayName: z.string().trim().min(1, "Display name is required.").max(100),
  description: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(100),
  bankAccounts: z.array(BankAccountSchema).max(20).default([]),
});
