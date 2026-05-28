import { z } from "zod";
export const addressInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phoneNumberCountryCode: z.string().trim().max(3).optional(),
  phoneNumber: z.string().trim().max(20).optional(),
  country: z.string().trim().min(2).max(15),
  city: z.string().trim().min(2).max(15),
  stateRegion: z.string().trim().max(100).optional(),
  addressLine1: z.string().trim().min(4).max(250),
  addressLine2: z.string().trim().max(250).optional(),
  postalCode: z.string().trim().max(50).optional(),
  company: z.string().trim().max(120).optional(),
});
export const checkoutSubmitSchema = z.object({
  cartId: z.string().uuid(),
  email: z.string().email(),
  shippingAddress: addressInputSchema,
  billingAddress: addressInputSchema,
  deliveryMethodId: z.string().uuid(),
  deliverySlotId: z.string().uuid().optional().nullable(),
  paymentMethodId: z.string().uuid(),
  couponCode: z.string().trim().max(50).optional().nullable(),
  note: z.string().trim().max(1000).optional().nullable(),
});
export const couponCodeSchema = z.object({ cartId: z.string().uuid(), code: z.string().trim().min(2).max(50) });
export const cartLineQuantitySchema = z.object({ cartItemId: z.string().uuid(), quantity: z.coerce.number().int().min(1).max(999) });
