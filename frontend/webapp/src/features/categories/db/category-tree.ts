import "server-only";

import sql from "@/config/database/db";

/**
 * Categories are a tree of business kinds, and browsing walks down it:
 * Accommodation → Hotel / Villa / Suite, Health → Hospital / Laboratory / Clinic.
 * Every "which providers are in this category" question therefore has to be asked
 * of the node's whole subtree — asking it of the single row makes a parent category
 * look empty, because the businesses hang off its children.
 *
 * These helpers are the one place that rule lives. Use them instead of comparing
 * a category id directly.
 */

/**
 * The ids of a category and every active category beneath it.
 *
 * Usable anywhere a subquery is: `sql\`sp.category_id in (${categorySubtreeIds(id)})\``.
 * The starting node is included whether or not it is active — the caller has
 * already decided to browse it.
 */
export function categorySubtreeIds(categoryId: string) {
  return sql`
    with recursive category_subtree as (
      select c.id
      from category.categories c
      where c.id = ${categoryId}::uuid
      union all
      select child.id
      from category.categories child
      join category_subtree ancestor on child.parent_id = ancestor.id
      where child.is_active = true
    )
    select id from category_subtree
  `;
}

/**
 * Whether a provider belongs to a category, or to anything under it.
 *
 * `service_providers.category_id` is the authority. A provider is filed under one
 * node, so a clinic that offers a single procedure catalogued under Hospital is no
 * longer listed as a hospital — which is what the service-derived membership did.
 *
 * Providers that have not been filed yet keep the old service-derived membership,
 * so no provider drops out of the app between migration `0019` and the moment an
 * admin sets the field. Delete that branch once `category_id` is complete; it is
 * the only remaining source of the cross-listing.
 *
 * @param categoryId  The node being browsed.
 * @param alias       SQL alias of `category.service_providers` in the caller's query.
 */
export function providerInCategorySubtree(categoryId: string, alias = "sp") {
  const provider = sql(alias);

  return sql`(
    ${provider}.category_id in (${categorySubtreeIds(categoryId)})
    or (
      ${provider}.category_id is null
      and exists (
        select 1
        from category.provider_services ps
        join category.service_definitions sd on sd.id = ps.service_definition_id
        where ps.service_provider_id = ${provider}.id
          and ps.is_active = true
          and sd.is_active = true
          and sd.category_id in (${categorySubtreeIds(categoryId)})
      )
    )
  )`;
}

/**
 * Provider counts for *every* category at once, rolled up over each subtree.
 *
 * The per-node helper above would mean one recursive query per card, so listing
 * screens use this instead: it walks each category up to its ancestors once, then
 * counts distinct providers per ancestor. A provider filed under Clinic is counted
 * for Clinic and for Health, treatment and beauty, and only once for each.
 *
 * Exposes two CTEs to the surrounding query — `category_provider_counts`
 * (`category_id`, `provider_count`) and `category_child_counts`
 * (`category_id`, `child_count`) — and must therefore be the first thing after
 * `with recursive`:
 *
 * ```ts
 * sql`
 *   with recursive ${categoryProviderCountsCte()}
 *   select c.id, coalesce(pc.provider_count, 0)
 *   from category.categories c
 *   left join category_provider_counts pc on pc.category_id = c.id
 * `
 * ```
 */
export function categoryProviderCountsCte() {
  return sql`
    category_ancestry as (
      select c.id as node_id, c.id as ancestor_id, c.parent_id
      from category.categories c
      where c.is_active = true
      union all
      select a.node_id, parent.id as ancestor_id, parent.parent_id
      from category_ancestry a
      join category.categories parent
        on parent.id = a.parent_id
       and parent.is_active = true
    ),
    category_membership as (
      -- Filed by an admin: authoritative, and the provider appears nowhere else.
      select sp.id as provider_id, sp.category_id as node_id
      from category.service_providers sp
      where sp.is_active = true
        and sp.category_id is not null
      union
      -- Not filed yet: fall back to wherever its services are catalogued, so the
      -- provider is still reachable. Mirrors providerInCategorySubtree.
      select sp.id as provider_id, sd.category_id as node_id
      from category.service_providers sp
      join category.provider_services ps
        on ps.service_provider_id = sp.id
       and ps.is_active = true
      join category.service_definitions sd
        on sd.id = ps.service_definition_id
       and sd.is_active = true
      where sp.is_active = true
        and sp.category_id is null
        and sd.category_id is not null
    ),
    category_provider_counts as (
      select a.ancestor_id as category_id, count(distinct m.provider_id)::int as provider_count
      from category_membership m
      join category_ancestry a on a.node_id = m.node_id
      group by a.ancestor_id
    ),
    category_child_counts as (
      select child.parent_id as category_id, count(*)::int as child_count
      from category.categories child
      where child.is_active = true
        and child.parent_id is not null
      group by child.parent_id
    )
  `;
}

/**
 * How many distinct providers are reachable through the category tree at all.
 *
 * Summing the per-category counts double-counts: a provider filed under Clinic is
 * counted for Clinic and again for its parent. The categories screen was reporting
 * 170 providers over a table that holds 141.
 */
export function categoryTotalProviderCount() {
  return sql`
    (
      select count(distinct m.provider_id)::int
      from category_membership m
    )
  `;
}
