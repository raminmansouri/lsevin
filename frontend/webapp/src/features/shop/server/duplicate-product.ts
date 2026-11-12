import "server-only";

import { randomUUID } from "node:crypto";
import type { TransactionSql } from "postgres";

import sql from "@/config/database/db";

import { assertShopPermission, SHOP_PERMISSIONS } from "../lib/permissions";

const TIMESTAMPS = ["create_date", "created_at", "last_modified_date", "updated_at"];

const NOT_COPIED_VARIANT_TABLES = [
  "product_media",
  "offers",
  "offer_price_history",
  "inventory",
  "inventory_movements",
  "cart_items",
  "order_items",
  "wishlist_items",
  "compare_list_items",
  "recently_viewed_products",
  "analytics_events",
  "product_change_requests",
  "shipment_items",
  "return_items",
  "product_reviews",
  "product_questions",
  "home_section_items",
];

async function columnsOf(tx: TransactionSql, table: string): Promise<string[]> {
  const [schema, name] = table.split(".");
  const rows = await tx<{ column_name: string }[]>`
    select column_name from information_schema.columns
    where table_schema = ${schema} and table_name = ${name}
      and is_generated = 'NEVER' and identity_generation is null
    order by ordinal_position
  `;
  return rows.map((row) => row.column_name);
}

async function copyRows(
  tx: TransactionSql,
  table: string,
  from: string,
  params: unknown[],
  set: Record<string, string>
): Promise<void> {
  const columns = await columnsOf(tx, table);
  if (!columns.length) return;
  const expressions = columns.map((column) => {
    if (set[column] !== undefined) return set[column];
    if (TIMESTAMPS.includes(column)) return "now()";
    if (column === "id") return "gen_random_uuid()";
    return `s."${column}"`;
  });
  await tx.unsafe(
    `insert into ${table} (${columns.map((column) => `"${column}"`).join(", ")}) select ${expressions.join(", ")} ${from}`,
    params as never[]
  );
}

export async function duplicateProduct(productId: string): Promise<{ id: string; slug: string }> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  return sql.begin(async (tx) => {
    const [source] = await tx<{ slug: string }[]>`
      select slug from shop.products where id = ${productId}::uuid and deleted_at is null limit 1
    `;
    if (!source) throw new Error("کالا پیدا نشد.");

    let slug = `${source.slug}-copy`;
    for (let n = 2; (await tx`select 1 from shop.products where slug = ${slug} limit 1`).length; n += 1) {
      slug = `${source.slug}-copy-${n}`;
    }
    const newId = randomUUID();
    const suffix = newId.slice(0, 4).toUpperCase();

    await copyRows(tx, "shop.products", "from shop.products s where s.id = $1::uuid", [productId, newId, slug], {
      id: "$2::uuid",
      slug: "$3",
      status: "'draft'",
      deleted_at: "null",
      published_at: "null",
      name_translations:
        "(select coalesce(jsonb_object_agg(key, value || ' (کپی)'), '{}'::jsonb) from jsonb_each_text(s.name_translations))",
      sold_count: "0",
      rating: "0",
      review_count: "0",
      view_count: "0",
      trending_score: "0",
    });

    await tx.unsafe(
      `create temp table _variant_map on commit drop as
         select id as old_id, gen_random_uuid() as new_id
           from shop.product_variants where product_id = $1::uuid and deleted_at is null`,
      [productId]
    );

    await copyRows(
      tx,
      "shop.product_variants",
      "from shop.product_variants s join _variant_map m on m.old_id = s.id",
      [newId, suffix],
      { id: "m.new_id", product_id: "$1::uuid", sku: "s.sku || '-' || $2" }
    );

    const variantTables = await tx<{ table_name: string }[]>`
      select c.table_name from information_schema.columns c
      join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
      where c.table_schema = 'shop' and c.column_name = 'variant_id'
        and c.table_name <> 'product_variants'
        and not (c.table_name = any(${NOT_COPIED_VARIANT_TABLES}::text[]))
        and not exists (
          select 1 from information_schema.columns p
          where p.table_schema = 'shop' and p.table_name = c.table_name and p.column_name = 'product_id'
        )
    `;
    for (const { table_name } of variantTables) {
      await copyRows(
        tx,
        `shop.${table_name}`,
        `from shop.${table_name} s join _variant_map m on m.old_id = s.variant_id`,
        [],
        { variant_id: "m.new_id" }
      );
    }

    for (const table of ["shop.product_categories", "shop.product_attributes", "shop.product_service_links"]) {
      await copyRows(tx, table, "from " + table + " s where s.product_id = $1::uuid", [productId, newId], {
        product_id: "$2::uuid",
      });
    }

    await copyRows(
      tx,
      "shop.product_media",
      "from shop.product_media s left join _variant_map m on m.old_id = s.variant_id where s.product_id = $1::uuid",
      [productId, newId],
      { product_id: "$2::uuid", variant_id: "coalesce(m.new_id, s.variant_id)" }
    );

    return { id: newId, slug };
  });
}