import "server-only";

import { AdminNotFoundError } from "./errors";
import { runListQuery } from "./list-query";
import { getResolvedTableDefinition } from "./metadata";
import { getRecordById } from "./record-query";
import {
  ListQueryResult,
  ResolvedChildCollectionDefinition,
  ResolvedTableDefinition,
} from "./types";

export type ChildCollectionPanel = {
  collection: ResolvedChildCollectionDefinition;
  childDefinition: ResolvedTableDefinition;
  parentLinkValue: unknown;
  initialResult: ListQueryResult;
};

export async function resolveChildCollection(args: {
  parentSchema: string;
  parentTable: string;
  childSchema: string;
  childTable: string;
  foreignKeyColumn?: string;
}) {
  const parentDefinition = await getResolvedTableDefinition({
    schema: args.parentSchema,
    table: args.parentTable,
  });

  if (!parentDefinition) {
    throw new AdminNotFoundError(`Parent table ${args.parentSchema}.${args.parentTable} not found.`);
  }

  const match = parentDefinition.childCollections.find((collection) =>
    collection.schema === args.childSchema &&
    collection.table === args.childTable &&
    (!args.foreignKeyColumn || collection.foreignKeyColumn === args.foreignKeyColumn)
  );

  if (!match) {
    throw new AdminNotFoundError(
      `No one-to-many child relation from ${args.parentSchema}.${args.parentTable} to ${args.childSchema}.${args.childTable}.`
    );
  }

  return {
    parentDefinition,
    collection: match,
  };
}

export async function getParentLinkValue(args: {
  parentSchema: string;
  parentTable: string;
  parentRecordId: string | number;
  collection: ResolvedChildCollectionDefinition;
}) {
  const parentDefinition = await getResolvedTableDefinition({
    schema: args.parentSchema,
    table: args.parentTable,
  });

  if (!parentDefinition?.primaryKey) {
    throw new AdminNotFoundError("Parent primary key metadata not found.");
  }

  const record = await getRecordById(args.parentSchema, args.parentTable, args.parentRecordId);
  if (!record) {
    throw new AdminNotFoundError("Parent record not found.");
  }

  return {
    parentDefinition,
    parentRecord: record,
    value: record[args.collection.parentColumn],
  };
}

export async function getChildCollectionPanels(args: {
  parentSchema: string;
  parentTable: string;
  parentRecordId: string | number;
  locale: string;
}): Promise<ChildCollectionPanel[]> {
  const parentDefinition = await getResolvedTableDefinition({
    schema: args.parentSchema,
    table: args.parentTable,
  });

  if (!parentDefinition?.primaryKey) {
    return [];
  }

  const parentRecord = await getRecordById(args.parentSchema, args.parentTable, args.parentRecordId);
  if (!parentRecord) {
    return [];
  }

  const panels: ChildCollectionPanel[] = [];

  for (const collection of parentDefinition.childCollections) {
    const childDefinition = await getResolvedTableDefinition({
      schema: collection.schema,
      table: collection.table,
    });

    if (!childDefinition) continue;

    const parentLinkValue = parentRecord[collection.parentColumn];
    const sortField = collection.defaultSort?.field ?? childDefinition.defaultSort.field;
    const sortDirection = collection.defaultSort?.direction ?? childDefinition.defaultSort.direction;

    const initialResult = await runListQuery(
      { schema: collection.schema, table: collection.table },
      {
        page: 1,
        pageSize: collection.pageSize,
        sortField,
        sortDirection,
        filters: [
          {
            field: collection.foreignKeyColumn,
            op: "eq",
            value: parentLinkValue,
          },
        ],
      },
      args.locale
    );

    panels.push({
      collection,
      childDefinition,
      parentLinkValue,
      initialResult,
    });
  }

  return panels;
}

export async function assertChildRecordBelongsToParent(args: {
  parentSchema: string;
  parentTable: string;
  parentRecordId: string | number;
  childSchema: string;
  childTable: string;
  childRecordId: string | number;
  foreignKeyColumn?: string;
}) {
  const { collection } = await resolveChildCollection({
    parentSchema: args.parentSchema,
    parentTable: args.parentTable,
    childSchema: args.childSchema,
    childTable: args.childTable,
    foreignKeyColumn: args.foreignKeyColumn,
  });

  const [{ value: parentLinkValue }, childRecord] = await Promise.all([
    getParentLinkValue({
      parentSchema: args.parentSchema,
      parentTable: args.parentTable,
      parentRecordId: args.parentRecordId,
      collection,
    }),
    getRecordById(args.childSchema, args.childTable, args.childRecordId),
  ]);

  if (!childRecord) {
    throw new AdminNotFoundError("Child record not found.");
  }

  if (String(childRecord[collection.foreignKeyColumn] ?? "") !== String(parentLinkValue ?? "")) {
    throw new AdminNotFoundError("Child record does not belong to the parent record.");
  }

  return {
    collection,
    childRecord,
    parentLinkValue,
  };
}
