import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { deleteProviderResourceAction } from "@/features/provider-portal/resource-actions";
import type {
  ProviderResourceConfig,
  ProviderResourceField,
} from "@/features/provider-portal/resource-config";
import type { ProviderResourceRow } from "@/features/provider-portal/server/resource-repository";
import { hasPortalPermission } from "@/features/provider-portal/lib/permissions";
import type { ProviderPortalRole } from "@/features/provider-portal/types";
import {
  tCommon,
  tLabel,
  tResourceGroup,
  tResourceLabel,
} from "@/features/provider-portal/lib/i18n";

function formatValue(
  field: ProviderResourceField | undefined,
  value: any,
  yesLabel = "Yes",
  noLabel = "No",
) {
  if (value === null || value === undefined || value === "") return "-";
  if (field?.type === "boolean") return value ? yesLabel : noLabel;
  if (field?.type === "translations") {
    if (typeof value === "string") return value;
    if (value && typeof value === "object")
      return value["en-US"] || value.en || Object.values(value)[0] || "-";
  }
  if (field?.type === "json")
    return typeof value === "string" ? value : JSON.stringify(value);
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function can(
  role: string,
  config: ProviderResourceConfig,
  mode: "create" | "update" | "delete",
) {
  const permission =
    mode === "create"
      ? config.createPermission || config.permission
      : mode === "update"
        ? config.updatePermission || config.permission
        : config.deletePermission || config.permission;
  return hasPortalPermission(role as ProviderPortalRole, permission);
}

export function ProviderResourceListPage({
  locale,
  providerId,
  config,
  rows,
  role,
}: {
  locale: string;
  providerId: string;
  config: ProviderResourceConfig;
  rows: ProviderResourceRow[];
  role: string;
}) {
  const t = useTranslations("ProviderPortal");
  const base = `/provider-portal/providers/${providerId}/manage/${config.key}`;
  const listFields = config.fields.filter((field) => field.list).slice(0, 7);
  const canCreate = Boolean(config.create && can(role, config, "create"));
  const canUpdate = Boolean(config.update && can(role, config, "update"));
  const canDelete = Boolean(config.delete && can(role, config, "delete"));
  const resourceLabel = tResourceLabel(t, config.key, config.label);
  const resourcePluralLabel = tResourceLabel(
    t,
    config.key,
    config.pluralLabel,
    "pluralLabel",
  );
  const resourceDescription = tResourceLabel(
    t,
    config.key,
    config.description,
    "description",
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {tCommon(t, "providerBackOffice", "Provider back office")} /{" "}
              {tResourceGroup(t, config.group)}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {resourcePluralLabel}
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              {resourceDescription}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-xl px-3 py-1.5">
              {tCommon(t, "recordsCount", "{count} records", {
                count: rows.length,
              })}
            </Badge>
            <Badge variant="secondary" className="rounded-xl px-3 py-1.5">
              {tCommon(t, "roleValue", "role: {role}", { role })}
            </Badge>
            {canCreate ? (
              <Link
                href={`${base}/new`}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                {tCommon(t, "addResource", "Add {resource}", {
                  resource: resourceLabel,
                })}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <Card className="overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/70">
          <CardTitle>{resourcePluralLabel}</CardTitle>
          <CardDescription>
            {tCommon(
              t,
              "providerOwnedRecordsOnly",
              "Provider-owned records only. The server checks provider membership before every list, create, update, and delete.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="bg-white text-xs uppercase tracking-wide text-slate-500">
                  <tr className="border-b border-slate-100">
                    {listFields.map((field) => (
                      <th key={field.name} className="px-5 py-3 font-semibold">
                        {tLabel(t, field.label)}
                      </th>
                    ))}
                    <th className="px-5 py-3 text-right font-semibold">
                      {tCommon(t, "actions", "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      {listFields.map((field) => (
                        <td
                          key={field.name}
                          className="max-w-[260px] truncate px-5 py-4 text-slate-700"
                          title={formatValue(
                            field,
                            row[field.name],
                            tCommon(t, "yes", "Yes"),
                            tCommon(t, "no", "No"),
                          )}
                        >
                          {field.type === "boolean" ? (
                            <Badge
                              variant={
                                row[field.name] ? "default" : "secondary"
                              }
                            >
                              {formatValue(
                                field,
                                row[field.name],
                                tCommon(t, "yes", "Yes"),
                                tCommon(t, "no", "No"),
                              )}
                            </Badge>
                          ) : (
                            formatValue(
                              field,
                              row[field.name],
                              tCommon(t, "yes", "Yes"),
                              tCommon(t, "no", "No"),
                            )
                          )}
                        </td>
                      ))}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {canUpdate ? (
                            <Link
                              href={`${base}/${row.id}/edit`}
                              className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              {tCommon(t, "edit", "Edit")}
                            </Link>
                          ) : null}
                          {canDelete ? (
                            <form action={deleteProviderResourceAction}>
                              <input
                                type="hidden"
                                name="_locale"
                                value={locale}
                              />
                              <input
                                type="hidden"
                                name="_providerId"
                                value={providerId}
                              />
                              <input
                                type="hidden"
                                name="_resource"
                                value={config.key}
                              />
                              <input
                                type="hidden"
                                name="_recordId"
                                value={row.id}
                              />
                              <Button
                                type="submit"
                                variant="destructive"
                                size="sm"
                                className="rounded-xl"
                              >
                                {config.softDeleteColumn
                                  ? tCommon(t, "deactivate", "Deactivate")
                                  : tCommon(t, "delete", "Delete")}
                              </Button>
                            </form>
                          ) : null}
                          {!canUpdate && !canDelete ? (
                            <span className="text-xs text-slate-400">
                              {tCommon(t, "readOnly", "Read only")}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500">
                {tCommon(t, "noRecords", "No records")}
              </div>
              <p className="max-w-md text-sm text-slate-500">
                {tCommon(
                  t,
                  "emptyResourceList",
                  "This provider does not have any {resource} yet.",
                  { resource: resourcePluralLabel.toLowerCase() },
                )}
              </p>
              {canCreate ? (
                <Link
                  href={`${base}/new`}
                  className="inline-flex h-10 items-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
                >
                  {tCommon(t, "createFirstRecord", "Create first record")}
                </Link>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
