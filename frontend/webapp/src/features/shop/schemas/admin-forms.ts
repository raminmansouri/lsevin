import { z } from "zod";

import { shopId } from "./id";

/**
 * Client form schemas for the Shop admin (SHP-ADM-*). Flat fields only — they
 * drive react-hook-form `zodResolver` and produce values the matching server
 * `*Action` re-validates. Same convention as
 * `features/finance/schemas/admin-currency-schemas`.
 */

const kebabRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const num = z.coerce.number();
const str = z.string().trim();

// -- Brand ---------------------------------------------------------------------
export const brandFormSchema = z.object({
  id: shopId.optional(),
  nameEn: str.min(1).max(120),
  nameFa: str.max(120).default(""),
  nameAr: str.max(120).default(""),
  slug: str.min(2).max(180).regex(kebabRe, "kebab-case only"),
  logoUrl: str.default(""),
  websiteUrl: str.default(""),
  isActive: z.coerce.boolean().default(true),
});
export type BrandFormInput = z.infer<typeof brandFormSchema>;

// -- Category ----------------------------------------------------------------
export const categoryFormSchema = z.object({
  id: shopId.optional(),
  nameEn: str.min(1).max(160),
  nameFa: str.max(160).default(""),
  nameAr: str.max(160).default(""),
  descEn: str.default(""),
  descFa: str.default(""),
  descAr: str.default(""),
  slug: str.min(2).max(180).regex(kebabRe, "kebab-case only"),
  parentId: str.default(""),
  icon: str.max(16).default(""),
  gradient: str.max(120).default(""),
  imageUrl: str.default(""),
  bannerUrl: str.default(""),
  displayOrder: num.int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});
export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

// -- Coupon ----------------------------------------------------------------------
export const couponFormSchema = z.object({
  id: shopId.optional(),
  code: str.min(2).max(50),
  couponType: z.enum(["fixed", "percentage", "free_shipping"]),
  value: num.min(0).default(0),
  currency: str.max(15).default(""),
  scope: z.enum(["cart", "shipping", "product", "category", "brand"]),
  minSubtotal: num.min(0).default(0),
  maxDiscountAmount: str.default(""),
  usageLimit: str.default(""),
  usagePerCustomer: str.default(""),
  startsAt: str.default(""),
  expiresAt: str.default(""),
  stackable: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
  titleEn: str.default(""),
  titleFa: str.default(""),
  titleAr: str.default(""),
});
export type CouponFormInput = z.infer<typeof couponFormSchema>;

// -- Attribute --------------------------------------------------------------
export const attributeFormSchema = z.object({
  id: shopId.optional(),
  nameEn: str.min(1).max(120),
  nameFa: str.max(120).default(""),
  nameAr: str.max(120).default(""),
  slug: str.min(2).max(60).regex(kebabRe, "kebab-case only"),
  displayType: z.enum(["select", "swatch", "text", "boolean"]),
  isVariantDefining: z.coerce.boolean().default(false),
});
export type AttributeFormInput = z.infer<typeof attributeFormSchema>;

export const attributeValueFormSchema = z.object({
  attributeId: shopId,
  value: str.min(1).max(80),
  labelEn: str.default(""),
  labelFa: str.default(""),
  colorHex: str.default(""),
});
export type AttributeValueFormInput = z.infer<typeof attributeValueFormSchema>;

// -- Delivery method -------------------------------------------------------
export const deliveryMethodFormSchema = z.object({
  id: shopId,
  baseFee: num.min(0).default(0),
  estimatedDaysMin: str.default(""),
  estimatedDaysMax: str.default(""),
  isActive: z.coerce.boolean().default(true),
  rules: str.default("{}").refine((s) => {
    try {
      const v = JSON.parse(s || "{}");
      return v && typeof v === "object" && !Array.isArray(v);
    } catch {
      return false;
    }
  }, "must be a JSON object"),
});
export type DeliveryMethodFormInput = z.infer<typeof deliveryMethodFormSchema>;

// -- Warehouse allocation (SHP-V03-001) -----------------------------------
export const warehouseFormSchema = z.object({
  id: shopId,
  priority: num.int().min(0).max(100000).default(100),
  isActive: z.coerce.boolean().default(true),
  isDefault: z.coerce.boolean().default(false),
});
export type WarehouseFormInput = z.infer<typeof warehouseFormSchema>;

// -- Home section --------------------------------------------------------------
export const homeSectionFormSchema = z.object({
  id: shopId.optional(),
  key: str.min(1).max(60),
  sectionType: z.enum(["shortcut_rail", "promo_cards", "product_rail", "category_rail", "service_related_rail"]),
  querySource: z.enum(["manual", "featured", "best_seller", "new_arrival", "discounted", "category", "service_related"]),
  categorySlug: str.default(""),
  displayOrder: num.int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
  titleEn: str.default(""),
  titleFa: str.default(""),
  titleAr: str.default(""),
});
export type HomeSectionFormInput = z.infer<typeof homeSectionFormSchema>;

// -- Product core ----------------------------------------------------------
export const productCoreFormSchema = z.object({
  productId: shopId,
  nameEn: str.min(1).max(180),
  nameFa: str.max(180).default(""),
  nameAr: str.max(180).default(""),
  descEn: str.default(""),
  descFa: str.default(""),
  descAr: str.default(""),
  slug: str.min(2).max(180).regex(kebabRe, "kebab-case only"),
  status: z.enum(["draft", "active", "archived"]),
  basePrice: num.min(0).default(0),
  baseCurrency: str.min(3).max(15).default("USD"),
  primaryCategoryId: str.default(""),
  categoryIds: z.array(z.string()).default([]),
  isFeatured: z.coerce.boolean().default(false),
  isBestSeller: z.coerce.boolean().default(false),
  isNewArrival: z.coerce.boolean().default(false),
});
export type ProductCoreFormInput = z.infer<typeof productCoreFormSchema>;

export const productCreateFormSchema = z.object({
  nameEn: str.min(1).max(180),
  nameFa: str.max(180).default(""),
  nameAr: str.max(180).default(""),
  descEn: str.default(""),
  descFa: str.default(""),
  descAr: str.default(""),
  slug: str.min(2).max(180).regex(kebabRe, "kebab-case only"),
  productType: z.enum(["simple", "variant", "digital"]),
  basePrice: num.min(0).default(0),
  baseCurrency: str.min(3).max(15).default("USD"),
  primaryCategoryId: str.default(""),
  categoryIds: z.array(z.string()).default([]),
});
export type ProductCreateFormInput = z.infer<typeof productCreateFormSchema>;
