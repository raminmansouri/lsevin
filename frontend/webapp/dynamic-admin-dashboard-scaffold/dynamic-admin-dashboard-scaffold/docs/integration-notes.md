# Final integration notes

## 1. Keep your current metadata core
This scaffold assumes you already have:

- `db-introspection.ts`
- `db-builder-enums.ts`
- `db-crud.ts`
- `permissions.ts`

Those files are copied into `lib/admin/core`.

## 2. Replace auth placeholder
Update `lib/admin/auth.ts` so `getAdminSession()` returns the real authenticated user id and preferred admin locale.

## 3. Mount the admin route
This scaffold assumes your route root is `/admin`.

## 4. Styling
The UI uses Tailwind utility classes directly. You can gradually replace these with your design-system primitives.

## 5. Relation labels
For many-to-one fields, relation selectors use introspected FK metadata and a configured or inferred display field.

## 6. Multilingual support
JSONB columns ending in `_translations` are treated as multilingual fields.
The list query tries to use:

`common.get_translation(jsonb, preferred_language, fallback_language)`

If that function exists in your database, localized rendering works cleanly. If not, replace the SQL fragment in `lib/admin/list-query.ts`.

## 7. Many-to-many support
Many-to-many relationships usually need intent that cannot be inferred safely from the database alone.
Use override config:

```ts
columns: {
  tag_ids: {
    fieldKind: "many-to-many",
    manyToMany: {
      junctionSchema: "category",
      junctionTable: "service_tags",
      sourceForeignKey: "service_id",
      targetForeignKey: "tag_id",
      targetSchema: "category",
      targetTable: "tags",
      targetDisplayField: "name_translations",
    },
  },
}
```

## 8. One-to-many inline children
This scaffold leaves one-to-many editing override-driven.
That is deliberate. Automatic inline editing for child tables is possible, but it becomes dangerous without business rules around:
- orphan behavior
- ordering
- child validation
- partial save semantics

## 9. Export
The table component is ready for adding CSV export. The cleanest production approach is:
- reuse `runListQuery`
- expose `/api/admin/export`
- stream CSV server-side
- respect same permission and filter pipeline

## 10. Audit fields
The resolver already marks PK/generated/identity fields readonly.
You can additionally hide or lock:
- created_at
- updated_at
- created_by
- updated_by

through `adminOverrides`.
