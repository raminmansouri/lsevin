"use client";

import { useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import useAction from "@/hooks/use-action";
import { useRouter } from "@/i18n/navigation";

import { createAdminRowAction, updateAdminRowAction } from "../actions";
import { buildAdminFormSchema } from "../lib/form-schema";
import { rowToFormValues } from "../lib/values";
import type { AdminRelationOption, AdminRow, AdminTableConfig } from "../types";
import { AdminFieldRenderer } from "./admin-field-renderer";

type Props = {
  config: AdminTableConfig;
  row?: AdminRow | null;
  rowId?: Record<string, unknown>;
  relationOptions: Record<string, AdminRelationOption[]>;
  mode: "create" | "update";
  locale: string;
};

export function AdminDataForm({ config, row, rowId, relationOptions, mode, locale }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = mode === "update";
  const schema = useMemo(() => buildAdminFormSchema(config, mode), [config, mode]);

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: rowToFormValues(config.fields, row || undefined),
  });

  const action = isEdit ? updateAdminRowAction : createAdminRowAction;
  const { execute } = useAction(action, {
    startTransition,
    onSuccess: () => {
      toast.success(isEdit ? "Updated successfully." : "Created successfully.");
      router.push(`/admin/platform-data/${config.schema}/${config.table}`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.detail || "Operation failed.");
    },
  });

  const onSubmit = (values: Record<string, unknown>) => {
    startTransition(async () => {
      await execute({
        schema: config.schema,
        table: config.table,
        rowId,
        values,
      });
    });
  };

  const visibleFields = config.fields.filter((field) => {
    if (field.hidden) return false;
    if (isEdit && field.updateHidden) return false;
    if (!isEdit && field.createHidden) return false;
    if (isEdit && config.primaryKey.includes(field.name)) return false;
    return true;
  });

  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle>{isEdit ? `Edit ${config.title}` : `Create ${config.title}`}</CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleFields.map((field) => (
                <AdminFieldRenderer
                  key={field.name}
                  control={form.control}
                  fieldConfig={field}
                  disabled={isPending || config.readOnly}
                  relationOptions={relationOptions[field.name] || []}
                  locale={locale}
                />
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 border-t pt-6">
              <Button type="button" variant="outline" onClick={() => router.push(`/admin/platform-data/${config.schema}/${config.table}`)} disabled={isPending}>
                Cancel
              </Button>
              {!config.readOnly && (
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : isEdit ? "Save changes" : "Create record"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
