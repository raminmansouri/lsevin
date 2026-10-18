import "server-only";

import sql from "@/config/database/db";

// Copies a service provider and everything that describes it into a new provider:
// services and prices, galleries, attributes, policies, languages, certifications,
// staff links, opening hours, availability rules, bookable rooms/resources, add-ons,
// meal plans, gym plans, transfer routes, future tour dates and case templates.
//
// Not copied, on purpose: bookings, reviews and ratings, wallets, ledgers, payouts,
// payout accounts, invoices, members/invitations (they grant user accounts access),
// staff pay rules, coupons/offers, special packages, booked hotel nights and the
// CRM-style studio data. Staff are linked, not cloned: category.staff is shared
// between providers through category.provider_staffs, so the copy lists the same people.
//
// Media rows point at the same stored files; nothing deletes files when a gallery row
// or provider is removed, so sharing them is safe.
//
// Columns are read from information_schema at run time, so columns added by later
// migrations are copied too, and tables that don't exist on a database are skipped.

type Tx = { unsafe: (query: string, params?: unknown[]) => Promise<any[]> };

type CopySpec = {
  table: string;
  // SQL condition on the source row `s`; :src is the source provider id.
  where: string;
  // Mapped tables get a new id recorded in _dup_map so children can follow it.
  mapIds?: boolean;
  // uuid columns whose value is replaced by its copy when one exists.
  remap?: string[];
  // Column -> SQL expression (may use `s.` and :new, the new provider id).
  set?: Record<string, string>;
};

const SERVICE_IDS = `(select m.old_id from _dup_map m where m.kind = 'service')`;

const COPY_ORDER: CopySpec[] = [
  {
    table: "category.provider_services",
    where: "s.service_provider_id = :src",
    mapIds: true,
    remap: ["service_provider_id"],
    set: { rating: "0", review_count: "0", create_date: "now()", last_modified_date: "now()" },
  },
  {
    table: "category.provider_staffs",
    where: "s.service_provider_id = :src",
    mapIds: true,
    remap: ["service_provider_id"],
    set: { create_date: "now()", last_modified_date: "now()" },
  },
  { table: "category.provider_attributes", where: "s.service_provider_id = :src", remap: ["service_provider_id"] },
  { table: "category.provider_policies", where: "s.service_provider_id = :src", remap: ["service_provider_id"] },
  { table: "category.provider_languages", where: "s.service_provider_id = :src", remap: ["service_provider_id"] },
  { table: "category.provider_gallery_items", where: "s.service_provider_id = :src", remap: ["service_provider_id"] },
  { table: "category.provider_certifications", where: "s.service_provider_id = :src", remap: ["service_provider_id"] },
  { table: "category.provider_recommendations", where: "s.source_provider_id = :src", set: { source_provider_id: ":new" } },
  { table: "category.provider_service_gallery_items", where: `s.provider_service_id in ${SERVICE_IDS}`, remap: ["provider_service_id"] },
  { table: "category.service_attribute_values", where: `s.provider_service_id in ${SERVICE_IDS}`, remap: ["provider_service_id"] },
  { table: "category.service_before_after", where: `s.provider_service_id in ${SERVICE_IDS}`, remap: ["provider_service_id"] },
  { table: "category.provider_service_addons", where: `s.provider_service_id in ${SERVICE_IDS}`, remap: ["provider_service_id"] },
  { table: "category.provider_service_meal_plans", where: `s.provider_service_id in ${SERVICE_IDS}`, remap: ["provider_service_id"] },
  { table: "provider_portal.provider_service_addon_settings", where: `s.provider_service_id in ${SERVICE_IDS}`, remap: ["provider_service_id"] },
  { table: "provider_portal.provider_operating_hours", where: "s.service_provider_id = :src", remap: ["service_provider_id"] },
  {
    table: "provider_portal.bookable_resources",
    where: "s.service_provider_id = :src",
    mapIds: true,
    remap: ["service_provider_id", "provider_service_id"],
  },
  {
    // target_id points at a provider, service, resource, staff or provider_staff row
    // depending on target_type; remapping by id covers every case, and staff or
    // service-definition targets keep their id because they are shared.
    table: "provider_portal.generic_availability_rules",
    where: `(s.service_provider_id = :src or s.provider_service_id in ${SERVICE_IDS})`,
    remap: ["service_provider_id", "provider_service_id", "resource_id", "target_id"],
  },
  { table: "gym.membership_plans", where: "s.service_provider_id = :src", remap: ["service_provider_id"] },
  { table: "transfer.routes", where: "s.service_provider_id = :src", remap: ["service_provider_id", "provider_service_id"] },
  {
    table: "tour.departures",
    where: "s.service_provider_id = :src and s.ends_on >= current_date",
    remap: ["service_provider_id", "provider_service_id"],
    set: { booked_count: "0" },
  },
  {
    table: "case_management.process_templates",
    where: `s.scope_type = 'provider_service' and s.provider_service_id in ${SERVICE_IDS}`,
    mapIds: true,
    remap: ["provider_service_id"],
  },
  {
    table: "case_management.process_template_steps",
    where: `s.template_id in (select m.old_id from _dup_map m where m.kind = 'case_management.process_templates')`,
    remap: ["template_id"],
  },
];

async function copyTable(tx: Tx, spec: CopySpec, sourceId: string, newId: string) {
  const [schema, table] = spec.table.split(".");
  const kind = spec.table === "category.provider_services" ? "service" : spec.table;
  // Ids are inlined (checked to be uuids) rather than bound, because most statements
  // use only some of them and Postgres rejects bound parameters it can't type.
  const fill = (text: string) =>
    text.replaceAll(":src", `'${asUuid(sourceId)}'::uuid`).replaceAll(":new", `'${asUuid(newId)}'::uuid`).replaceAll(":kind", `'${kind}'`);
  const columns = await tx.unsafe(
    `select column_name, data_type, column_default
       from information_schema.columns
      where table_schema = $1 and table_name = $2
        and is_generated = 'NEVER' and coalesce(identity_generation, '') <> 'ALWAYS'
      order by ordinal_position`,
    [schema, table],
  );
  if (columns.length === 0) return 0; // table not on this database

  if (spec.mapIds) {
    await tx.unsafe(
      fill(`insert into _dup_map (kind, old_id, new_id)
       select :kind, s.id, public.uuid_generate_v4() from ${spec.table} s where ${spec.where}`),
    );
  }

  const names: string[] = [];
  const values: string[] = [];
  for (const column of columns) {
    const name = column.column_name as string;
    const quoted = `"${name.replace(/"/g, '""')}"`;
    let expr = `s.${quoted}`;
    if (spec.set && name in spec.set) {
      expr = spec.set[name];
    } else if (name === "id") {
      if (spec.mapIds) expr = `(select m.new_id from _dup_map m where m.kind = :kind and m.old_id = s.id)`;
      else if (column.data_type === "uuid") expr = "public.uuid_generate_v4()";
      else if (column.column_default) continue; // serial id: let the default fill it
    } else if (spec.remap?.includes(name)) {
      expr = `coalesce((select m.new_id from _dup_map m where m.old_id = s.${quoted}), s.${quoted})`;
    }
    names.push(quoted);
    values.push(expr);
  }

  const rows = await tx.unsafe(
    fill(`insert into ${spec.table} (${names.join(", ")})
     select ${values.join(", ")} from ${spec.table} s
     where ${spec.where}
     returning 1`),
  );
  return rows.length;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asUuid(value: string) {
  if (!UUID.test(value)) throw new Error(`Not a uuid: ${value}`);
  return value;
}

const TRAILING_NUMBER = /^(.*?)(\d+)$/;

// "Hotel" -> "Hotel2", then "Hotel3"; copying "Hotel2" also gives the next free
// "HotelN". One number is used for every language so the names stay in step.
function pickCopyNames(source: Record<string, string>, taken: Record<string, Set<string>>) {
  const bases: Record<string, string> = {};
  for (const [lang, raw] of Object.entries(source)) {
    const name = (raw ?? "").trim();
    const match = name.match(TRAILING_NUMBER);
    // Only treat the number as a copy suffix if the un-numbered name exists too,
    // so "Clinic 24" stays "Clinic 24" + n rather than becoming "Clinic n".
    bases[lang] = match && match[1].trim() && taken[lang]?.has(match[1]) ? match[1] : name;
  }
  for (let n = 2; ; n++) {
    const clash = Object.entries(bases).some(([lang, base]) => base && taken[lang]?.has(`${base}${n}`));
    if (!clash) {
      return Object.fromEntries(Object.entries(bases).map(([lang, base]) => [lang, base ? `${base}${n}` : base]));
    }
  }
}

export async function duplicateServiceProvider(sourceId: string): Promise<{ id: string; name: Record<string, string> }> {
  return sql.begin(async (rawTx) => {
    const tx = rawTx as unknown as Tx;

    const source = await tx.unsafe(
      `select name_translations from category.service_providers where id = $1 for update`,
      [sourceId],
    );
    if (source.length === 0) throw new Error("Service provider was not found.");

    const all = await tx.unsafe(`select name_translations from category.service_providers`);
    const taken: Record<string, Set<string>> = {};
    for (const row of all) {
      for (const [lang, value] of Object.entries((row.name_translations ?? {}) as Record<string, string>)) {
        (taken[lang] ??= new Set()).add(String(value ?? "").trim());
      }
    }
    const name = pickCopyNames(source[0].name_translations ?? {}, taken);

    await tx.unsafe(
      `create temp table _dup_map (kind text not null, old_id uuid not null, new_id uuid not null) on commit drop`,
    );
    const [{ id: newId }] = await tx.unsafe(`select public.uuid_generate_v4() as id`);
    await tx.unsafe(`insert into _dup_map (kind, old_id, new_id) values ('provider', $1, $2)`, [sourceId, newId]);

    // The provider row itself: new name, starts hidden so an admin can check it
    // before customers see it, and no rating carried over (reviews are not copied).
    await copyTable(
      tx,
      {
        table: "category.service_providers",
        where: "s.id = :src",
        set: {
          id: ":new",
          is_active: "false",
          rating: "0",
          review_count: "0",
          is_sponsored: "false",
          create_date: "now()",
          last_modified_date: "now()",
        },
      },
      sourceId,
      newId,
    );

    await tx.unsafe(`update category.service_providers set name_translations = $1::text::jsonb where id = $2`, [
      JSON.stringify(name),
      newId,
    ]);

    for (const spec of COPY_ORDER) {
      await copyTable(tx, spec, sourceId, newId);
    }

    return { id: newId as string, name };
  });
}
