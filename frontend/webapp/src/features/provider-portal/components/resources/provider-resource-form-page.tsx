import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import {
  createProviderResourceAction,
  updateProviderResourceAction,
} from "@/features/provider-portal/resource-actions";
import type {
  ProviderResourceConfig,
  ProviderResourceField,
} from "@/features/provider-portal/resource-config";
import type {
  ProviderResourceOption,
  ProviderResourceRow,
} from "@/features/provider-portal/server/resource-repository";
import {
  tCommon,
  tLabel,
  tMessage,
  tResourceGroup,
  tResourceLabel,
} from "@/features/provider-portal/lib/i18n";

function stringifyInitial(field: ProviderResourceField, value: any) {
  if (value === null || value === undefined) return "";
  if (field.type === "translations" || field.type === "json")
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  if (field.type === "csv")
    return Array.isArray(value) ? value.join(", ") : String(value);
  if (field.type === "datetime" && typeof value === "string")
    return value.slice(0, 16).replace(" ", "T");
  return String(value);
}

function FieldControl({
  field,
  value,
  options,
  selectPlaceholder,
}: {
  field: ProviderResourceField;
  value: any;
  options?: ProviderResourceOption[];
  selectPlaceholder: string;
}) {
  const initial = stringifyInitial(field, value);
  const common = {
    name: field.name,
    id: field.name,
    required: field.required,
    disabled: field.readOnly,
  };

  if (
    field.type === "textarea" ||
    field.type === "translations" ||
    field.type === "json"
  ) {
    return (
      <Textarea
        {...common}
        defaultValue={initial}
        rows={field.type === "textarea" ? 4 : 8}
        className="rounded-xl font-mono text-sm"
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
        <input
          type="checkbox"
          name={field.name}
          defaultChecked={Boolean(value)}
          disabled={field.readOnly}
          className="h-4 w-4 rounded border-slate-300"
        />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.type === "select") {
    const selectOptions = field.options || options || [];
    return (
      <select
        {...common}
        defaultValue={initial}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
      >
        <option value="">{selectPlaceholder}</option>
        {selectOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  const type =
    field.type === "number"
      ? "number"
      : field.type === "date"
        ? "date"
        : field.type === "datetime"
          ? "datetime-local"
          : field.type === "time"
            ? "time"
            : "text";
  return (
    <Input
      {...common}
      type={type}
      step={field.type === "number" ? "any" : undefined}
      defaultValue={initial}
      className="rounded-xl"
    />
  );
}

export function ProviderResourceFormPage({
  locale,
  providerId,
  config,
  row,
  options,
}: {
  locale: string;
  providerId: string;
  config: ProviderResourceConfig;
  row?: ProviderResourceRow | null;
  options: Record<string, ProviderResourceOption[]>;
}) {
  const t = useTranslations("ProviderPortal");
  const isEdit = Boolean(row?.id);
  const base = `/provider-portal/providers/${providerId}/manage/${config.key}`;
  const resourceLabel = tResourceLabel(t, config.key, config.label);
  const resourceDescription = tResourceLabel(
    t,
    config.key,
    config.description,
    "description",
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          {tCommon(t, "providerBackOffice", "Provider back office")} /{" "}
          {tResourceGroup(t, config.group)}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          {isEdit
            ? tCommon(t, "editResource", "Edit {resource}", {
                resource: resourceLabel,
              })
            : tCommon(t, "addResource", "Add {resource}", {
                resource: resourceLabel,
              })}
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {resourceDescription}
        </p>
      </section>

      <form
        action={
          isEdit ? updateProviderResourceAction : createProviderResourceAction
        }
      >
        <input type="hidden" name="_locale" value={locale} />
        <input type="hidden" name="_providerId" value={providerId} />
        <input type="hidden" name="_resource" value={config.key} />
        {row?.id ? (
          <input type="hidden" name="_recordId" value={row.id} />
        ) : null}

        <Card className="rounded-[2rem] border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>
              {tCommon(t, "recordDetails", "Record details")}
            </CardTitle>
            <CardDescription>
              {tCommon(
                t,
                "recordDetailsDescription",
                "Fields are written directly to the provider-owned table after membership and ownership validation.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            {config.fields.map((field) => (
              <div
                key={field.name}
                className={
                  field.type === "textarea" ||
                  field.type === "translations" ||
                  field.type === "json"
                    ? "space-y-2 md:col-span-2"
                    : "space-y-2"
                }
              >
                <label
                  htmlFor={field.name}
                  className="text-sm font-semibold text-slate-800"
                >
                  {tLabel(t, field.label)}
                  {field.required ? (
                    <span className="text-red-500"> *</span>
                  ) : null}
                </label>
                <FieldControl
                  field={{
                    ...field,
                    label: tLabel(t, field.label),
                    help: field.help ? tMessage(t, field.help) : field.help,
                  }}
                  value={row?.[field.name]}
                  options={options[field.name]}
                  selectPlaceholder={tCommon(
                    t,
                    "selectPlaceholder",
                    "Select...",
                  )}
                />
                {field.help ? (
                  <p className="text-xs leading-5 text-slate-500">
                    {tMessage(t, field.help)}
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Link
            href={base}
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {tCommon(t, "cancel", "Cancel")}
          </Link>
          <Button
            type="submit"
            className="rounded-xl bg-slate-950 px-5 hover:bg-slate-800"
          >
            {isEdit
              ? tCommon(t, "saveChanges", "Save changes")
              : tCommon(t, "createRecord", "Create record")}
          </Button>
        </div>
      </form>
    </div>
  );
}
