"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  deleteServiceFaqAction,
  deleteServiceIncludedAction,
  deleteServiceProcessAction,
  saveServiceFaqAction,
  saveServiceIncludedAction,
  saveServiceProcessAction,
} from "@/features/provider-portal/actions";
import { saveServiceFaqSchema, saveServiceIncludedSchema, saveServiceProcessSchema } from "@/features/provider-portal/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import type { ProviderServiceRelatedRecords, ProviderServiceRow, ServiceFaqRow, ServiceIncludedRow, ServiceProcessRow } from "../types";

type IncludedValues = z.infer<typeof saveServiceIncludedSchema>;
type ProcessValues = z.infer<typeof saveServiceProcessSchema>;
type FaqValues = z.infer<typeof saveServiceFaqSchema>;

export function ServiceContentManager({
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
  focus?: "all" | "included" | "process" | "faqs";
}) {
  const [included, setIncluded] = useState<ServiceIncludedRow | null>(null);
  const [process, setProcess] = useState<ServiceProcessRow | null>(null);
  const [faq, setFaq] = useState<ServiceFaqRow | null>(null);
  const scopedServices = serviceId ? services.filter((service) => service.id === serviceId) : services;
  const effectiveServices = scopedServices.length ? scopedServices : services;
  const serviceIds = new Set(effectiveServices.map((service) => service.id));
  const scopedRelated = serviceId
    ? {
        ...related,
        included: related.included.filter((row) => serviceIds.has(row.providerServiceId)),
        process: related.process.filter((row) => serviceIds.has(row.providerServiceId)),
        faqs: related.faqs.filter((row) => serviceIds.has(row.providerServiceId)),
      }
    : related;
  const showIncluded = focus === "all" || focus === "included";
  const showProcess = focus === "all" || focus === "process";
  const showFaqs = focus === "all" || focus === "faqs";

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Service content records</CardTitle>
        <CardDescription>Provider-owned service included items, process steps, and FAQs.</CardDescription>
      </CardHeader>
      <CardContent className={focus === "all" ? "grid gap-6 xl:grid-cols-3" : "space-y-6"}>
        {showIncluded ? (
          <section className="space-y-4">
            <h3 className="font-semibold text-slate-950">Included items</h3>
            <IncludedForm providerId={providerId} services={effectiveServices} editing={included} onDone={() => setIncluded(null)} />
            <div className="space-y-3">
              {scopedRelated.included.length ? scopedRelated.included.map((row) => (
                <Record key={row.id} title={row.item} subtitle={row.serviceName} onEdit={() => setIncluded(row)} onDelete={() => deleteServiceIncludedAction({ providerId, includedId: row.id })} />
              )) : <Empty text="No included items yet." />}
            </div>
          </section>
        ) : null}

        {showProcess ? (
          <section className="space-y-4">
            <h3 className="font-semibold text-slate-950">Process steps</h3>
            <ProcessForm providerId={providerId} services={effectiveServices} editing={process} onDone={() => setProcess(null)} />
            <div className="space-y-3">
              {scopedRelated.process.length ? scopedRelated.process.map((row) => (
                <Record key={row.id} title={`${row.step}. ${row.title || "Step"}`} subtitle={`${row.serviceName}${row.duration ? ` · ${row.duration}` : ""}`} description={row.description || undefined} onEdit={() => setProcess(row)} onDelete={() => deleteServiceProcessAction({ providerId, processId: row.id })} />
              )) : <Empty text="No process steps yet." />}
            </div>
          </section>
        ) : null}

        {showFaqs ? (
          <section className="space-y-4">
            <h3 className="font-semibold text-slate-950">FAQs</h3>
            <FaqForm providerId={providerId} services={effectiveServices} editing={faq} onDone={() => setFaq(null)} />
            <div className="space-y-3">
              {scopedRelated.faqs.length ? scopedRelated.faqs.map((row) => (
                <Record key={row.id} title={row.question || "Question"} subtitle={row.serviceName} description={row.answer || undefined} onEdit={() => setFaq(row)} onDelete={() => deleteServiceFaqAction({ providerId, faqId: row.id })} />
              )) : <Empty text="No FAQs yet." />}
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}

function IncludedForm({ providerId, services, editing, onDone }: { providerId: string; services: ProviderServiceRow[]; editing: ServiceIncludedRow | null; onDone: () => void }) {
  const router = useRouter(); const [pending, startTransition] = useTransition();
  const values = useMemo<IncludedValues>(() => ({ providerId, includedId: editing?.id || null, providerServiceId: editing?.providerServiceId || services[0]?.id || "", item: editing?.item || "" }), [editing, providerId, services]);
  const form = useForm<IncludedValues>({ resolver: zodResolver(saveServiceIncludedSchema), values });
  return <MiniForm onSubmit={form.handleSubmit((v) => startTransition(async () => { const r = await saveServiceIncludedAction(v); if (!r.ok) return toast.error(r.error || "Could not save."); toast.success("Included item saved."); onDone(); router.refresh(); }))}>
    <input type="hidden" {...form.register("providerId")} /><input type="hidden" {...form.register("includedId")} />
    <ServiceSelect form={form} services={services} disabled={pending || !!editing} />
    <Field label="Item"><Input {...form.register("item")} disabled={pending} /></Field>
    <Submit editing={!!editing} pending={pending} onCancel={onDone} />
  </MiniForm>;
}

function ProcessForm({ providerId, services, editing, onDone }: { providerId: string; services: ProviderServiceRow[]; editing: ServiceProcessRow | null; onDone: () => void }) {
  const router = useRouter(); const [pending, startTransition] = useTransition();
  const values = useMemo<ProcessValues>(() => ({ providerId, processId: editing?.id || null, providerServiceId: editing?.providerServiceId || services[0]?.id || "", step: editing?.step || 1, title: editing?.title || null, description: editing?.description || null, duration: editing?.duration || null }), [editing, providerId, services]);
  const form = useForm<ProcessValues>({ resolver: zodResolver(saveServiceProcessSchema), values });
  return <MiniForm onSubmit={form.handleSubmit((v) => startTransition(async () => { const r = await saveServiceProcessAction(v); if (!r.ok) return toast.error(r.error || "Could not save."); toast.success("Process step saved."); onDone(); router.refresh(); }))}>
    <input type="hidden" {...form.register("providerId")} /><input type="hidden" {...form.register("processId")} />
    <ServiceSelect form={form} services={services} disabled={pending || !!editing} />
    <Field label="Step"><Input type="number" {...form.register("step")} disabled={pending} /></Field>
    <Field label="Title"><Input {...form.register("title")} disabled={pending} /></Field>
    <Field label="Duration"><Input {...form.register("duration")} disabled={pending} /></Field>
    <Field label="Description"><Textarea {...form.register("description")} disabled={pending} rows={2} /></Field>
    <Submit editing={!!editing} pending={pending} onCancel={onDone} />
  </MiniForm>;
}

function FaqForm({ providerId, services, editing, onDone }: { providerId: string; services: ProviderServiceRow[]; editing: ServiceFaqRow | null; onDone: () => void }) {
  const router = useRouter(); const [pending, startTransition] = useTransition();
  const values = useMemo<FaqValues>(() => ({ providerId, faqId: editing?.id || null, providerServiceId: editing?.providerServiceId || services[0]?.id || "", question: editing?.question || null, answer: editing?.answer || null }), [editing, providerId, services]);
  const form = useForm<FaqValues>({ resolver: zodResolver(saveServiceFaqSchema), values });
  return <MiniForm onSubmit={form.handleSubmit((v) => startTransition(async () => { const r = await saveServiceFaqAction(v); if (!r.ok) return toast.error(r.error || "Could not save."); toast.success("FAQ saved."); onDone(); router.refresh(); }))}>
    <input type="hidden" {...form.register("providerId")} /><input type="hidden" {...form.register("faqId")} />
    <ServiceSelect form={form} services={services} disabled={pending || !!editing} />
    <Field label="Question"><Textarea {...form.register("question")} disabled={pending} rows={2} /></Field>
    <Field label="Answer"><Textarea {...form.register("answer")} disabled={pending} rows={3} /></Field>
    <Submit editing={!!editing} pending={pending} onCancel={onDone} />
  </MiniForm>;
}

function ServiceSelect({ form, services, disabled }: { form: any; services: ProviderServiceRow[]; disabled?: boolean }) {
  return <Field label="Service"><select {...form.register("providerServiceId")} disabled={disabled || !services.length} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></Field>;
}

function MiniForm({ onSubmit, children }: { onSubmit: () => void; children: ReactNode }) {
  return <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">{children}</form>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}

function Submit({ editing, pending, onCancel }: { editing: boolean; pending: boolean; onCancel: () => void }) {
  return <div className="flex justify-end gap-2">{editing ? <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button> : null}<Button type="submit" disabled={pending}>{pending ? "Saving..." : editing ? "Update" : "Add"}</Button></div>;
}

function Record({ title, subtitle, description, onEdit, onDelete }: { title: string; subtitle: string; description?: string; onEdit: () => void; onDelete: () => Promise<{ ok: boolean; error?: string }> }) {
  const router = useRouter(); const [pending, startTransition] = useTransition();
  return <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-950">{title}</p><div className="mt-1"><Badge variant="outline">{subtitle}</Badge></div>{description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}</div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit</Button><Button size="sm" variant="destructive" disabled={pending} onClick={() => { if (!confirm("Delete this record?")) return; startTransition(async () => { const r = await onDelete(); if (!r.ok) return toast.error(r.error || "Could not delete."); toast.success("Record deleted."); router.refresh(); }); }}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button></div></div></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">{text}</div>;
}
