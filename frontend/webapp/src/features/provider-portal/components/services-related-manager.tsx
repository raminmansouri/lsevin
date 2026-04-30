"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, ImageIcon, Plug, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  deleteServiceAddonSettingAction,
  deleteServiceGalleryItemAction,
  saveServiceAddonSettingAction,
  saveServiceGalleryItemAction,
} from "@/features/provider-portal/actions";
import { saveServiceAddonSettingSchema, saveServiceGalleryItemSchema } from "@/features/provider-portal/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import { LocalizedRichPreview } from "./localized-rich-preview";
import { PortalImage } from "./portal-image";
import { displayTranslation } from "../lib/normalizers";
import type { ProviderServiceRelatedRecords, ProviderServiceRow, ServiceAddonSettingRow, ServiceGalleryRow } from "../types";

type ServiceGalleryFormValues = z.infer<typeof saveServiceGalleryItemSchema>;
type AddonFormValues = z.infer<typeof saveServiceAddonSettingSchema>;

export function ServicesRelatedManager({
  providerId,
  services,
  related,
  serviceId,
  focus = "all",
}: {
  providerId: string;
  services: ProviderServiceRow[];
  related: ProviderServiceRelatedRecords;
  serviceId?: string;
  focus?: "all" | "gallery" | "addons";
}) {
  const scopedServices = serviceId ? services.filter((service) => service.id === serviceId) : services;
  const effectiveServices = scopedServices.length ? scopedServices : services;
  const serviceIds = new Set(effectiveServices.map((service) => service.id));
  const scopedRelated: ProviderServiceRelatedRecords = serviceId
    ? {
        ...related,
        serviceGallery: related.serviceGallery.filter((row) => serviceIds.has(row.providerServiceId)),
        addonSettings: related.addonSettings.filter((row) => serviceIds.has(row.providerServiceId)),
      }
    : related;

  const showGallery = focus === "all" || focus === "gallery";
  const showAddons = focus === "all" || focus === "addons";

  return (
    <div className={focus === "all" ? "grid gap-6 xl:grid-cols-2" : "space-y-6"}>
      {showGallery ? <ServiceGalleryCard providerId={providerId} services={effectiveServices} rows={scopedRelated.serviceGallery} /> : null}
      {showAddons ? <ServiceAddonSettingsCard providerId={providerId} services={effectiveServices} related={scopedRelated} /> : null}
    </div>
  );
}

function ServiceGalleryCard({ providerId, services, rows }: { providerId: string; services: ProviderServiceRow[]; rows: ServiceGalleryRow[] }) {
  const [editing, setEditing] = useState<ServiceGalleryRow | null>(null);
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Service gallery</CardTitle>
        <CardDescription>Add images, GIFs, videos, and files to each provider-owned service.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ServiceGalleryForm providerId={providerId} services={services} editing={editing} onDone={() => setEditing(null)} />
        <div className="space-y-3">
          {rows.length ? rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex gap-4">
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200">
                  <PortalImage src={row.url} alt={row.displayTitle || row.serviceName} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-950">{row.displayTitle || "Untitled media"}</p>
                    <Badge variant="outline">{row.serviceName}</Badge>
                    {row.isPrimary ? <Badge>Primary</Badge> : null}
                  </div>
                  <div className="mt-2 text-sm"><LocalizedRichPreview translations={row.description} /></div>
                  <p className="mt-2 text-xs text-slate-500">{row.mediaType} · order {row.displayOrder}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(row)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                  <DeleteButton onDelete={async () => deleteServiceGalleryItemAction({ providerId, serviceGalleryItemId: row.id })} />
                </div>
              </div>
            </div>
          )) : <Empty text="No service gallery records yet." />}
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceGalleryForm({ providerId, services, editing, onDone }: { providerId: string; services: ProviderServiceRow[]; editing: ServiceGalleryRow | null; onDone: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const values = useMemo<ServiceGalleryFormValues>(() => ({
    providerId,
    serviceGalleryItemId: editing?.id || null,
    providerServiceId: editing?.providerServiceId || services[0]?.id || "",
    titleEn: editing ? displayTranslation(editing.title, "en-US", "") : "",
    titleFa: editing ? displayTranslation(editing.title, "fa-IR", "") : "",
    descriptionEn: editing ? displayTranslation(editing.description, "en-US", "") : "",
    descriptionFa: editing ? displayTranslation(editing.description, "fa-IR", "") : "",
    url: editing?.url || "",
    mediaType: (editing?.mediaType as any) || "image",
    displayOrder: editing?.displayOrder || 0,
    isPrimary: editing?.isPrimary || false,
  }), [editing, providerId, services]);

  const form = useForm<ServiceGalleryFormValues>({ resolver: zodResolver(saveServiceGalleryItemSchema), values });

  const onSubmit = (formValues: ServiceGalleryFormValues) => {
    startTransition(async () => {
      const response = await saveServiceGalleryItemAction(formValues);
      if (!response.ok) return toast.error(response.error || "Service media could not be saved.");
      toast.success("Service media saved.");
      onDone();
      router.refresh();
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <input type="hidden" {...form.register("providerId")} />
      <input type="hidden" {...form.register("serviceGalleryItemId")} />
      <Field label="Service" error={form.formState.errors.providerServiceId?.message}>
        <select {...form.register("providerServiceId")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" disabled={isPending || !services.length}>
          {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
        </select>
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title English"><Input {...form.register("titleEn")} disabled={isPending} /></Field>
        <Field label="Title Persian"><Input {...form.register("titleFa")} disabled={isPending} /></Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Media URL / media id" error={form.formState.errors.url?.message}><Input {...form.register("url")} disabled={isPending} /></Field>
        <Field label="Media type"><select {...form.register("mediaType")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="image">Image</option><option value="gif">GIF</option><option value="video">Video</option><option value="file">File</option></select></Field>
      </div>
      <div className="relative h-28 overflow-hidden rounded-2xl border border-slate-200"><PortalImage src={form.watch("url")} alt="Service media preview" /></div>
      <Field label="Description English"><Textarea {...form.register("descriptionEn")} rows={2} disabled={isPending} /></Field>
      <Field label="Description Persian"><Textarea {...form.register("descriptionFa")} rows={2} disabled={isPending} /></Field>
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <Field label="Display order"><Input type="number" {...form.register("displayOrder")} disabled={isPending} /></Field>
        <label className="flex items-center gap-2 pb-3 text-sm"><input type="checkbox" {...form.register("isPrimary")} /> Primary</label>
      </div>
      <div className="flex justify-end gap-2">
        {editing ? <Button type="button" variant="outline" onClick={onDone}>Cancel</Button> : null}
        <Button type="submit" disabled={isPending || !services.length}>{isPending ? "Saving..." : editing ? "Update media" : "Add media"}</Button>
      </div>
    </form>
  );
}

function ServiceAddonSettingsCard({ providerId, services, related }: { providerId: string; services: ProviderServiceRow[]; related: ProviderServiceRelatedRecords }) {
  const [editing, setEditing] = useState<ServiceAddonSettingRow | null>(null);
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Plug className="h-5 w-5" /> Service add-ons</CardTitle>
        <CardDescription>Enable add-ons per service and override provider-specific prices when needed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <AddonForm providerId={providerId} services={services} related={related} editing={editing} onDone={() => setEditing(null)} />
        <div className="space-y-3">
          {related.addonSettings.length ? related.addonSettings.map((row) => (
            <div key={`${row.providerServiceId}-${row.addonId}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-950">{row.addonName}</p>
                  <Badge variant="outline">{row.serviceName}</Badge>
                  <Badge variant={row.isEnabled ? "default" : "secondary"}>{row.isEnabled ? "Enabled" : "Disabled"}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Default: {row.defaultCurrencyCode} {row.defaultPrice.toLocaleString()} · Custom: {row.customPrice == null ? "-" : row.customPrice.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(row)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                <DeleteButton onDelete={async () => deleteServiceAddonSettingAction({ providerId, providerServiceId: row.providerServiceId, addonId: row.addonId })} />
              </div>
            </div>
          )) : <Empty text="No add-on settings yet." />}
        </div>
      </CardContent>
    </Card>
  );
}

function AddonForm({ providerId, services, related, editing, onDone }: { providerId: string; services: ProviderServiceRow[]; related: ProviderServiceRelatedRecords; editing: ServiceAddonSettingRow | null; onDone: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const values = useMemo<AddonFormValues>(() => ({
    providerId,
    providerServiceId: editing?.providerServiceId || services[0]?.id || "",
    addonId: editing?.addonId || related.addonOptions[0]?.id || "",
    isEnabled: editing?.isEnabled ?? true,
    customPrice: editing?.customPrice ?? null,
  }), [editing, providerId, related.addonOptions, services]);
  const form = useForm<AddonFormValues>({ resolver: zodResolver(saveServiceAddonSettingSchema), values });

  const onSubmit = (formValues: AddonFormValues) => {
    startTransition(async () => {
      const response = await saveServiceAddonSettingAction(formValues);
      if (!response.ok) return toast.error(response.error || "Add-on setting could not be saved.");
      toast.success("Add-on setting saved.");
      onDone();
      router.refresh();
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <input type="hidden" {...form.register("providerId")} />
      <Field label="Service"><select {...form.register("providerServiceId")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" disabled={isPending || !!editing}>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></Field>
      <Field label="Add-on"><select {...form.register("addonId")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" disabled={isPending || !!editing}>{related.addonOptions.map((addon) => <option key={addon.id} value={addon.id}>{addon.name} · {addon.currencyCode} {addon.price}</option>)}</select></Field>
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <Field label="Custom price"><Input type="number" step="0.01" {...form.register("customPrice")} disabled={isPending} placeholder="Leave empty to use default" /></Field>
        <label className="flex items-center gap-2 pb-3 text-sm"><input type="checkbox" {...form.register("isEnabled")} /> Enabled</label>
      </div>
      <div className="flex justify-end gap-2">
        {editing ? <Button type="button" variant="outline" onClick={onDone}>Cancel</Button> : null}
        <Button type="submit" disabled={isPending || !services.length || !related.addonOptions.length}>{isPending ? "Saving..." : editing ? "Update add-on" : "Add setting"}</Button>
      </div>
    </form>
  );
}

function DeleteButton({ onDelete }: { onDelete: () => Promise<{ ok: boolean; error?: string }> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <Button type="button" size="sm" variant="destructive" disabled={isPending} onClick={() => {
      if (!confirm("Delete this record?")) return;
      startTransition(async () => {
        const response = await onDelete();
        if (!response.ok) return toast.error(response.error || "Record could not be deleted.");
        toast.success("Record deleted.");
        router.refresh();
      });
    }}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-medium text-slate-700">{label}</span>{children}{error ? <p className="text-xs text-red-600">{error}</p> : null}</label>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">{text}</div>;
}
