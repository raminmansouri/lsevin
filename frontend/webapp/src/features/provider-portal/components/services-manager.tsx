"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { deleteProviderServiceAction, saveProviderServiceAction } from "@/features/provider-portal/actions";
import { saveProviderServiceSchema } from "@/features/provider-portal/schemas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import { displayTranslation, joinCsv } from "../lib/normalizers";
import type { ProviderServiceRow, ProviderWorkspace, ServiceDefinitionOption } from "../types";

type FormValues = z.infer<typeof saveProviderServiceSchema>;

export function ServicesManager({
  workspace,
  services,
  definitions,
}: {
  workspace: ProviderWorkspace;
  services: ProviderServiceRow[];
  definitions: ServiceDefinitionOption[];
}) {
  const [editing, setEditing] = useState<ProviderServiceRow | null>(null);
  const canManage = workspace.permissions.manageServices;

  return (
    <div className="space-y-6">
      {canManage ? (
        <ServiceForm
          providerId={workspace.provider.id}
          definitions={definitions}
          editing={editing}
          onDone={() => setEditing(null)}
        />
      ) : null}

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>Provider-owned services linked to global service definitions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {services.length ? services.map((service) => (
            <div key={service.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{service.name}</h3>
                    <Badge variant={service.isActive ? "default" : "secondary"}>{service.isActive ? "Active" : "Inactive"}</Badge>
                    {service.isPopular ? <Badge variant="outline">Popular</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{service.serviceDefinitionName}</p>
                  <p className="mt-2 text-sm text-slate-600">{displayTranslation(service.description, "en-US", "-")}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{service.currency} {service.value.toLocaleString()}</span>
                    <span>· {service.durationMinutes} min</span>
                    <span>· slot {service.slotIntervalMinutes} min</span>
                    {service.tags?.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                  </div>
                </div>
                {canManage ? (
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditing(service)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <DeleteServiceButton providerId={workspace.provider.id} serviceId={service.id} />
                  </div>
                ) : null}
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">No services yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ServiceForm({
  providerId,
  definitions,
  editing,
  onDone,
}: {
  providerId: string;
  definitions: ServiceDefinitionOption[];
  editing: ProviderServiceRow | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues = useMemo<FormValues>(() => ({
    providerId,
    serviceId: editing?.id || undefined,
    serviceDefinitionId: editing?.serviceDefinitionId || definitions[0]?.id || "",
    nameEn: editing ? displayTranslation(editing.displayName, "en-US", "") : "",
    nameFa: editing ? displayTranslation(editing.displayName, "fa-IR", "") : "",
    descriptionEn: editing ? displayTranslation(editing.description, "en-US", "") : "",
    descriptionFa: editing ? displayTranslation(editing.description, "fa-IR", "") : "",
    currency: editing?.currency || definitions[0]?.currency || "USD",
    value: editing?.value || definitions[0]?.value || 0,
    durationMinutes: editing?.durationMinutes || definitions[0]?.durationMinutes || 0,
    slotIntervalMinutes: editing?.slotIntervalMinutes || 15,
    imageUrl: editing?.imageUrl || "",
    isActive: editing?.isActive ?? true,
    isPopular: editing?.isPopular ?? false,
    tagsCsv: joinCsv(editing?.tags || []),
  }), [providerId, definitions, editing]);

  const form = useForm<FormValues>({
    resolver: zodResolver(saveProviderServiceSchema),
    values: defaultValues,
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const response = await saveProviderServiceAction(values);
      if (!response.ok) {
        toast.error(response.error || "Service could not be saved.");
        return;
      }
      toast.success(editing ? "Service updated." : "Service created.");
      onDone();
      router.refresh();
    });
  };

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {editing ? "Edit service" : "Add service"}
        </CardTitle>
        <CardDescription>Prices are stored in source currency. Use your multicurrency kit in customer-facing UI.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" {...form.register("providerId")} />
          <input type="hidden" {...form.register("serviceId")} />

          <label className="space-y-2">
            <span className="text-sm font-medium">Global service definition</span>
            <select {...form.register("serviceDefinitionId")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
              {definitions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            {form.formState.errors.serviceDefinitionId ? <p className="text-xs text-red-600">{form.formState.errors.serviceDefinitionId.message}</p> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Image URL / media id</span>
            <Input {...form.register("imageUrl")} disabled={isPending} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Name English</span>
            <Input {...form.register("nameEn")} disabled={isPending} />
            {form.formState.errors.nameEn ? <p className="text-xs text-red-600">{form.formState.errors.nameEn.message}</p> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Name Persian</span>
            <Input {...form.register("nameFa")} disabled={isPending} />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Description English</span>
            <Textarea {...form.register("descriptionEn")} rows={4} disabled={isPending} />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Description Persian</span>
            <Textarea {...form.register("descriptionFa")} rows={4} disabled={isPending} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Currency</span>
            <Input {...form.register("currency")} maxLength={15} disabled={isPending} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Price</span>
            <Input {...form.register("value")} type="number" step="0.01" disabled={isPending} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Duration minutes</span>
            <Input {...form.register("durationMinutes")} type="number" disabled={isPending} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Slot interval minutes</span>
            <Input {...form.register("slotIntervalMinutes")} type="number" disabled={isPending} />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Tags CSV</span>
            <Input {...form.register("tagsCsv")} placeholder="VIP, Popular, Dental" disabled={isPending} />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("isActive")} className="h-4 w-4 rounded border-slate-300" />
            Active
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("isPopular")} className="h-4 w-4 rounded border-slate-300" />
            Popular
          </label>

          <div className="flex justify-end gap-3 border-t pt-5 md:col-span-2">
            {editing ? <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>Cancel edit</Button> : null}
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : editing ? "Save service" : "Add service"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteServiceButton({ providerId, serviceId }: { providerId: string; serviceId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Deactivate this service?")) return;
        startTransition(async () => {
          const response = await deleteProviderServiceAction({ providerId, serviceId });
          if (!response.ok) {
            toast.error(response.error || "Service could not be deactivated.");
            return;
          }
          toast.success("Service deactivated.");
          router.refresh();
        });
      }}
    >
      <Trash2 className="mr-2 h-4 w-4" /> Deactivate
    </Button>
  );
}
