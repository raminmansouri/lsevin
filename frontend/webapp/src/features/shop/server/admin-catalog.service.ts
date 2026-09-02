import "server-only";

import sql from "@/config/database/db";

import { SHOP_PERMISSIONS, assertShopPermission } from "../lib/permissions";

// postgres.js `sql.json` has a strict JSONValue signature; admin payloads are
// plain translation/config objects. One narrow cast, in one place.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const j = (value: unknown) => sql.json((value ?? {}) as any);

/**
 * Admin catalog operations: product core fields, category membership and the
 * Shop-owned service-definition links (SHP-ADM-002/006, SHP-V01-032/033,
 * SHP-API-027). The external service reference is a soft, application-validated
 * UUID — Shop does not FK into `category.service_definitions` (§3.3).
 */

const RELATION_TYPES = [
  "general",
  "recommended_before",
  "recommended_after",
  "compatible",
  "required",
  "optional_addon",
] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

export async function updateProductCore(input: {
  productId: string;
  status: "draft" | "active" | "archived";
  slug: string;
  basePrice: number;
  baseCurrency: string;
  nameTranslations: Record<string, string>;
  shortDescriptionTranslations: Record<string, string>;
  primaryCategoryId?: string | null;
  categoryIds: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isPreorder?: boolean;
  preorderReleaseAt?: string | null;
  preorderLimit?: number | null;
  preorderPaymentPolicy?: "full" | "deposit" | "proforma";
  preorderDepositPercent?: number | null;
}): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  const isPreorder = Boolean(input.isPreorder);
  const policy = ["full", "deposit", "proforma"].includes(input.preorderPaymentPolicy ?? "")
    ? input.preorderPaymentPolicy
    : "full";
  await sql.begin(async (tx) => {
    await tx`
      update shop.products set
        status = ${input.status}::shop.product_status,
        slug = ${input.slug},
        base_price = ${input.basePrice},
        base_currency = ${input.baseCurrency.toUpperCase()},
        name_translations = ${j(input.nameTranslations)},
        short_description_translations = ${j(input.shortDescriptionTranslations)},
        primary_category_id = ${input.primaryCategoryId ?? null}::uuid,
        is_featured = ${input.isFeatured},
        is_best_seller = ${input.isBestSeller},
        is_new_arrival = ${input.isNewArrival},
        is_preorder = ${isPreorder},
        preorder_release_at = ${isPreorder ? (input.preorderReleaseAt || null) : null},
        preorder_limit = ${isPreorder && input.preorderLimit != null ? Math.trunc(input.preorderLimit) : null},
        preorder_payment_policy = ${policy}::shop.preorder_payment_policy,
        preorder_deposit_percent = ${isPreorder && policy === "deposit" && input.preorderDepositPercent != null ? input.preorderDepositPercent : null},
        published_at = case when ${input.status} = 'active' then coalesce(published_at, now()) else published_at end,
        last_modified_date = now()
      where id = ${input.productId}::uuid and deleted_at is null
    `;
    await tx`delete from shop.product_categories where product_id = ${input.productId}::uuid`;
    for (const cid of new Set([...(input.categoryIds ?? []), ...(input.primaryCategoryId ? [input.primaryCategoryId] : [])])) {
      await tx`
        insert into shop.product_categories (product_id, category_id, is_primary)
        values (${input.productId}::uuid, ${cid}::uuid, ${cid === input.primaryCategoryId})
        on conflict do nothing
      `;
    }
    // refresh search vector (SHP-V01-005)
    await tx`
      update shop.products
      set search_vector =
        setweight(to_tsvector('simple', coalesce(name_translations->>'en','')), 'A') ||
        setweight(to_tsvector('simple', coalesce(short_description_translations->>'en','')), 'B')
      where id = ${input.productId}::uuid
    `;
  });
}

export async function setProductServiceLink(input: {
  productId: string;
  serviceDefinitionId: string;
  relationType: RelationType;
  displayOrder?: number;
}): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  if (!RELATION_TYPES.includes(input.relationType)) throw new Error("Invalid relation type.");
  // validate the external reference at the boundary (soft FK, §3.3 / SHP-REL-006)
  const [exists] = await sql<{ ok: boolean }[]>`
    select exists(select 1 from category.service_definitions where id = ${input.serviceDefinitionId}::uuid) as ok
  `;
  if (!exists?.ok) throw new Error("That service definition does not exist.");
  await sql`
    insert into shop.product_service_links (product_id, service_definition_id, relation_type, display_order, is_active)
    values (${input.productId}::uuid, ${input.serviceDefinitionId}::uuid, ${input.relationType}, ${input.displayOrder ?? 0}, true)
    on conflict (product_id, service_definition_id, relation_type)
    do update set is_active = true, display_order = excluded.display_order, last_modified_date = now()
  `;
}

export async function removeProductServiceLink(input: { linkId: string }): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  await sql`delete from shop.product_service_links where id = ${input.linkId}::uuid`;
}

export async function setCategoryServiceLink(input: {
  shopCategoryId: string;
  serviceDefinitionId: string;
  relationType: RelationType;
}): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  const [exists] = await sql<{ ok: boolean }[]>`
    select exists(select 1 from category.service_definitions where id = ${input.serviceDefinitionId}::uuid) as ok
  `;
  if (!exists?.ok) throw new Error("That service definition does not exist.");
  await sql`
    insert into shop.category_service_links (shop_category_id, service_definition_id, relation_type, is_active)
    values (${input.shopCategoryId}::uuid, ${input.serviceDefinitionId}::uuid, ${input.relationType}, true)
    on conflict (shop_category_id, service_definition_id, relation_type)
    do update set is_active = true, last_modified_date = now()
  `;
}

export async function removeCategoryServiceLink(input: { linkId: string }): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  await sql`delete from shop.category_service_links where id = ${input.linkId}::uuid`;
}

// ======================================================================
// Product create (SHP-ADM-002)
// ======================================================================
export async function createProduct(input: {
  slug: string;
  productType: "simple" | "variant" | "bundle" | "digital";
  basePrice: number;
  baseCurrency: string;
  nameTranslations: Record<string, string>;
  shortDescriptionTranslations: Record<string, string>;
  primaryCategoryId?: string | null;
  categoryIds: string[];
}): Promise<string> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  return sql.begin(async (tx) => {
    const [row] = await tx<{ id: string }[]>`
      insert into shop.products (
        product_type, status, slug, base_currency, base_price,
        name_translations, short_description_translations, description_translations,
        primary_category_id, tax_class, requires_shipping
      ) values (
        ${input.productType}::shop.product_type, 'draft', ${input.slug}, ${input.baseCurrency.toUpperCase()}, ${input.basePrice},
        ${j(input.nameTranslations)}, ${j(input.shortDescriptionTranslations)}, ${j(input.shortDescriptionTranslations)},
        ${input.primaryCategoryId ?? null}::uuid, 'standard', ${input.productType !== "digital"}
      )
      returning id::text as id
    `;
    for (const cid of new Set([...(input.categoryIds ?? []), ...(input.primaryCategoryId ? [input.primaryCategoryId] : [])])) {
      await tx`
        insert into shop.product_categories (product_id, category_id, is_primary)
        values (${row.id}::uuid, ${cid}::uuid, ${cid === input.primaryCategoryId})
        on conflict do nothing
      `;
    }
    return row.id;
  });
}

// ======================================================================
// Product media (SHP-ADM-005, SHP-CAT-007)
// ======================================================================
export async function setProductGallery(input: { productId: string; urls: string[] }): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  const urls = Array.from(new Set(input.urls.filter(Boolean)));
  await sql.begin(async (tx) => {
    // keep it simple and idempotent: replace the gallery, first url is primary
    const existingPrimary = await tx<{ url: string }[]>`
      select url from shop.product_media where product_id = ${input.productId}::uuid and is_primary limit 1
    `;
    await tx`delete from shop.product_media where product_id = ${input.productId}::uuid and variant_id is null`;
    let order = 0;
    for (const url of urls) {
      const isPrimary = existingPrimary[0]?.url ? url === existingPrimary[0].url : order === 0;
      await tx`
        insert into shop.product_media (product_id, url, media_type, display_order, is_primary)
        values (${input.productId}::uuid, ${url}, 'image', ${order}, ${isPrimary})
      `;
      order += 1;
    }
    // if no existing primary matched (e.g. it was removed), force the first row primary
    await tx`
      update shop.product_media m
      set is_primary = (m.id = sub.first_id)
      from (
        select id as first_id from shop.product_media
        where product_id = ${input.productId}::uuid and variant_id is null
        order by display_order asc limit 1
      ) sub
      where m.product_id = ${input.productId}::uuid and m.variant_id is null
        and not exists (select 1 from shop.product_media where product_id = ${input.productId}::uuid and variant_id is null and is_primary)
    `;
  });
}

// ======================================================================
// Categories (SHP-ADM-006, SHP-CAT-006)
// ======================================================================
export async function upsertCategory(input: {
  id?: string;
  slug: string;
  nameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  parentId?: string | null;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  icon?: string | null;
  gradient?: string | null;
  displayOrder: number;
  isActive: boolean;
}): Promise<string> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  if (input.id && input.parentId === input.id) throw new Error("A category cannot be its own parent.");
  if (input.id) {
    await sql`
      update shop.categories set
        slug = ${input.slug}, name_translations = ${j(input.nameTranslations)},
        description_translations = ${j(input.descriptionTranslations)},
        parent_id = ${input.parentId ?? null}::uuid, image_url = ${input.imageUrl ?? null}, banner_url = ${input.bannerUrl ?? null},
        icon = ${input.icon ?? null}, gradient = ${input.gradient ?? null}, display_order = ${input.displayOrder},
        is_active = ${input.isActive}, last_modified_date = now()
      where id = ${input.id}::uuid
    `;
    return input.id;
  }
  const [row] = await sql<{ id: string }[]>`
    insert into shop.categories (slug, name_translations, description_translations, parent_id, image_url, banner_url, icon, gradient, display_order, is_active)
    values (${input.slug}, ${j(input.nameTranslations)}, ${j(input.descriptionTranslations)}, ${input.parentId ?? null}::uuid,
      ${input.imageUrl ?? null}, ${input.bannerUrl ?? null}, ${input.icon ?? null}, ${input.gradient ?? null}, ${input.displayOrder}, ${input.isActive})
    returning id::text as id
  `;
  return row.id;
}

export async function deleteCategory(input: { id: string }): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  const [{ productCount }] = await sql<{ productCount: number }[]>`
    select count(*)::int as "productCount" from shop.product_categories where category_id = ${input.id}::uuid
  `;
  const [{ childCount }] = await sql<{ childCount: number }[]>`
    select count(*)::int as "childCount" from shop.categories where parent_id = ${input.id}::uuid and deleted_at is null
  `;
  if (productCount > 0) throw new Error(`Category still has ${productCount} product(s) assigned; reassign them first.`);
  if (childCount > 0) throw new Error(`Category still has ${childCount} subcategory(ies); move or delete them first.`);
  // soft-delete: historical order snapshots never reference categories directly, but
  // keep the pattern consistent with products (SHP-CAT-009)
  await sql`update shop.categories set deleted_at = now(), is_active = false where id = ${input.id}::uuid`;
}

// ======================================================================
// Brands (SHP-ADM-007)
// ======================================================================
export async function upsertBrand(input: {
  id?: string;
  slug: string;
  nameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  isActive: boolean;
}): Promise<string> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  if (input.id) {
    await sql`
      update shop.brands set slug = ${input.slug}, name_translations = ${j(input.nameTranslations)},
        description_translations = ${j(input.descriptionTranslations)}, logo_url = ${input.logoUrl ?? null},
        website_url = ${input.websiteUrl ?? null}, is_active = ${input.isActive}, last_modified_date = now()
      where id = ${input.id}::uuid
    `;
    return input.id;
  }
  const [row] = await sql<{ id: string }[]>`
    insert into shop.brands (slug, name_translations, description_translations, logo_url, website_url, is_active)
    values (${input.slug}, ${j(input.nameTranslations)}, ${j(input.descriptionTranslations)}, ${input.logoUrl ?? null}, ${input.websiteUrl ?? null}, ${input.isActive})
    returning id::text as id
  `;
  return row.id;
}

export async function deleteBrand(input: { id: string }): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  await sql`update shop.brands set deleted_at = now(), is_active = false where id = ${input.id}::uuid`;
}

// ======================================================================
// Home merchandising (SHP-ADM-018, SHP-API-028, SHP-DB-003)
// ======================================================================
const SECTION_TYPES = ["shortcut_rail", "promo_cards", "product_rail", "category_rail", "service_related_rail"] as const;
const QUERY_SOURCES = ["manual", "featured", "best_seller", "new_arrival", "discounted", "category", "service_related"] as const;

export async function upsertHomeSection(input: {
  id?: string;
  key: string;
  sectionType: (typeof SECTION_TYPES)[number];
  titleTranslations: Record<string, string>;
  subtitleTranslations: Record<string, string>;
  querySource: (typeof QUERY_SOURCES)[number];
  queryConfig: Record<string, unknown>;
  displayOrder: number;
  isActive: boolean;
}): Promise<string> {
  await assertShopPermission(SHOP_PERMISSIONS.merchandisingManage);
  if (!SECTION_TYPES.includes(input.sectionType)) throw new Error("Invalid section type.");
  if (!QUERY_SOURCES.includes(input.querySource)) throw new Error("Invalid query source.");
  if (input.id) {
    await sql`
      update shop.home_sections set key = ${input.key}, section_type = ${input.sectionType},
        title_translations = ${j(input.titleTranslations)}, subtitle_translations = ${j(input.subtitleTranslations)},
        query_source = ${input.querySource}, query_config = ${j(input.queryConfig)},
        display_order = ${input.displayOrder}, is_active = ${input.isActive}, last_modified_date = now()
      where id = ${input.id}::uuid
    `;
    return input.id;
  }
  const [row] = await sql<{ id: string }[]>`
    insert into shop.home_sections (key, section_type, title_translations, subtitle_translations, query_source, query_config, display_order, is_active)
    values (${input.key}, ${input.sectionType}, ${j(input.titleTranslations)}, ${j(input.subtitleTranslations)}, ${input.querySource}, ${j(input.queryConfig)}, ${input.displayOrder}, ${input.isActive})
    returning id::text as id
  `;
  return row.id;
}

export async function deleteHomeSection(input: { id: string }): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.merchandisingManage);
  await sql`delete from shop.home_sections where id = ${input.id}::uuid`;
}

// ======================================================================
// Attributes & attribute values (SHP-ADM-007, SHP-CAT-006)
// ======================================================================
const ATTRIBUTE_DISPLAY_TYPES = ["select", "swatch", "text", "boolean"] as const;

export async function upsertAttribute(input: {
  id?: string;
  nameTranslations: Record<string, string>;
  slug: string;
  displayType: string;
  isVariantDefining: boolean;
}): Promise<string> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  const slug = input.slug.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(slug)) throw new Error("Slug must be kebab-case.");
  const displayType = ATTRIBUTE_DISPLAY_TYPES.includes(input.displayType as never)
    ? input.displayType
    : "select";
  if (input.id) {
    await sql`
      update shop.attributes set name_translations = ${j(input.nameTranslations)}, slug = ${slug},
        display_type = ${displayType}, is_variant_defining = ${input.isVariantDefining},
        last_modified_date = now()
      where id = ${input.id}::uuid
    `;
    return input.id;
  }
  const [row] = await sql<{ id: string }[]>`
    insert into shop.attributes (name_translations, slug, display_type, is_variant_defining)
    values (${j(input.nameTranslations)}, ${slug}, ${displayType}, ${input.isVariantDefining})
    returning id::text as id
  `;
  return row.id;
}

export async function deleteAttribute(input: { id: string }): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  const [inUse] = await sql<{ n: number }[]>`
    select count(*)::int as n from shop.product_attributes where attribute_id = ${input.id}::uuid
  `;
  if (inUse.n > 0) throw new Error(`Attribute is attached to ${inUse.n} product(s) — detach it first.`);
  await sql`delete from shop.attribute_values where attribute_id = ${input.id}::uuid`;
  await sql`delete from shop.attributes where id = ${input.id}::uuid`;
}

export async function addAttributeValue(input: {
  attributeId: string;
  value: string;
  displayNameTranslations: Record<string, string>;
  colorHex?: string | null;
  imageUrl?: string | null;
}): Promise<string> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  const value = input.value.trim();
  if (!value) throw new Error("Value is required.");
  const [row] = await sql<{ id: string }[]>`
    insert into shop.attribute_values (attribute_id, value, display_name_translations, color_hex, image_url)
    values (${input.attributeId}::uuid, ${value}, ${j(input.displayNameTranslations)},
            ${input.colorHex || null}, ${input.imageUrl || null})
    returning id::text as id
  `;
  return row.id;
}

export async function deleteAttributeValue(input: { id: string }): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  await sql`delete from shop.attribute_values where id = ${input.id}::uuid`;
}

export async function setProductAttribute(input: {
  productId: string;
  attributeId: string;
  isRequired: boolean;
  displayOrder: number;
}): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  await sql`
    insert into shop.product_attributes (product_id, attribute_id, is_required, display_order)
    values (${input.productId}::uuid, ${input.attributeId}::uuid, ${input.isRequired}, ${input.displayOrder})
    on conflict (product_id, attribute_id)
    do update set is_required = excluded.is_required, display_order = excluded.display_order
  `;
}

export async function removeProductAttribute(input: { productId: string; attributeId: string }): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  await sql`
    delete from shop.product_attributes
    where product_id = ${input.productId}::uuid and attribute_id = ${input.attributeId}::uuid
  `;
}

/**
 * Warehouse allocation policy (SHP-V03-001): priority (lower = preferred),
 * active flag, and the single default warehouse for un-targeted stock writes.
 */
export async function updateWarehouse(input: {
  id: string;
  priority: number;
  isActive: boolean;
  isDefault: boolean;
}): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.inventoryManage);
  const priority = Number.isFinite(input.priority) ? Math.trunc(input.priority) : 100;
  await sql.begin(async (tx) => {
    if (input.isDefault) {
      await tx`update shop.warehouses set is_default = false where is_default and id <> ${input.id}::uuid`;
    }
    await tx`
      update shop.warehouses set
        priority = ${Math.min(Math.max(priority, 0), 100000)},
        is_active = ${input.isActive},
        is_default = ${input.isDefault},
        last_modified_date = now()
      where id = ${input.id}::uuid
    `;
  });
}

/**
 * Delivery method operational config incl. `rules.geo` geographic eligibility
 * (SHP-V03-012). `rules` is validated as an object before it is written.
 */
export async function updateDeliveryMethod(input: {
  id: string;
  baseFee: number;
  isActive: boolean;
  estimatedDaysMin?: number | null;
  estimatedDaysMax?: number | null;
  rules: unknown;
}): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  const fee = Number(input.baseFee);
  if (!Number.isFinite(fee) || fee < 0) throw new Error("Base fee must be a non-negative number.");
  const rules =
    input.rules && typeof input.rules === "object" && !Array.isArray(input.rules) ? input.rules : {};
  await sql`
    update shop.delivery_methods set
      base_fee = ${fee},
      is_active = ${input.isActive},
      estimated_days_min = ${input.estimatedDaysMin ?? null},
      estimated_days_max = ${input.estimatedDaysMax ?? null},
      rules = ${j(rules)},
      last_modified_date = now()
    where id = ${input.id}::uuid
  `;
}

export async function addHomeSectionItem(input: {
  sectionId: string;
  productId?: string | null;
  categoryId?: string | null;
  labelTranslations?: Record<string, string>;
  imageUrl?: string | null;
  linkUrl?: string | null;
  badgeTranslations?: Record<string, string>;
  displayOrder: number;
}): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.merchandisingManage);
  await sql`
    insert into shop.home_section_items (section_id, product_id, category_id, label_translations, image_url, link_url, badge_translations, display_order, is_active)
    values (${input.sectionId}::uuid, ${input.productId ?? null}::uuid, ${input.categoryId ?? null}::uuid,
      ${j(input.labelTranslations ?? {})}, ${input.imageUrl ?? null}, ${input.linkUrl ?? null},
      ${j(input.badgeTranslations ?? {})}, ${input.displayOrder}, true)
  `;
}

export async function removeHomeSectionItem(input: { itemId: string }): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.merchandisingManage);
  await sql`delete from shop.home_section_items where id = ${input.itemId}::uuid`;
}

// ======================================================================
// Product variants / SKUs (SHP-ADM-004, SHP-CAT-004)
// ======================================================================
export async function upsertVariant(input: {
  productId: string;
  id?: string;
  titleTranslations: Record<string, string>;
  sku: string;
  optionKey: string;
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  isActive: boolean;
  allowBackorder: boolean;
  initialStock?: number;
}): Promise<string> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  const sku = input.sku.trim();
  if (!sku) throw new Error("SKU is required.");

  return sql.begin(async (tx) => {
    // SKU must be unique among purchasable variants (SHP-CAT-004)
    const dup = await tx<{ id: string }[]>`
      select id::text as id from shop.product_variants
      where sku = ${sku} and deleted_at is null and (${input.id ?? null}::uuid is null or id <> ${input.id ?? null}::uuid)
      limit 1
    `;
    if (dup[0]) throw new Error(`SKU "${sku}" is already in use.`);

    if (input.id) {
      await tx`
        update shop.product_variants set
          title_translations = ${j(input.titleTranslations)}, sku = ${sku}, option_key = ${input.optionKey.trim() || sku},
          price = ${input.price}, compare_at_price = ${input.compareAtPrice ?? null},
          currency = ${input.currency.toUpperCase()}, is_active = ${input.isActive}, allow_backorder = ${input.allowBackorder},
          last_modified_date = now()
        where id = ${input.id}::uuid and product_id = ${input.productId}::uuid
      `;
      return input.id;
    }

    const slug = `${sku.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).slice(2, 6)}`;
    const [row] = await tx<{ id: string }[]>`
      insert into shop.product_variants (product_id, title_translations, slug, sku, currency, price, compare_at_price, is_active, allow_backorder, option_key)
      values (${input.productId}::uuid, ${j(input.titleTranslations)}, ${slug}, ${sku}, ${input.currency.toUpperCase()},
        ${input.price}, ${input.compareAtPrice ?? null}, ${input.isActive}, ${input.allowBackorder}, ${input.optionKey.trim() || sku})
      returning id::text as id
    `;
    // flip the product to a variant product if it was simple
    await tx`update shop.products set product_type = 'variant'::shop.product_type, last_modified_date = now()
             where id = ${input.productId}::uuid and product_type = 'simple'`;
    // stock row for the new variant at the first warehouse
    const stock = Math.max(0, Math.trunc(input.initialStock ?? 0));
    await tx`
      insert into shop.inventory (product_id, variant_id, warehouse_id, on_hand, reserved)
      select ${input.productId}::uuid, ${row.id}::uuid, w.id, ${stock}, 0 from shop.warehouses w where w.is_active order by w.create_date asc limit 1
    `;
    return row.id;
  });
}

export async function deleteVariant(input: { id: string }): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  // soft-delete: historical order snapshots keep the variant name/sku (SHP-CAT-009)
  await sql`update shop.product_variants set deleted_at = now(), is_active = false, last_modified_date = now() where id = ${input.id}::uuid`;
}

// ======================================================================
// Coupons (SHP-V02-004, admin side). Evaluation lives in coupon.service.ts.
// ======================================================================
const COUPON_TYPES = ["fixed", "percentage", "free_shipping"] as const;
const DISCOUNT_SCOPES = ["cart", "product", "category", "brand", "shipping"] as const;

export async function upsertCoupon(input: {
  id?: string;
  code: string;
  couponType: (typeof COUPON_TYPES)[number];
  value: number;
  currency?: string | null;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  minSubtotal: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usagePerCustomer?: number | null;
  stackable: boolean;
  scope: (typeof DISCOUNT_SCOPES)[number];
  titleTranslations: Record<string, string>;
}): Promise<string> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  if (!COUPON_TYPES.includes(input.couponType)) throw new Error("Invalid coupon type.");
  if (!DISCOUNT_SCOPES.includes(input.scope)) throw new Error("Invalid scope.");
  const code = input.code.trim().toUpperCase();
  if (!code) throw new Error("Coupon code is required.");
  if (input.couponType === "fixed" && !input.currency) throw new Error("A fixed coupon needs a currency.");

  if (input.id) {
    await sql`
      update shop.coupons set
        code = ${code}, coupon_type = ${input.couponType}::shop.coupon_type, value = ${input.value},
        currency = ${input.currency ?? null}, is_active = ${input.isActive},
        starts_at = ${input.startsAt ?? null}, expires_at = ${input.expiresAt ?? null},
        min_subtotal = ${input.minSubtotal}, max_discount_amount = ${input.maxDiscountAmount ?? null},
        usage_limit = ${input.usageLimit ?? null}, usage_per_customer = ${input.usagePerCustomer ?? null},
        stackable = ${input.stackable}, scope = ${input.scope}::shop.discount_scope,
        title_translations = ${j(input.titleTranslations)}, last_modified_date = now()
      where id = ${input.id}::uuid
    `;
    return input.id;
  }
  const [row] = await sql<{ id: string }[]>`
    insert into shop.coupons (code, coupon_type, value, currency, is_active, starts_at, expires_at, min_subtotal,
      max_discount_amount, usage_limit, usage_per_customer, stackable, scope, title_translations)
    values (${code}, ${input.couponType}::shop.coupon_type, ${input.value}, ${input.currency ?? null}, ${input.isActive},
      ${input.startsAt ?? null}, ${input.expiresAt ?? null}, ${input.minSubtotal}, ${input.maxDiscountAmount ?? null},
      ${input.usageLimit ?? null}, ${input.usagePerCustomer ?? null}, ${input.stackable}, ${input.scope}::shop.discount_scope,
      ${j(input.titleTranslations)})
    returning id::text as id
  `;
  return row.id;
}

export async function deleteCoupon(input: { id: string }): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  await sql`update shop.coupons set is_active = false, last_modified_date = now() where id = ${input.id}::uuid`;
}
