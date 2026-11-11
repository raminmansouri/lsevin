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

// ------------------------------------------------------------------------------------------------
// Provider portal endpoints (/api/shop/v1/portal/...)
// ------------------------------------------------------------------------------------------------

const reason = z.string().trim().min(1, "Write a short reason.").max(1000);
const warranty = z.string().trim().max(300).nullable().optional();

export const portalActivationSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(40).nullable().optional(),
    categoryIds: z.array(apiId).min(1, "Choose at least one category.").max(30),
    licenceUrl: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/, "Use an uploaded file URL.").nullable().optional(),
  })
  .strict();

/** Like createOfferSchema, but stock is required and a warranty text may be sent. */
export const portalCreateOfferSchema = z
  .object({
    productId: apiId,
    variantId: apiId.nullable().optional(),
    price: money,
    compareAtPrice: money.nullable().optional(),
    stockQuantity: z.number({ error: "Stock quantity is required." }).int().min(0).max(10_000_000),
    sellerSku: z.string().trim().max(100).nullable().optional(),
    handlingDays: z.number().int().min(0).max(365).nullable().optional(),
    warranty,
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((offer) => offer.compareAtPrice == null || offer.compareAtPrice >= offer.price, {
    message: "compareAtPrice must not be lower than price.",
    path: ["compareAtPrice"],
  });

export const portalUpdateOfferSchema = z
  .object({
    price: money.optional(),
    compareAtPrice: money.nullable().optional(),
    stockQuantity: z.number().int().min(0).max(10_000_000).nullable().optional(),
    sellerSku: z.string().trim().max(100).nullable().optional(),
    handlingDays: z.number().int().min(0).max(365).nullable().optional(),
    warranty,
    isActive: z.boolean().optional(),
    resubmit: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: "Send at least one field to change." });

export const portalShopDecisionSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("approve"), categoryIds: z.array(apiId).min(1, "Choose at least one allowed category.").max(50) }).strict(),
  z.object({ decision: z.literal("reject"), reason }).strict(),
  z.object({ decision: z.literal("suspend"), reason }).strict(),
  z.object({ decision: z.literal("unsuspend") }).strict(),
]);

export const portalOfferDecisionSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("approve") }).strict(),
  z.object({ decision: z.literal("reject"), reason }).strict(),
  z.object({ decision: z.literal("block"), reason }).strict(),
  z.object({ decision: z.literal("unblock") }).strict(),
]);

export const portalQueueStatusSchema = z.enum(["pending", "approved", "rejected", "blocked"]).catch("pending");

/** A product that is not in the catalog yet: Persian name required, English optional. */
const proposalName = z
  .object({
    fa: z.string().trim().min(2, "Write the product name.").max(200),
    en: z.string().trim().max(200).optional(),
  })
  .strict()
  .transform(({ fa, en }) => (en ? { fa, en } : { fa }));

export const portalCreateProposalSchema = z
  .object({
    name: proposalName,
    description: translated(5_000).optional(),
    categoryId: apiId,
    brand: z.string().trim().max(120).nullable().optional(),
    images: galleryUrlsSchema.optional(),
    price: money,
    stockQuantity: z.number({ error: "Stock quantity is required." }).int().min(1, "Stock must be at least 1.").max(10_000_000),
  })
  .strict();

/** Approve (optionally correcting name, category or price first) or reject with a reason. */
export const portalProposalDecisionSchema = z.discriminatedUnion("decision", [
  z
    .object({
      decision: z.literal("approve"),
      name: proposalName.optional(),
      categoryId: apiId.optional(),
      price: money.optional(),
    })
    .strict(),
  z.object({ decision: z.literal("reject"), reason }).strict(),
]);

export const portalProposalStatusSchema = z.enum(["pending", "approved", "rejected"]).catch("pending");

export type CreateProposalInput = z.infer<typeof portalCreateProposalSchema>;
export type ProposalDecisionInput = z.infer<typeof portalProposalDecisionSchema>;

export type ProductContentInput = z.infer<typeof productContentSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;

/** Clinic orders: the list tab, and the pickup step the clinic moves its part of an order to. */
export const portalOrderListStatusSchema = z.enum(["new", "ready_for_pickup", "picked_up", "cancelled", "all"]).catch("new");
export const portalOrderStatusUpdateSchema = z
  .object({ status: z.enum(["ready_for_pickup", "picked_up"]) })
  .strict();
