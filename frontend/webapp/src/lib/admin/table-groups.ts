import "server-only";

import { getTranslations } from "next-intl/server";

import { getAdminPermissions, permissionForTable } from "./guard";
import { localizeSchemaLabel, localizeTableLabel } from "./label-localization";
import { getResolvedAdminNavigation } from "./metadata";

export type AdminTableLink = {
  /** `${schema}.${table}` — stable React key and search haystack. */
  key: string;
  href: string;
  label: string;
  /** Raw `schema.table`, shown under the label and always LTR. */
  qualified: string;
};

export type AdminTableGroup = {
  schema: string;
  label: string;
  tables: AdminTableLink[];
};

/**
 * The metadata-driven table browser, localized and filtered to what the caller
 * may read.
 *
 * `getResolvedAdminNavigation()` labels every table with `inferFieldLabel()` —
 * a humanizer that turns `booking_addons` into "Booking Addons" — and the schema
 * headings were the raw Postgres names. `label-localization.ts` exists to map
 * both through the `AdminTable` (218 entries) and `AdminSchema` (14 entries)
 * message namespaces, which are fully translated in all eleven locales, but it
 * had no callers at all: the module was written and never wired in, so a Persian
 * admin read "Provider Attribute Definition Domain Options" on a Persian page.
 *
 * Shared by the `/admin` browser page and the sidebar so the two can never drift
 * apart. `getResolvedAdminNavigation` memoises its table definitions in-process,
 * so calling this from the layout on every admin page is cheap after the first.
 */
export async function getAdminTableGroups(): Promise<AdminTableGroup[]> {
  const [navigation, permissions, tTable, tSchema] = await Promise.all([
    getResolvedAdminNavigation(),
    getAdminPermissions(),
    getTranslations("AdminTable"),
    getTranslations("AdminSchema"),
  ]);

  const readable = navigation.filter(
    (item) => permissionForTable(permissions, item.schema, item.table)?.canRead
  );

  const bySchema = new Map<string, AdminTableLink[]>();
  for (const item of readable) {
    const link: AdminTableLink = {
      key: `${item.schema}.${item.table}`,
      href: `/admin/${item.schema}/${item.table}`,
      label: localizeTableLabel(tTable, item.table, item.label),
      qualified: `${item.schema}.${item.table}`,
    };
    const bucket = bySchema.get(item.schema);
    if (bucket) bucket.push(link);
    else bySchema.set(item.schema, [link]);
  }

  return [...bySchema.entries()]
    .map(([schema, tables]) => ({
      schema,
      label: localizeSchemaLabel(tSchema, schema),
      tables: tables.sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
