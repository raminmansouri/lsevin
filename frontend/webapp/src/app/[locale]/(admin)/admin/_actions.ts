"use server";

import { revalidatePath } from "next/cache";
import { assertAdminPermission } from "@/lib/admin/guard";
import { getAdminSql } from "@/lib/admin/db";
import { deleteRows, insert, update, insertBulk } from "@/lib/admin/core/db-crud";
import { getResolvedTableDefinition } from "@/lib/admin/metadata";

export async function createRecordAction(args: {
  schema: string;
  table: string;
  values: Record<string, unknown>;
}) {
  try {
    await assertAdminPermission(args.schema, args.table, "create");
    const sql = getAdminSql();
    const definition = await getResolvedTableDefinition({ schema: args.schema, table: args.table });

    if (!definition) {
      return { ok: false, message: "Table metadata not found." };
    }

    const baseValues = { ...args.values };

    for (const field of definition.formFields) {
      if (field.manyToMany) {
        delete baseValues[field.columnName];
      }
    }

    const inserted = await insert(
      sql,
      { schema: args.schema, table: args.table },
      baseValues,
      { returning: "*" }
    );

    const row = inserted[0];
    const primaryKey = definition.primaryKey;
    const newId = primaryKey ? row?.[primaryKey] : null;

    if (newId) {
      for (const field of definition.formFields) {
        if (!field.manyToMany) continue;
        const values = Array.isArray(args.values[field.columnName]) ? (args.values[field.columnName] as string[]) : [];
        const junction = field.manyToMany;

        if (values.length > 0) {
          await insertBulk(
            sql,
            { schema: junction.junctionSchema, table: junction.junctionTable },
            values.map((value) => ({
              [junction.sourceForeignKey]: newId,
              [junction.targetForeignKey]: value,
            }))
          );
        }
      }
    }

    revalidatePath(`/admin/${args.schema}/${args.table}`);
    return { ok: true, message: "Record created successfully." };
  } catch (error: any) {
    return { ok: false, message: error?.message ?? "Create failed." };
  }
}

export async function updateRecordAction(args: {
  schema: string;
  table: string;
  id: string;
  values: Record<string, unknown>;
}) {
  try {
    await assertAdminPermission(args.schema, args.table, "update");
    const sql = getAdminSql();
    const definition = await getResolvedTableDefinition({ schema: args.schema, table: args.table });

    if (!definition?.primaryKey) {
      return { ok: false, message: "Primary key metadata not found." };
    }

    const baseValues = { ...args.values };

    for (const field of definition.formFields) {
      if (field.manyToMany) {
        delete baseValues[field.columnName];
      }
    }

    await update(
      sql,
      { schema: args.schema, table: args.table },
      baseValues,
      { [definition.primaryKey]: args.id },
      { returning: "*" }
    );

    for (const field of definition.formFields) {
      if (!field.manyToMany) continue;
      const values = Array.isArray(args.values[field.columnName]) ? (args.values[field.columnName] as string[]) : [];
      const junction = field.manyToMany;

      await deleteRows(sql, { schema: junction.junctionSchema, table: junction.junctionTable }, {
        [junction.sourceForeignKey]: args.id,
      });

      if (values.length > 0) {
        await insertBulk(
          sql,
          { schema: junction.junctionSchema, table: junction.junctionTable },
          values.map((value) => ({
            [junction.sourceForeignKey]: args.id,
            [junction.targetForeignKey]: value,
          }))
        );
      }
    }

    revalidatePath(`/admin/${args.schema}/${args.table}`);
    revalidatePath(`/admin/${args.schema}/${args.table}/${args.id}`);
    return { ok: true, message: "Record updated successfully." };
  } catch (error: any) {
    return { ok: false, message: error?.message ?? "Update failed." };
  }
}

export async function deleteRecordAction(args: {
  schema: string;
  table: string;
  id: string;
}) {
  try {
    await assertAdminPermission(args.schema, args.table, "delete");
    const sql = getAdminSql();
    const definition = await getResolvedTableDefinition({ schema: args.schema, table: args.table });

    if (!definition?.primaryKey) {
      return { ok: false, message: "Primary key metadata not found." };
    }

    await deleteRows(sql, { schema: args.schema, table: args.table }, {
      [definition.primaryKey]: args.id,
    });

    revalidatePath(`/admin/${args.schema}/${args.table}`);
    return { ok: true, message: "Record deleted successfully." };
  } catch (error: any) {
    return { ok: false, message: error?.message ?? "Delete failed." };
  }
}
