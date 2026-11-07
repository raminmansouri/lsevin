import { z } from "zod";

import { galleryUrlsSchema } from "@/features/shop/schemas/gallery";

import { SHOP_API_LOCALES } from "./scopes";

/**
 * Request bodies of the Shop API. Unknown fields are rejected (strict), so a typo such as
 * "prise" fails loudly instead of being ignored.
 */

// GUID shape, not RFC UUID: most catalog ids in production lack RFC version/variant bits.
export const apiId = z.guid();

const localeKey = z.enum(SHOP_API_LOCALES);
const translated = (max: number) =>
  // partialRecord: in zod 4 a record keyed by an enum otherwise requires every locale.
  z
    .partialRecord(localeKey, z.string().trim().max(max))
    .transform(
      (value) =>
        Object.fromEntries(Object.entries(value).filter(([, text]) => typeof text === "string" && text.length > 0)) as Record<string, string>,
    );

const name = translated(200).refine((value) => Object.keys(value).length > 0, {
  message: "Give the name in at least one language, for example {\"fa\": \"...\"}.",
});

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, digits and single hyphens, e.g. \"vitamin-d-1000\".");

const money = z.number().finite().min(0).max(1e15);

export const offerFieldsSchema = z
  .object({
    price: money,
    compareAtPrice: money.nullable().optional(),
    stockQuantity: z.number().int().min(0).max(10_000_000).nullable().optional(),
    sellerSku: z.string().trim().max(100).nullable().optional(),
    handlingDays: z.number().int().min(0).max(365).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((offer) => offer.compareAtPrice == null || offer.compareAtPrice >= offer.price, {
    message: "compareAtPrice must not be lower than price.",
    path: ["compareAtPrice"],
  });

export const productContentSchema = z
  .object({
    name,
    shortDescription: translated(500).optional(),
    description: translated(20_000).optional(),
    slug: slug.optional(),
    primaryCategoryId: apiId.nullable().optional(),
    categoryIds: z.array(apiId).max(20).optional(),
    images: galleryUrlsSchema.optional(),
  })
  .strict();

export const createProductSchema = productContentSchema
  .extend({
    currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).default("IRR"),
    offer: offerFieldsSchema.optional(),
  })
  .strict();

/** Partial content update; at least one field. */
export const updateProductSchema = productContentSchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: "Send at least one field to change." });

export const createOfferSchema = z
  .object({
    productId: apiId,
    variantId: apiId.nullable().optional(),
    price: money,
    compareAtPrice: money.nullable().optional(),
    stockQuantity: z.number().int().min(0).max(10_000_000).nullable().optional(),
    sellerSku: z.string().trim().max(100).nullable().optional(),
    handlingDays: z.number().int().min(0).max(365).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((offer) => offer.compareAtPrice == null || offer.compareAtPrice >= offer.price, {
    message: "compareAtPrice must not be lower than price.",
    path: ["compareAtPrice"],
  });

export const updateOfferSchema = z
  .object({
    price: money.optional(),
    compareAtPrice: money.nullable().optional(),
    stockQuantity: z.number().int().min(0).max(10_000_000).nullable().optional(),
    sellerSku: z.string().trim().max(100).nullable().optional(),
    handlingDays: z.number().int().min(0).max(365).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: "Send at least one field to change." });

export type ProductContentInput = z.infer<typeof productContentSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
