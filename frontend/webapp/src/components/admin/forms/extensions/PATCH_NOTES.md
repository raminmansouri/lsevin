# Additive extension patch for dependent relation fields + custom field/cell registries

This patch adds a safe extension layer without changing your working CRUD flow.

## New files

- `src/lib/admin/extensions/dependent-relations.ts`
- `src/lib/admin/extensions/form-and-table-renderers.tsx`
- `src/components/admin/forms/extensions/async-searchable-single-select.tsx`
- `src/components/admin/forms/extensions/dependent-relation-field.tsx`
- `src/app/api/admin/relation-cascade-options/route.ts`

## What it gives you

- `booking.bookings.service_id` can now depend on `provider_id`
- one extension point for custom form fields per `schema.table.column`
- one extension point for custom datatable cells per `schema.table.column`
- future multi-parent chains like category -> provider -> service by config, not switch statements

## Minimal edits to existing files

### 1) `src/components/admin/forms/dynamic-form.tsx`

Add import:

```ts
import { resolveAdminFormFieldExtension } from "@/lib/admin/extensions/form-and-table-renderers";
```

Inside `renderField(field)` add this near the top, after the hidden/id check and before built-in kind checks:

```ts
const customField = resolveAdminFormFieldExtension({
  definition,
  field,
  form,
  locale,
  mode,
  values,
});

if (customField) {
  return <div key={field.columnName}>{customField}</div>;
}
```

### 2) `src/components/admin/table/dynamic-data-table.tsx`

Add import:

```ts
import { resolveAdminTableCellExtension } from "@/lib/admin/extensions/form-and-table-renderers";
```

Inside the column cell renderer, before your existing default formatting, add:

```ts
const customCell = resolveAdminTableCellExtension({
  definition,
  field,
  row: row.original,
  value,
});

if (customCell) {
  return customCell;
}
```

Use your existing `value` variable from the cell function.

### 3) `src/lib/db.ts`

If you do **not** already have a postgres.js client exported from `@/lib/db`, add one like this:

```ts
import postgres from "postgres";

export const db = postgres(process.env.DATABASE_URL!, {
  prepare: false,
});
```

If your project already has a client somewhere else, only change the import in:

- `src/app/api/admin/relation-cascade-options/route.ts`

## How to add more dependent fields later

Edit `src/lib/admin/extensions/dependent-relations.ts` and add more entries.

Example shape:

```ts
"schema.table.column": {
  key: "schema.table.column",
  schema: "target_schema",
  table: "target_table",
  valueColumn: "id",
  labelColumn: "name_translations",
  labelMode: "translation",
  parentFilters: [
    {
      parentField: "provider_id",
      targetColumn: "service_provider_id",
      required: true,
    },
  ],
}
```

## Multi-level chains

You do **not** need one special 3-level component.

Configure each step independently:

- provider field depends on category field
- service field depends on provider field

That keeps the system open for extension and avoids hardcoding category/provider/service into the core builder.
