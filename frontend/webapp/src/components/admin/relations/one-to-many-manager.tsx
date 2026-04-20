"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { Plus, Pencil, RefreshCw, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { DynamicForm } from "@/components/admin/forms/dynamic-form";
import {
  ListQueryResult,
  ResolvedChildCollectionDefinition,
  ResolvedTableDefinition,
} from "@/lib/admin/types";
import { createChildRecordAction, deleteChildRecordAction, updateChildRecordAction } from "@/app/[locale]/(admin)/admin/_actions";
// import {
//   createChildRecordAction,
//   deleteChildRecordAction,
//   updateChildRecordAction,
// } from "@/app/(admin)/admin/_actions";

type ChildCollectionPanel = {
  collection: ResolvedChildCollectionDefinition;
  childDefinition: ResolvedTableDefinition;
  initialResult: ListQueryResult;
};

type Props = {
  parentSchema: string;
  parentTable: string;
  parentRecordId: string;
  locale: string;
  panels: ChildCollectionPanel[];
};

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; childRecordId: string; record?: Record<string, unknown> }
  | null;

function pickListFields(
  collection: ResolvedChildCollectionDefinition,
  definition: ResolvedTableDefinition
) {
  if (!collection.listColumns?.length) return definition.listFields;
  const allowed = new Set(collection.listColumns);
  const filtered = definition.listFields.filter((field) => allowed.has(field.columnName));
  return filtered.length > 0 ? filtered : definition.listFields;
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-2xl border border-zinc-200 p-2 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ChildCollectionCard({
  parentSchema,
  parentTable,
  parentRecordId,
  locale,
  panel,
}: {
  parentSchema: string;
  parentTable: string;
  parentRecordId: string;
  locale: string;
  panel: ChildCollectionPanel;
}) {
  const [result, setResult] = useState<ListQueryResult>(panel.initialResult);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [pendingDelete, startDeleteTransition] = useTransition();

  const listFields = useMemo(
    () => pickListFields(panel.collection, panel.childDefinition),
    [panel.collection, panel.childDefinition]
  );

  async function refresh(next?: { q?: string; page?: number }) {
    const url = new URL("/api/admin/child-collection", window.location.origin);
    url.searchParams.set("parentSchema", parentSchema);
    url.searchParams.set("parentTable", parentTable);
    url.searchParams.set("parentRecordId", parentRecordId);
    url.searchParams.set("childSchema", panel.collection.schema);
    url.searchParams.set("childTable", panel.collection.table);
    url.searchParams.set("foreignKeyColumn", panel.collection.foreignKeyColumn);
    url.searchParams.set("locale", locale);
    url.searchParams.set("page", String(next?.page ?? result.page));
    url.searchParams.set("pageSize", String(result.pageSize));
    if ((next?.q ?? query).trim()) {
      url.searchParams.set("q", (next?.q ?? query).trim());
    }

    const response = await fetch(url.toString(), { cache: "no-store" });
    const data = await response.json();

    if (!data.ok) {
      toast.error(data.message ?? "Failed to load related records.");
      return;
    }

    setResult(data.result);
  }

  async function openEdit(childRecordId: string) {
    setLoadingRecord(true);
    try {
      const url = new URL("/api/admin/child-record", window.location.origin);
      url.searchParams.set("parentSchema", parentSchema);
      url.searchParams.set("parentTable", parentTable);
      url.searchParams.set("parentRecordId", parentRecordId);
      url.searchParams.set("childSchema", panel.collection.schema);
      url.searchParams.set("childTable", panel.collection.table);
      url.searchParams.set("childRecordId", childRecordId);
      url.searchParams.set("foreignKeyColumn", panel.collection.foreignKeyColumn);

      const response = await fetch(url.toString(), { cache: "no-store" });
      const data = await response.json();
      if (!data.ok) {
        toast.error(data.message ?? "Failed to load related record.");
        return;
      }

      setModal({ mode: "edit", childRecordId, record: data.record });
    } finally {
      setLoadingRecord(false);
    }
  }

  async function handleDelete(childRecordId: string) {
    const confirmed = window.confirm(`Delete this ${panel.childDefinition.label.toLowerCase()} record?`);
    if (!confirmed) return;

    startDeleteTransition(async () => {
      const action = await deleteChildRecordAction({
        parentSchema,
        parentTable,
        parentRecordId,
        childSchema: panel.collection.schema,
        childTable: panel.collection.table,
        childRecordId,
        foreignKeyColumn: panel.collection.foreignKeyColumn,
      });

      if (action.ok) {
        toast.success(action.message ?? "Deleted successfully.");
        await refresh({ page: 1 });
      } else {
        toast.error(action.message ?? "Delete failed.");
      }
    });
  }

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{panel.collection.label}</h3>
          {panel.collection.description ? (
            <p className="mt-1 text-sm text-zinc-500">{panel.collection.description}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 px-3 py-2 dark:border-zinc-800">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  refresh({ q: query, page: 1 });
                }
              }}
              placeholder={`Search ${panel.collection.label.toLowerCase()}...`}
              className="bg-transparent text-sm outline-none"
            />
          </div>

          <button
            onClick={() => refresh({ q: query, page: 1 })}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          {panel.collection.allowCreate ? (
            <button
              onClick={() => setModal({ mode: "create" })}
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-white dark:text-zinc-950"
            >
              <Plus className="h-4 w-4" />
              Add {panel.childDefinition.label}
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-950">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              {listFields.map((field) => (
                <th key={field.columnName} className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">
                  {field.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr>
                <td colSpan={listFields.length + 1} className="px-4 py-10 text-center text-zinc-500">
                  No related records found.
                </td>
              </tr>
            ) : (
              result.rows.map((row, index) => (
                <tr key={String(row.__pk ?? index)} className="border-b border-zinc-100 dark:border-zinc-800">
                  {listFields.map((field) => {
                    const display = row[`${field.columnName}__label`] ?? row[field.columnName];
                    return (
                      <td key={field.columnName} className="max-w-[260px] px-4 py-3 align-top">
                        {display === null || display === undefined || display === "" ? (
                          <span className="text-zinc-400">—</span>
                        ) : (
                          <span className="truncate">{String(display)}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {panel.collection.allowEdit ? (
                        <button
                          onClick={() => openEdit(String(row.__pk))}
                          className="rounded-2xl border border-zinc-200 p-2 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                      {panel.collection.allowDelete ? (
                        <button
                          disabled={pendingDelete}
                          onClick={() => handleDelete(String(row.__pk))}
                          className="rounded-2xl border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
        <div>
          {result.total} total · Page {result.page} of {result.pageCount}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={result.page <= 1}
            onClick={() => refresh({ page: result.page - 1 })}
            className="rounded-2xl border border-zinc-200 px-3 py-2 disabled:opacity-50 dark:border-zinc-800"
          >
            Prev
          </button>
          <button
            disabled={result.page >= result.pageCount}
            onClick={() => refresh({ page: result.page + 1 })}
            className="rounded-2xl border border-zinc-200 px-3 py-2 disabled:opacity-50 dark:border-zinc-800"
          >
            Next
          </button>
        </div>
      </div>

      {modal ? (
        <ModalShell
          title={modal.mode === "create" ? `Add ${panel.childDefinition.label}` : `Edit ${panel.childDefinition.label}`}
          onClose={() => setModal(null)}
        >
          {modal.mode === "edit" && !modal.record ? (
            <div className="py-10 text-center text-sm text-zinc-500">
              {loadingRecord ? "Loading record..." : "Record could not be loaded."}
            </div>
          ) : (
            <DynamicForm
              definition={panel.childDefinition}
              locale={locale}
              mode={modal.mode}
              initialValues={modal.mode === "edit" ? (modal.record as Record<string, any>) : undefined}
              excludeFields={[panel.collection.foreignKeyColumn]}
              submitLabel={modal.mode === "create" ? `Add ${panel.childDefinition.label}` : `Save ${panel.childDefinition.label}`}
              onSubmitAction={async (values) => {
                if (modal.mode === "create") {
                  return createChildRecordAction({
                    parentSchema,
                    parentTable,
                    parentRecordId,
                    childSchema: panel.collection.schema,
                    childTable: panel.collection.table,
                    values,
                    foreignKeyColumn: panel.collection.foreignKeyColumn,
                  });
                }

                return updateChildRecordAction({
                  parentSchema,
                  parentTable,
                  parentRecordId,
                  childSchema: panel.collection.schema,
                  childTable: panel.collection.table,
                  childRecordId: modal.childRecordId,
                  values,
                  foreignKeyColumn: panel.collection.foreignKeyColumn,
                });
              }}
              onSuccess={() => {
                setModal(null);
                refresh({ page: 1 });
              }}
            />
          )}
        </ModalShell>
      ) : null}
    </section>
  );
}

export function OneToManyManager({
  parentSchema,
  parentTable,
  parentRecordId,
  locale,
  panels,
}: Props) {
  if (panels.length === 0) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Related Records</h2>
        <p className="mt-1 text-sm text-zinc-500">
          View and manage one-to-many child records without leaving the parent edit page.
        </p>
      </div>

      {panels.map((panel) => (
        <ChildCollectionCard
          key={panel.collection.key}
          parentSchema={parentSchema}
          parentTable={parentTable}
          parentRecordId={parentRecordId}
          locale={locale}
          panel={panel}
        />
      ))}
    </div>
  );
}
