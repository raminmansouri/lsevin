import { shopId } from "./id";
import { z } from "zod";

export const addressInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phoneNumberCountryCode: z.string().trim().max(4).optional().nullable(),
  phoneNumber: z.string().trim().max(24).optional().nullable(),
  country: z.string().trim().min(2).max(15),
  city: z.string().trim().min(1).max(15),
  stateRegion: z.string().trim().max(100).optional().nullable(),
  addressLine1: z.string().trim().min(3).max(250),
  addressLine2: z.string().trim().max(250).optional().nullable(),
  postalCode: z.string().trim().max(50).optional().nullable(),
  company: z.string().trim().max(120).optional().nullable(),
});
export type AddressInput = z.infer<typeof addressInputSchema>;

export const saveAddressSchema = addressInputSchema.extend({
  id: shopId.optional(),
  isDefault: z.boolean().optional().default(false),
});

export const checkoutQuoteSchema = z.object({
  cartId: shopId,
  deliveryMethodId: shopId.optional().nullable(),
  paymentCurrency: z.string().trim().max(15).optional().nullable(),
  // Shipping destination, so delivery options can be filtered/priced by
  // geography before an address row is saved (SHP-V03-012).
  destinationCountry: z.string().trim().max(15).optional().nullable(),
  destinationRegion: z.string().trim().max(120).optional().nullable(),
});

export const placeOrderSchema = z.object({
  cartId: shopId,
  idempotencyKey: z.string().trim().min(8).max(80),
  // Optional at the edge — a signed-in checkout falls back to the account email
  // server-side (SHP-CHK). Guests still get an "email required" error from
  // placeOrder when neither is available.
  email: z.string().email().optional().or(z.literal("")).transform((v) => v || undefined),
  shippingAddress: addressInputSchema,
  billingAddress: addressInputSchema.optional(),
  sameBilling: z.boolean().optional().default(true),
  deliveryMethodId: shopId,
  paymentMethodId: shopId.optional().nullable(),
  paymentMethodCode: z.string().trim().max(40).optional().nullable(),
  paymentCurrency: z.string().trim().max(15).optional().nullable(),
  note: z.string().trim().max(1000).optional().nullable(),
  sourceSurface: z.string().trim().max(40).optional().nullable(),
});
export type PlaceOrderFormInput = z.infer<typeof placeOrderSchema>;

export const startPaymentSchema = z.object({
  orderId: shopId,
  methodCode: z.string().trim().max(40).optional().nullable(),
});

export const couponCodeSchema = z.object({ cartId: shopId, code: z.string().trim().min(2).max(50) });
export const cartLineQuantitySchema = z.object({ cartItemId: shopId, quantity: z.coerce.number().int().min(1).max(999) });
export const currencySelectSchema = z.object({ currency: z.string().trim().min(3).max(10) });
