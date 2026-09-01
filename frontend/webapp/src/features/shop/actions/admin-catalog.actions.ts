"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { shopId } from "../schemas/id";
import {
  addHomeSectionItem,
  createProduct,
  deleteBrand,
  deleteCategory,
  deleteCoupon,
  deleteHomeSection,
  deleteVariant,
  removeCategoryServiceLink,
  removeHomeSectionItem,
  setCategoryServiceLink,
  setProductGallery,
  upsertBrand,
  upsertCategory,
  upsertCoupon,
  upsertHomeSection,
  upsertVariant,
} from "../server/admin-catalog.service";

const RELATION = ["general", "recommended_before", "recommended_after", "compatible", "required", "optional_addon"] as const;
const localized = z.record(z.string(), z.string()).default({});

function fromForm3(formData: FormData, prefix: string) {
  return {
    en: String(formData.get(`${prefix}_en`) || ""),
    fa: String(formData.get(`${prefix}_fa`) || ""),
    ar: String(formData.get(`${prefix}_ar`) || ""),
  };
}

// ======================================================================
// Product create
// ======================================================================
const createProductSchema = z.object({
  slug: z.string().trim().min(2).max(180),
  productType: z.enum(["simple", "variant", "bundle", "digital"]),
  basePrice: z.coerce.number().min(0),
  baseCurrency: z.string().trim().min(3).max(15),
  nameTranslations: localized,
  shortDescriptionTranslations: localized,
  primaryCategoryId: shopId.optional().nullable(),
  categoryIds: z.array(shopId).default([]),
});
export async function createProductAction(input: unknown) {
  const p = createProductSchema.parse(input);
  const id = await createProduct(p);
  revalidatePath("/admin/shop/products");
  return { ok: true as const, id };
}
export async function createProductForm(formData: FormData) {
  const res = await createProductAction({
    slug: formData.get("slug"),
    productType: formData.get("productType"),
    basePrice: formData.get("basePrice"),
    baseCurrency: formData.get("baseCurrency"),
    nameTranslations: fromForm3(formData, "name"),
    shortDescriptionTranslations: fromForm3(formData, "desc"),
    primaryCategoryId: formData.get("primaryCategoryId") || undefined,
    categoryIds: formData.getAll("categoryIds").map(String).filter(Boolean),
  });
  redirect(`/admin/shop/products/${res.id}`);
}

// ======================================================================
// Product variants (SHP-ADM-004)
// ======================================================================
const variantSchema = z.object({
  productId: shopId,
  id: shopId.optional(),
  titleTranslations: localized,
  sku: z.string().trim().min(1).max(80),
  optionKey: z.string().trim().max(120).default(""),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().trim().min(3).max(15),
  isActive: z.coerce.boolean().default(true),
  allowBackorder: z.coerce.boolean().default(false),
  initialStock: z.coerce.number().int().min(0).optional(),
});
export async function upsertVariantAction(input: unknown) {
  const p = variantSchema.parse(input);
  const id = await upsertVariant(p);
  revalidatePath(`/admin/shop/products/${p.productId}`);
  return { ok: true as const, id };
}
export async function upsertVariantForm(formData: FormData) {
  await upsertVariantAction({
    productId: formData.get("productId"),
    id: formData.get("id") || undefined,
    titleTranslations: fromForm3(formData, "vtitle"),
    sku: formData.get("sku"),
    optionKey: formData.get("optionKey") || "",
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    currency: formData.get("currency"),
    isActive: formData.get("isActive") === "on",
    allowBackorder: formData.get("allowBackorder") === "on",
    initialStock: formData.get("initialStock") || undefined,
  });
}
export async function deleteVariantForm(formData: FormData) {
  const id = z.string().parse(formData.get("id"));
  const productId = z.string().parse(formData.get("productId"));
  await deleteVariant({ id });
  revalidatePath(`/admin/shop/products/${productId}`);
}

// ======================================================================
// Coupons (SHP-V02-004)
// ======================================================================
const couponSchema = z.object({
  id: shopId.optional(),
  code: z.string().trim().min(2).max(50),
  couponType: z.enum(["fixed", "percentage", "free_shipping"]),
  value: z.coerce.number().min(0),
  currency: z.string().trim().max(15).optional().nullable(),
  isActive: z.coerce.boolean().default(true),
  startsAt: z.string().trim().optional().nullable(),
  expiresAt: z.string().trim().optional().nullable(),
  minSubtotal: z.coerce.number().min(0).default(0),
  maxDiscountAmount: z.coerce.number().min(0).optional().nullable(),
  usageLimit: z.coerce.number().int().min(1).optional().nullable(),
  usagePerCustomer: z.coerce.number().int().min(1).optional().nullable(),
  stackable: z.coerce.boolean().default(false),
  scope: z.enum(["cart", "product", "category", "brand", "shipping"]),
  titleTranslations: localized,
});
export async function upsertCouponAction(input: unknown) {
  const p = couponSchema.parse(input);
  const id = await upsertCoupon(p);
  revalidatePath("/admin/shop/coupons");
  return { ok: true as const, id };
}
export async function upsertCouponForm(formData: FormData) {
  await upsertCouponAction({
    id: formData.get("id") || undefined,
    code: formData.get("code"),
    couponType: formData.get("couponType"),
    value: formData.get("value"),
    currency: formData.get("currency") || undefined,
    isActive: formData.get("isActive") === "on",
    startsAt: formData.get("startsAt") || undefined,
    expiresAt: formData.get("expiresAt") || undefined,
    minSubtotal: formData.get("minSubtotal") || 0,
    maxDiscountAmount: formData.get("maxDiscountAmount") || undefined,
    usageLimit: formData.get("usageLimit") || undefined,
    usagePerCustomer: formData.get("usagePerCustomer") || undefined,
    stackable: formData.get("stackable") === "on",
    scope: formData.get("scope"),
    titleTranslations: fromForm3(formData, "title"),
  });
}
export async function deleteCouponForm(formData: FormData) {
  const id = z.string().parse(formData.get("id"));
  await deleteCoupon({ id });
  revalidatePath("/admin/shop/coupons");
}

// ======================================================================
// Product gallery
// ======================================================================
const gallerySchema = z.object({ productId: shopId, urls: z.array(z.string().trim().min(1)).default([]) });
export async function setProductGalleryAction(input: unknown) {
  const p = gallerySchema.parse(input);
  await setProductGallery(p);
  revalidatePath(`/admin/shop/products/${p.productId}`);
  return { ok: true as const };
}

// ======================================================================
// Categories
// ======================================================================
const categorySchema = z.object({
  id: shopId.optional(),
  slug: z.string().trim().min(1).max(180),
  nameTranslations: localized,
  descriptionTranslations: localized,
  parentId: shopId.optional().nullable(),
  imageUrl: z.string().trim().optional().nullable(),
  bannerUrl: z.string().trim().optional().nullable(),
  icon: z.string().trim().max(16).optional().nullable(),
  gradient: z.string().trim().max(120).optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});
export async function upsertCategoryAction(input: unknown) {
  const p = categorySchema.parse(input);
  const id = await upsertCategory(p);
  revalidatePath("/admin/shop/categories");
  if (p.id) revalidatePath(`/admin/shop/categories/${p.id}`);
  revalidatePath("/n/app/mobile/shop");
  return { ok: true as const, id };
}
export async function upsertCategoryForm(formData: FormData) {
  const res = await upsertCategoryAction({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    nameTranslations: fromForm3(formData, "name"),
    descriptionTranslations: fromForm3(formData, "desc"),
    parentId: formData.get("parentId") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    bannerUrl: formData.get("bannerUrl") || undefined,
    icon: formData.get("icon") || undefined,
    gradient: formData.get("gradient") || undefined,
    displayOrder: formData.get("displayOrder") || 0,
    isActive: formData.get("isActive") === "on",
  });
  if (!formData.get("id")) redirect(`/admin/shop/categories/${res.id}`);
}
export async function deleteCategoryAction(input: unknown) {
  const p = z.object({ id: shopId }).parse(input);
  await deleteCategory(p);
  revalidatePath("/admin/shop/categories");
  return { ok: true as const };
}
export async function deleteCategoryForm(formData: FormData) {
  await deleteCategoryAction({ id: formData.get("id") });
  redirect("/admin/shop/categories");
}

const categoryLinkSchema = z.object({ shopCategoryId: shopId, serviceDefinitionId: shopId, relationType: z.enum(RELATION) });
export async function linkCategoryServiceForm(formData: FormData) {
  const p = categoryLinkSchema.parse({
    shopCategoryId: formData.get("shopCategoryId"),
    serviceDefinitionId: formData.get("serviceDefinitionId"),
    relationType: formData.get("relationType"),
  });
  await setCategoryServiceLink(p);
  revalidatePath(`/admin/shop/categories/${p.shopCategoryId}`);
}
export async function unlinkCategoryServiceForm(formData: FormData) {
  const linkId = z.string().parse(formData.get("linkId"));
  const shopCategoryId = z.string().parse(formData.get("shopCategoryId"));
  await removeCategoryServiceLink({ linkId });
  revalidatePath(`/admin/shop/categories/${shopCategoryId}`);
}

// ======================================================================
// Brands
// ======================================================================
const brandSchema = z.object({
  id: shopId.optional(),
  slug: z.string().trim().min(1).max(180),
  nameTranslations: localized,
  descriptionTranslations: localized,
  logoUrl: z.string().trim().optional().nullable(),
  websiteUrl: z.string().trim().optional().nullable(),
  isActive: z.coerce.boolean().default(true),
});
export async function upsertBrandAction(input: unknown) {
  const p = brandSchema.parse(input);
  const id = await upsertBrand(p);
  revalidatePath("/admin/shop/brands");
  return { ok: true as const, id };
}
export async function upsertBrandForm(formData: FormData) {
  await upsertBrandAction({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    nameTranslations: fromForm3(formData, "name"),
    descriptionTranslations: fromForm3(formData, "desc"),
    logoUrl: formData.get("logoUrl") || undefined,
    websiteUrl: formData.get("websiteUrl") || undefined,
    isActive: formData.get("isActive") === "on",
  });
}
export async function deleteBrandForm(formData: FormData) {
  const id = z.string().parse(formData.get("id"));
  await deleteBrand({ id });
  revalidatePath("/admin/shop/brands");
}

// ======================================================================
// Home merchandising
// ======================================================================
const SECTION_TYPES = ["shortcut_rail", "promo_cards", "product_rail", "category_rail", "service_related_rail"] as const;
const QUERY_SOURCES = ["manual", "featured", "best_seller", "new_arrival", "discounted", "category", "service_related"] as const;

const sectionSchema = z.object({
  id: shopId.optional(),
  key: z.string().trim().min(1).max(60),
  sectionType: z.enum(SECTION_TYPES),
  titleTranslations: localized,
  subtitleTranslations: localized,
  querySource: z.enum(QUERY_SOURCES),
  queryConfig: z.record(z.string(), z.unknown()).default({}),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});
export async function upsertHomeSectionAction(input: unknown) {
  const p = sectionSchema.parse(input);
  const id = await upsertHomeSection(p);
  revalidatePath("/admin/shop/merchandising");
  revalidatePath("/n/app/mobile/shop");
  return { ok: true as const, id };
}
export async function upsertHomeSectionForm(formData: FormData) {
  const categorySlug = String(formData.get("categorySlug") || "").trim();
  await upsertHomeSectionAction({
    id: formData.get("id") || undefined,
    key: formData.get("key"),
    sectionType: formData.get("sectionType"),
    titleTranslations: fromForm3(formData, "title"),
    subtitleTranslations: fromForm3(formData, "subtitle"),
    querySource: formData.get("querySource"),
    queryConfig: categorySlug ? { slug: categorySlug } : {},
    displayOrder: formData.get("displayOrder") || 0,
    isActive: formData.get("isActive") === "on",
  });
}
export async function deleteHomeSectionForm(formData: FormData) {
  const id = z.string().parse(formData.get("id"));
  await deleteHomeSection({ id });
  revalidatePath("/admin/shop/merchandising");
  revalidatePath("/n/app/mobile/shop");
}

const sectionItemSchema = z.object({
  sectionId: shopId,
  productId: shopId.optional().nullable(),
  categoryId: shopId.optional().nullable(),
  labelTranslations: localized.optional(),
  imageUrl: z.string().trim().optional().nullable(),
  linkUrl: z.string().trim().optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).default(0),
});
export async function addHomeSectionItemForm(formData: FormData) {
  const p = sectionItemSchema.parse({
    sectionId: formData.get("sectionId"),
    productId: formData.get("productId") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    labelTranslations: fromForm3(formData, "label"),
    imageUrl: formData.get("imageUrl") || undefined,
    linkUrl: formData.get("linkUrl") || undefined,
    displayOrder: formData.get("displayOrder") || 0,
  });
  await addHomeSectionItem(p);
  revalidatePath("/admin/shop/merchandising");
  revalidatePath("/n/app/mobile/shop");
}
export async function removeHomeSectionItemForm(formData: FormData) {
  const itemId = z.string().parse(formData.get("itemId"));
  await removeHomeSectionItem({ itemId });
  revalidatePath("/admin/shop/merchandising");
  revalidatePath("/n/app/mobile/shop");
}
