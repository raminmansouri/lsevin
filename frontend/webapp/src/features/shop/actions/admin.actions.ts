"use server";
import { revalidatePath } from "next/cache";
import { sql, assertAdmin } from "../lib/db";
import { adminCouponUpsertSchema, adminProductUpsertSchema } from "../schemas/admin";

export async function upsertProductAction(input: unknown) {
  await assertAdmin();
  const parsed = adminProductUpsertSchema.parse(input);
  let productId = parsed.id;
  if (productId) {
    await sql`update shop.products set product_type = ${parsed.productType}, status = ${parsed.status}, brand_id = ${parsed.brandId ?? null}::uuid, primary_category_id = ${parsed.primaryCategoryId ?? null}::uuid, name_translations = ${JSON.stringify(parsed.nameTranslations)}, short_description_translations = ${JSON.stringify(parsed.shortDescriptionTranslations)}, description_translations = ${JSON.stringify(parsed.descriptionTranslations)}, slug = ${parsed.slug}, base_currency = ${parsed.baseCurrency}, base_price = ${parsed.basePrice}, compare_at_price = ${parsed.compareAtPrice ?? null}, cost_price = ${parsed.costPrice ?? null}, tax_class = ${parsed.taxClass}, allow_backorder = ${parsed.allowBackorder}, requires_shipping = ${parsed.requiresShipping}, is_featured = ${parsed.isFeatured}, is_best_seller = ${parsed.isBestSeller}, is_new_arrival = ${parsed.isNewArrival}, fulfillment_type = ${parsed.fulfillmentType}, last_modified_date = now() where id = ${productId}::uuid`;
    await sql`delete from shop.product_categories where product_id = ${productId}::uuid`;
  } else {
    const [created] = await sql<{ id: string }[]>`insert into shop.products (product_type, status, brand_id, primary_category_id, name_translations, short_description_translations, description_translations, slug, base_currency, base_price, compare_at_price, cost_price, tax_class, allow_backorder, requires_shipping, is_featured, is_best_seller, is_new_arrival, fulfillment_type, published_at) values (${parsed.productType}, ${parsed.status}, ${parsed.brandId ?? null}::uuid, ${parsed.primaryCategoryId ?? null}::uuid, ${JSON.stringify(parsed.nameTranslations)}, ${JSON.stringify(parsed.shortDescriptionTranslations)}, ${JSON.stringify(parsed.descriptionTranslations)}, ${parsed.slug}, ${parsed.baseCurrency}, ${parsed.basePrice}, ${parsed.compareAtPrice ?? null}, ${parsed.costPrice ?? null}, ${parsed.taxClass}, ${parsed.allowBackorder}, ${parsed.requiresShipping}, ${parsed.isFeatured}, ${parsed.isBestSeller}, ${parsed.isNewArrival}, ${parsed.fulfillmentType}, case when ${parsed.status} = 'active' then now() else null end) returning id::text as id`;
    productId = created.id;
  }
  for (const categoryId of parsed.categoryIds) {
    await sql`insert into shop.product_categories (product_id, category_id, is_primary) values (${productId}::uuid, ${categoryId}::uuid, ${parsed.primaryCategoryId === categoryId}) on conflict do nothing`;
  }
  revalidatePath("/admin/shop/products");
  return { ok: true, productId };
}

export async function upsertCouponAction(input: unknown) {
  await assertAdmin();
  const parsed = adminCouponUpsertSchema.parse(input);
  if (parsed.id) {
    await sql`update shop.coupons set code = ${parsed.code}, title_translations = ${JSON.stringify(parsed.titleTranslations)}, description_translations = ${JSON.stringify(parsed.descriptionTranslations)}, coupon_type = ${parsed.couponType}, value = ${parsed.value}, currency = ${parsed.currency ?? null}, is_active = ${parsed.isActive}, starts_at = ${parsed.startsAt ?? null}, expires_at = ${parsed.expiresAt ?? null}, min_subtotal = ${parsed.minSubtotal}, max_discount_amount = ${parsed.maxDiscountAmount ?? null}, usage_limit = ${parsed.usageLimit ?? null}, usage_per_customer = ${parsed.usagePerCustomer ?? null}, stackable = ${parsed.stackable}, scope = ${parsed.scope}, applies_to = ${JSON.stringify(parsed.appliesTo)}, last_modified_date = now() where id = ${parsed.id}::uuid`;
  } else {
    await sql`insert into shop.coupons (code, title_translations, description_translations, coupon_type, value, currency, is_active, starts_at, expires_at, min_subtotal, max_discount_amount, usage_limit, usage_per_customer, stackable, scope, applies_to) values (${parsed.code}, ${JSON.stringify(parsed.titleTranslations)}, ${JSON.stringify(parsed.descriptionTranslations)}, ${parsed.couponType}, ${parsed.value}, ${parsed.currency ?? null}, ${parsed.isActive}, ${parsed.startsAt ?? null}, ${parsed.expiresAt ?? null}, ${parsed.minSubtotal}, ${parsed.maxDiscountAmount ?? null}, ${parsed.usageLimit ?? null}, ${parsed.usagePerCustomer ?? null}, ${parsed.stackable}, ${parsed.scope}, ${JSON.stringify(parsed.appliesTo)})`;
  }
  revalidatePath("/admin/shop/coupons");
  return { ok: true };
}
