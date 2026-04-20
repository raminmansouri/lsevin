"use server";

import { revalidatePath } from "next/cache";
import { assertAdminPermission } from "@/lib/admin/guard";
import { getAdminSql } from "@/lib/admin/db";
import { deleteRows, insert, update, insertBulk } from "@/lib/admin/core/db-crud";
import { getResolvedTableDefinition } from "@/lib/admin/metadata";
import {
  assertChildRecordBelongsToParent,
  getParentLinkValue,
  resolveChildCollection,
} from "@/lib/admin/child-relations";


async function syncManyToManyFields(args: {
  sql: ReturnType<typeof getAdminSql>;
  definition: NonNullable<Awaited<ReturnType<typeof getResolvedTableDefinition>>>;
  values: Record<string, unknown>;
  recordId: string | number;
}) {
  for (const field of args.definition.formFields) {
    if (!field.manyToMany) continue;

    const values = Array.isArray(args.values[field.columnName])
      ? (args.values[field.columnName] as string[])
      : [];
    const junction = field.manyToMany;

    await deleteRows(args.sql, { schema: junction.junctionSchema, table: junction.junctionTable }, {
      [junction.sourceForeignKey]: args.recordId,
    });

    if (values.length > 0) {
      await insertBulk(
        args.sql,
        { schema: junction.junctionSchema, table: junction.junctionTable },
        values.map((value) => ({
          [junction.sourceForeignKey]: args.recordId,
          [junction.targetForeignKey]: value,
        }))
      );
    }
  }
}

function childEditPath(args: {
  parentSchema: string;
  parentTable: string;
  parentRecordId: string | number;
}) {
  return `/admin/${args.parentSchema}/${args.parentTable}/${args.parentRecordId}/edit`;
}

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
      await syncManyToManyFields({
        sql,
        definition,
        values: args.values,
        recordId: newId,
      });
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

    await syncManyToManyFields({
      sql,
      definition,
      values: args.values,
      recordId: args.id,
    });

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

export async function getChildRecordAction(args: {
  parentSchema: string;
  parentTable: string;
  parentRecordId: string;
  childSchema: string;
  childTable: string;
  childRecordId: string;
  foreignKeyColumn?: string;
}) {
  try {
    await assertAdminPermission(args.childSchema, args.childTable, "single");
    const { childRecord } = await assertChildRecordBelongsToParent({
      parentSchema: args.parentSchema,
      parentTable: args.parentTable,
      parentRecordId: args.parentRecordId,
      childSchema: args.childSchema,
      childTable: args.childTable,
      childRecordId: args.childRecordId,
      foreignKeyColumn: args.foreignKeyColumn,
    });

    return { ok: true, record: childRecord as Record<string, unknown> };
  } catch (error: any) {
    return { ok: false, message: error?.message ?? "Failed to load child record." };
  }
}

export async function createChildRecordAction(args: {
  parentSchema: string;
  parentTable: string;
  parentRecordId: string;
  childSchema: string;
  childTable: string;
  values: Record<string, unknown>;
  foreignKeyColumn?: string;
}) {
  try {
    await assertAdminPermission(args.childSchema, args.childTable, "create");
    const sql = getAdminSql();
    const relation = await resolveChildCollection({
      parentSchema: args.parentSchema,
      parentTable: args.parentTable,
      childSchema: args.childSchema,
      childTable: args.childTable,
      foreignKeyColumn: args.foreignKeyColumn,
    });
    const [childDefinition, parentLink] = await Promise.all([
      getResolvedTableDefinition({ schema: args.childSchema, table: args.childTable }),
      getParentLinkValue({
        parentSchema: args.parentSchema,
        parentTable: args.parentTable,
        parentRecordId: args.parentRecordId,
        collection: relation.collection,
      }),
    ]);
    const { collection } = relation;

    if (!childDefinition) {
      return { ok: false, message: "Child metadata not found." };
    }

    const payload = {
      ...args.values,
      [collection.foreignKeyColumn]: parentLink.value,
    };

    for (const field of childDefinition.formFields) {
      if (field.manyToMany) {
        delete payload[field.columnName];
      }
    }

    const inserted = await insert(sql, { schema: args.childSchema, table: args.childTable }, payload, { returning: "*" });
    const childRow = inserted[0];
    const childId = childDefinition.primaryKey ? childRow?.[childDefinition.primaryKey] : null;

    if (childId) {
      await syncManyToManyFields({
        sql,
        definition: childDefinition,
        values: args.values,
        recordId: childId,
      });
    }

    revalidatePath(`/admin/${args.childSchema}/${args.childTable}`);
    revalidatePath(childEditPath(args));
    return { ok: true, message: `${childDefinition.label} created successfully.` };
  } catch (error: any) {
    return { ok: false, message: error?.message ?? "Create failed." };
  }
}

export async function updateChildRecordAction(args: {
  parentSchema: string;
  parentTable: string;
  parentRecordId: string;
  childSchema: string;
  childTable: string;
  childRecordId: string;
  values: Record<string, unknown>;
  foreignKeyColumn?: string;
}) {
  try {
    await assertAdminPermission(args.childSchema, args.childTable, "update");
    const sql = getAdminSql();
    const [{ collection, parentLinkValue }, childDefinition] = await Promise.all([
      assertChildRecordBelongsToParent({
        parentSchema: args.parentSchema,
        parentTable: args.parentTable,
        parentRecordId: args.parentRecordId,
        childSchema: args.childSchema,
        childTable: args.childTable,
        childRecordId: args.childRecordId,
        foreignKeyColumn: args.foreignKeyColumn,
      }),
      getResolvedTableDefinition({ schema: args.childSchema, table: args.childTable }),
    ]);

    if (!childDefinition?.primaryKey) {
      return { ok: false, message: "Child primary key metadata not found." };
    }

    const payload = {
      ...args.values,
      [collection.foreignKeyColumn]: parentLinkValue,
    };

    for (const field of childDefinition.formFields) {
      if (field.manyToMany) {
        delete payload[field.columnName];
      }
    }

    await update(
      sql,
      { schema: args.childSchema, table: args.childTable },
      payload,
      { [childDefinition.primaryKey]: args.childRecordId },
      { returning: "*" }
    );

    await syncManyToManyFields({
      sql,
      definition: childDefinition,
      values: args.values,
      recordId: args.childRecordId,
    });

    revalidatePath(`/admin/${args.childSchema}/${args.childTable}`);
    revalidatePath(childEditPath(args));
    return { ok: true, message: `${childDefinition.label} updated successfully.` };
  } catch (error: any) {
    return { ok: false, message: error?.message ?? "Update failed." };
  }
}

export async function deleteChildRecordAction(args: {
  parentSchema: string;
  parentTable: string;
  parentRecordId: string;
  childSchema: string;
  childTable: string;
  childRecordId: string;
  foreignKeyColumn?: string;
}) {
  try {
    await assertAdminPermission(args.childSchema, args.childTable, "delete");
    const sql = getAdminSql();
    const [ownership, childDefinition] = await Promise.all([
      assertChildRecordBelongsToParent({
        parentSchema: args.parentSchema,
        parentTable: args.parentTable,
        parentRecordId: args.parentRecordId,
        childSchema: args.childSchema,
        childTable: args.childTable,
        childRecordId: args.childRecordId,
        foreignKeyColumn: args.foreignKeyColumn,
      }),
      getResolvedTableDefinition({ schema: args.childSchema, table: args.childTable }),
    ]);

    if (!childDefinition?.primaryKey) {
      return { ok: false, message: "Child primary key metadata not found." };
    }

    await deleteRows(
      sql,
      { schema: args.childSchema, table: args.childTable },
      { [childDefinition.primaryKey]: ownership.childRecord[childDefinition.primaryKey] }
    );

    revalidatePath(`/admin/${args.childSchema}/${args.childTable}`);
    revalidatePath(childEditPath(args));
    return { ok: true, message: `${childDefinition.label} deleted successfully.` };
  } catch (error: any) {
    return { ok: false, message: error?.message ?? "Delete failed." };
  }
}
