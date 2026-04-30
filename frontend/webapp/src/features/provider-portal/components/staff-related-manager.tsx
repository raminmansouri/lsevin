"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  deleteStaffAvailabilityAction,
  deleteStaffCertificationAction,
  deleteStaffEducationAction,
  deleteStaffGalleryItemAction,
  deleteStaffServiceAction,
  saveStaffAvailabilityAction,
  saveStaffCertificationAction,
  saveStaffEducationAction,
  saveStaffGalleryItemAction,
  saveStaffServiceAction,
} from "@/features/provider-portal/actions";
import {
  saveStaffAvailabilitySchema,
  saveStaffCertificationSchema,
  saveStaffEducationSchema,
  saveStaffGalleryItemSchema,
  saveStaffServiceSchema,
} from "@/features/provider-portal/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import { LocalizedRichPreview } from "./localized-rich-preview";
import { PortalImage } from "./portal-image";
import { displayTranslation } from "../lib/normalizers";
import type {
  ProviderStaffRelatedRecords,
  StaffAvailabilityRow,
  StaffCertificationRow,
  StaffEducationRow,
  StaffGalleryRow,
  StaffRow,
  StaffServiceRow,
} from "../types";

type CertificationValues = z.infer<typeof saveStaffCertificationSchema>;
type EducationValues = z.infer<typeof saveStaffEducationSchema>;
type AvailabilityValues = z.infer<typeof saveStaffAvailabilitySchema>;
type GalleryValues = z.infer<typeof saveStaffGalleryItemSchema>;
type StaffServiceValues = z.infer<typeof saveStaffServiceSchema>;

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function StaffRelatedManager({
  providerId,
  staff,
  related,
  staffId,
  focus = "all",
}: {
  providerId: string;
  staff: StaffRow[];
  related: ProviderStaffRelatedRecords;
  staffId?: string;
  focus?: "all" | "certifications" | "education" | "availability" | "services" | "gallery";
}) {
  const selectedStaff = staffId ? staff.filter((item) => item.id === staffId || item.providerStaffId === staffId) : staff;
  const effectiveStaff = selectedStaff.length ? selectedStaff : staff;
  const staffIds = new Set(effectiveStaff.map((item) => item.id));
  const scopedRelated: ProviderStaffRelatedRecords = staffId
    ? {
        ...related,
        certifications: related.certifications.filter((row) => staffIds.has(row.staffId)),
        education: related.education.filter((row) => staffIds.has(row.staffId)),
        availability: related.availability.filter((row) => staffIds.has(row.staffId)),
        gallery: related.gallery.filter((row) => staffIds.has(row.staffId)),
        services: related.services.filter((row) => staffIds.has(row.staffId)),
      }
    : related;

  const showCertifications = focus === "all" || focus === "certifications";
  const showEducation = focus === "all" || focus === "education";
  const showAvailability = focus === "all" || focus === "availability";
  const showServices = focus === "all" || focus === "services";
  const showGallery = focus === "all" || focus === "gallery";

  return (
    <div className="space-y-6">
      {showCertifications || showEducation ? (
        <div className={focus === "all" ? "grid gap-6 xl:grid-cols-2" : "space-y-6"}>
          {showCertifications ? <CertificationsCard providerId={providerId} staff={effectiveStaff} rows={scopedRelated.certifications} /> : null}
          {showEducation ? <EducationCard providerId={providerId} staff={effectiveStaff} rows={scopedRelated.education} /> : null}
        </div>
      ) : null}
      {showAvailability || showServices ? (
        <div className={focus === "all" ? "grid gap-6 xl:grid-cols-2" : "space-y-6"}>
          {showAvailability ? <AvailabilityCard providerId={providerId} staff={effectiveStaff} rows={scopedRelated.availability} /> : null}
          {showServices ? <StaffServicesCard providerId={providerId} staff={effectiveStaff} related={scopedRelated} /> : null}
        </div>
      ) : null}
      {showGallery ? <StaffGalleryCard providerId={providerId} staff={effectiveStaff} rows={scopedRelated.gallery} /> : null}
    </div>
  );
}

function CertificationsCard({ providerId, staff, rows }: { providerId: string; staff: StaffRow[]; rows: StaffCertificationRow[] }) {
  const [editing, setEditing] = useState<StaffCertificationRow | null>(null);
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader><CardTitle>Staff certifications</CardTitle><CardDescription>Provider can add non-verified certifications for their own staff.</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <CertificationForm providerId={providerId} staff={staff} editing={editing} onDone={() => setEditing(null)} />
        <RecordList rows={rows} empty="No staff certifications yet." render={(row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
            <div><p className="font-semibold">{row.name}</p><p className="text-sm text-slate-500">{row.staffName}{row.issuer ? ` · ${row.issuer}` : ""}</p>{row.isVerified ? <Badge>Verified</Badge> : null}</div>
            {!row.isVerified ? <RowActions onEdit={() => setEditing(row)} onDelete={() => deleteStaffCertificationAction({ providerId, certificationId: row.id })} /> : null}
          </div>
        )} />
      </CardContent>
    </Card>
  );
}

function CertificationForm({ providerId, staff, editing, onDone }: { providerId: string; staff: StaffRow[]; editing: StaffCertificationRow | null; onDone: () => void }) {
  const router = useRouter(); const [isPending, startTransition] = useTransition();
  const values = useMemo<CertificationValues>(() => ({ providerId, certificationId: editing?.id || null, staffId: editing?.staffId || staff[0]?.id || "", name: editing?.name || "", issuer: editing?.issuer || null }), [editing, providerId, staff]);
  const form = useForm<CertificationValues>({ resolver: zodResolver(saveStaffCertificationSchema), values });
  return <InlineForm onSubmit={form.handleSubmit((v) => startTransition(async () => { const r = await saveStaffCertificationAction(v); if (!r.ok) return toast.error(r.error || "Could not save."); toast.success("Certification saved."); onDone(); router.refresh(); }))}>
    <input type="hidden" {...form.register("providerId")} /><input type="hidden" {...form.register("certificationId")} />
    <StaffSelect form={form} staff={staff} disabled={isPending || !!editing} />
    <Field label="Name"><Input {...form.register("name")} disabled={isPending} /></Field>
    <Field label="Issuer"><Input {...form.register("issuer")} disabled={isPending} /></Field>
    <SubmitButtons editing={!!editing} pending={isPending} onCancel={onDone} />
  </InlineForm>;
}

function EducationCard({ providerId, staff, rows }: { providerId: string; staff: StaffRow[]; rows: StaffEducationRow[] }) {
  const [editing, setEditing] = useState<StaffEducationRow | null>(null);
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader><CardTitle>Staff education</CardTitle><CardDescription>Degrees and institutions for doctors, trainers, teachers, and specialists.</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <EducationForm providerId={providerId} staff={staff} editing={editing} onDone={() => setEditing(null)} />
        <RecordList rows={rows} empty="No education records yet." render={(row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
            <div><p className="font-semibold">{row.degree}</p><p className="text-sm text-slate-500">{row.staffName} · {row.institution}{row.year ? ` · ${row.year}` : ""}</p></div>
            <RowActions onEdit={() => setEditing(row)} onDelete={() => deleteStaffEducationAction({ providerId, educationId: row.id })} />
          </div>
        )} />
      </CardContent>
    </Card>
  );
}

function EducationForm({ providerId, staff, editing, onDone }: { providerId: string; staff: StaffRow[]; editing: StaffEducationRow | null; onDone: () => void }) {
  const router = useRouter(); const [isPending, startTransition] = useTransition();
  const values = useMemo<EducationValues>(() => ({ providerId, educationId: editing?.id || null, staffId: editing?.staffId || staff[0]?.id || "", degree: editing?.degree || "", institution: editing?.institution || "", year: editing?.year || null }), [editing, providerId, staff]);
  const form = useForm<EducationValues>({ resolver: zodResolver(saveStaffEducationSchema), values });
  return <InlineForm onSubmit={form.handleSubmit((v) => startTransition(async () => { const r = await saveStaffEducationAction(v); if (!r.ok) return toast.error(r.error || "Could not save."); toast.success("Education saved."); onDone(); router.refresh(); }))}>
    <input type="hidden" {...form.register("providerId")} /><input type="hidden" {...form.register("educationId")} />
    <StaffSelect form={form} staff={staff} disabled={isPending || !!editing} />
    <Field label="Degree"><Input {...form.register("degree")} disabled={isPending} /></Field>
    <Field label="Institution"><Input {...form.register("institution")} disabled={isPending} /></Field>
    <Field label="Year"><Input type="number" {...form.register("year")} disabled={isPending} /></Field>
    <SubmitButtons editing={!!editing} pending={isPending} onCancel={onDone} />
  </InlineForm>;
}

function AvailabilityCard({ providerId, staff, rows }: { providerId: string; staff: StaffRow[]; rows: StaffAvailabilityRow[] }) {
  const [editing, setEditing] = useState<StaffAvailabilityRow | null>(null);
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader><CardTitle>Staff availability</CardTitle><CardDescription>Detailed staff-level availability on top of provider operating hours.</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <AvailabilityForm providerId={providerId} staff={staff} editing={editing} onDone={() => setEditing(null)} />
        <RecordList rows={rows} empty="No staff availability records yet." render={(row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
            <div><p className="font-semibold">{row.staffName}</p><p className="text-sm text-slate-500">{dayNames[row.dayOfWeek - 1]} · {row.startTime} - {row.endTime}</p></div>
            <RowActions onEdit={() => setEditing(row)} onDelete={() => deleteStaffAvailabilityAction({ providerId, availabilityId: row.id })} />
          </div>
        )} />
      </CardContent>
    </Card>
  );
}

function AvailabilityForm({ providerId, staff, editing, onDone }: { providerId: string; staff: StaffRow[]; editing: StaffAvailabilityRow | null; onDone: () => void }) {
  const router = useRouter(); const [isPending, startTransition] = useTransition();
  const cleanTime = (value?: string | null) => (value || "09:00").split(":").slice(0, 2).join(":");
  const values = useMemo<AvailabilityValues>(() => ({ providerId, availabilityId: editing?.id || null, staffId: editing?.staffId || staff[0]?.id || "", dayOfWeek: editing?.dayOfWeek || 1, startTime: cleanTime(editing?.startTime), endTime: cleanTime(editing?.endTime || "18:00"), isRecurring: editing?.isRecurring ?? true, availabilityStatusId: editing?.availabilityStatusId || 1, specificDate: editing?.specificDate || null }), [editing, providerId, staff]);
  const form = useForm<AvailabilityValues>({ resolver: zodResolver(saveStaffAvailabilitySchema), values });
  return <InlineForm onSubmit={form.handleSubmit((v) => startTransition(async () => { const r = await saveStaffAvailabilityAction(v); if (!r.ok) return toast.error(r.error || "Could not save."); toast.success("Availability saved."); onDone(); router.refresh(); }))}>
    <input type="hidden" {...form.register("providerId")} /><input type="hidden" {...form.register("availabilityId")} />
    <StaffSelect form={form} staff={staff} disabled={isPending || !!editing} />
    <Field label="Day"><select {...form.register("dayOfWeek")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">{dayNames.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}</select></Field>
    <Field label="Start"><Input type="time" {...form.register("startTime")} disabled={isPending} /></Field>
    <Field label="End"><Input type="time" {...form.register("endTime")} disabled={isPending} /></Field>
    <label className="flex items-center gap-2 pb-3 text-sm"><input type="checkbox" {...form.register("isRecurring")} /> Recurring</label>
    <SubmitButtons editing={!!editing} pending={isPending} onCancel={onDone} />
  </InlineForm>;
}

function StaffServicesCard({ providerId, staff, related }: { providerId: string; staff: StaffRow[]; related: ProviderStaffRelatedRecords }) {
  const [editing, setEditing] = useState<StaffServiceRow | null>(null);
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader><CardTitle>Staff service links</CardTitle><CardDescription>Choose which service definitions each staff member can provide.</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <StaffServiceForm providerId={providerId} staff={staff} related={related} editing={editing} onDone={() => setEditing(null)} />
        <RecordList rows={related.services} empty="No staff service links yet." render={(row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
            <div><p className="font-semibold">{row.serviceDefinitionName}</p><p className="text-sm text-slate-500">{row.staffName}</p><Badge variant={row.isActive ? "default" : "secondary"}>{row.isActive ? "Active" : "Inactive"}</Badge></div>
            <RowActions onEdit={() => setEditing(row)} onDelete={() => deleteStaffServiceAction({ providerId, staffServiceId: row.id })} />
          </div>
        )} />
      </CardContent>
    </Card>
  );
}

function StaffServiceForm({ providerId, staff, related, editing, onDone }: { providerId: string; staff: StaffRow[]; related: ProviderStaffRelatedRecords; editing: StaffServiceRow | null; onDone: () => void }) {
  const router = useRouter(); const [isPending, startTransition] = useTransition();
  const values = useMemo<StaffServiceValues>(() => ({ providerId, staffServiceId: editing?.id || null, staffId: editing?.staffId || staff[0]?.id || "", serviceDefinitionId: editing?.serviceDefinitionId || related.serviceDefinitions[0]?.id || "", notesEn: editing ? displayTranslation(editing.notes, "en-US", "") : "", notesFa: editing ? displayTranslation(editing.notes, "fa-IR", "") : "", isActive: editing?.isActive ?? true }), [editing, providerId, related.serviceDefinitions, staff]);
  const form = useForm<StaffServiceValues>({ resolver: zodResolver(saveStaffServiceSchema), values });
  return <InlineForm onSubmit={form.handleSubmit((v) => startTransition(async () => { const r = await saveStaffServiceAction(v); if (!r.ok) return toast.error(r.error || "Could not save."); toast.success("Staff service saved."); onDone(); router.refresh(); }))}>
    <input type="hidden" {...form.register("providerId")} /><input type="hidden" {...form.register("staffServiceId")} />
    <StaffSelect form={form} staff={staff} disabled={isPending || !!editing} />
    <Field label="Service definition"><select {...form.register("serviceDefinitionId")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">{related.serviceDefinitions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></Field>
    <Field label="Notes English"><Input {...form.register("notesEn")} disabled={isPending} /></Field>
    <label className="flex items-center gap-2 pb-3 text-sm"><input type="checkbox" {...form.register("isActive")} /> Active</label>
    <SubmitButtons editing={!!editing} pending={isPending} onCancel={onDone} />
  </InlineForm>;
}

function StaffGalleryCard({ providerId, staff, rows }: { providerId: string; staff: StaffRow[]; rows: StaffGalleryRow[] }) {
  const [editing, setEditing] = useState<StaffGalleryRow | null>(null);
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader><CardTitle>Staff gallery</CardTitle><CardDescription>Before/after, certificates, workplace images, videos, and specialist media.</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <StaffGalleryForm providerId={providerId} staff={staff} editing={editing} onDone={() => setEditing(null)} />
        <div className="grid gap-3 md:grid-cols-2">
          {rows.length ? rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex gap-4">
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200"><PortalImage src={row.url} alt={row.displayTitle || row.staffName} /></div>
                <div className="min-w-0 flex-1"><p className="font-semibold">{row.displayTitle || "Untitled media"}</p><p className="text-sm text-slate-500">{row.staffName} · {row.mediaType}</p>{row.isPrimary ? <Badge>Primary</Badge> : null}<LocalizedRichPreview translations={row.description} /></div>
              </div>
              <div className="mt-3 flex justify-end"><RowActions onEdit={() => setEditing(row)} onDelete={() => deleteStaffGalleryItemAction({ providerId, staffGalleryItemId: row.id })} /></div>
            </div>
          )) : <Empty text="No staff media yet." />}
        </div>
      </CardContent>
    </Card>
  );
}

function StaffGalleryForm({ providerId, staff, editing, onDone }: { providerId: string; staff: StaffRow[]; editing: StaffGalleryRow | null; onDone: () => void }) {
  const router = useRouter(); const [isPending, startTransition] = useTransition();
  const values = useMemo<GalleryValues>(() => ({ providerId, staffGalleryItemId: editing?.id || null, staffId: editing?.staffId || staff[0]?.id || "", titleEn: editing ? displayTranslation(editing.title, "en-US", "") : "", titleFa: editing ? displayTranslation(editing.title, "fa-IR", "") : "", descriptionEn: editing ? displayTranslation(editing.description, "en-US", "") : "", descriptionFa: editing ? displayTranslation(editing.description, "fa-IR", "") : "", url: editing?.url || "", mediaType: (editing?.mediaType as any) || "image", displayOrder: editing?.displayOrder || 0, isPrimary: editing?.isPrimary || false }), [editing, providerId, staff]);
  const form = useForm<GalleryValues>({ resolver: zodResolver(saveStaffGalleryItemSchema), values });
  return <InlineForm onSubmit={form.handleSubmit((v) => startTransition(async () => { const r = await saveStaffGalleryItemAction(v); if (!r.ok) return toast.error(r.error || "Could not save."); toast.success("Staff media saved."); onDone(); router.refresh(); }))}>
    <input type="hidden" {...form.register("providerId")} /><input type="hidden" {...form.register("staffGalleryItemId")} />
    <StaffSelect form={form} staff={staff} disabled={isPending || !!editing} />
    <Field label="Title English"><Input {...form.register("titleEn")} disabled={isPending} /></Field>
    <Field label="Media URL / media id"><Input {...form.register("url")} disabled={isPending} /></Field>
    <Field label="Media type"><select {...form.register("mediaType")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="image">Image</option><option value="gif">GIF</option><option value="video">Video</option><option value="file">File</option></select></Field>
    <Field label="Description English"><Textarea {...form.register("descriptionEn")} rows={2} disabled={isPending} /></Field>
    <label className="flex items-center gap-2 pb-3 text-sm"><input type="checkbox" {...form.register("isPrimary")} /> Primary</label>
    <SubmitButtons editing={!!editing} pending={isPending} onCancel={onDone} />
  </InlineForm>;
}

function StaffSelect({ form, staff, disabled }: { form: any; staff: StaffRow[]; disabled?: boolean }) {
  return <Field label="Staff"><select {...form.register("staffId")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" disabled={disabled || !staff.length}>{staff.map((s) => <option key={s.id} value={s.id}>{s.displayName}</option>)}</select></Field>;
}

function InlineForm({ onSubmit, children }: { onSubmit: () => void; children: ReactNode }) {
  return <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 md:grid-cols-2">{children}</form>;
}

function SubmitButtons({ editing, pending, onCancel }: { editing: boolean; pending: boolean; onCancel: () => void }) {
  return <div className="flex items-end justify-end gap-2 md:col-span-2">{editing ? <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button> : null}<Button type="submit" disabled={pending}>{pending ? "Saving..." : editing ? "Update" : "Add"}</Button></div>;
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => Promise<{ ok: boolean; error?: string }> }) {
  const router = useRouter(); const [pending, startTransition] = useTransition();
  return <div className="flex gap-2"><Button size="sm" variant="outline" onClick={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit</Button><Button size="sm" variant="destructive" disabled={pending} onClick={() => { if (!confirm("Delete this record?")) return; startTransition(async () => { const r = await onDelete(); if (!r.ok) return toast.error(r.error || "Could not delete."); toast.success("Record deleted."); router.refresh(); }); }}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}

function RecordList<T>({ rows, empty, render }: { rows: T[]; empty: string; render: (row: T) => ReactNode }) {
  if (!rows.length) return <Empty text={empty} />;
  return <div className="space-y-3">{rows.map(render)}</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">{text}</div>;
}
