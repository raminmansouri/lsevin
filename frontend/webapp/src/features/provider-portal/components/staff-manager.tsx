"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, UserX } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { deleteStaffLinkAction, saveStaffAction } from "@/features/provider-portal/actions";
import { saveStaffSchema } from "@/features/provider-portal/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import { displayTranslation } from "../lib/normalizers";
import type { ProviderWorkspace, StaffRow } from "../types";

type FormValues = z.infer<typeof saveStaffSchema>;

export function StaffManager({ workspace, staff }: { workspace: ProviderWorkspace; staff: StaffRow[] }) {
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const canManage = workspace.permissions.manageStaff;

  return (
    <div className="space-y-6">
      {canManage ? <StaffForm providerId={workspace.provider.id} editing={editing} onDone={() => setEditing(null)} /> : null}

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Staff and specialists</CardTitle>
          <CardDescription>Create provider-owned staff records and link them to this provider.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {staff.length ? staff.map((item) => (
            <div key={item.providerStaffId} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.displayName}</h3>
                    <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{displayTranslation(item.title, "en-US", "-")}</p>
                  <p className="mt-2 text-sm text-slate-600">{displayTranslation(item.biography, "en-US", "-")}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    {item.specialty ? <Badge variant="outline">{item.specialty}</Badge> : null}
                    {item.experienceYears !== null ? <Badge variant="outline">{item.experienceYears} years</Badge> : null}
                    <Badge variant="outline">Fee {item.consultationFee}</Badge>
                  </div>
                </div>
                {canManage ? (
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(item)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <DeactivateStaffButton providerId={workspace.provider.id} providerStaffId={item.providerStaffId} />
                  </div>
                ) : null}
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">No staff yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StaffForm({ providerId, editing, onDone }: { providerId: string; editing: StaffRow | null; onDone: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues = useMemo<FormValues>(() => ({
    providerId,
    staffId: editing?.id || undefined,
    providerStaffId: editing?.providerStaffId || undefined,
    nameEn: editing ? displayTranslation(editing.name, "en-US", "") : "",
    nameFa: editing ? displayTranslation(editing.name, "fa-IR", "") : "",
    titleEn: editing ? displayTranslation(editing.title, "en-US", "") : "",
    titleFa: editing ? displayTranslation(editing.title, "fa-IR", "") : "",
    biographyEn: editing ? displayTranslation(editing.biography, "en-US", "") : "",
    biographyFa: editing ? displayTranslation(editing.biography, "fa-IR", "") : "",
    profileImageUrl: editing?.profileImageUrl || "",
    specialty: editing?.specialty || "",
    experienceYears: editing?.experienceYears || undefined,
    consultationFee: editing?.consultationFee || 0,
    notesEn: editing ? displayTranslation(editing.notes, "en-US", "") : "",
    notesFa: editing ? displayTranslation(editing.notes, "fa-IR", "") : "",
    isActive: editing?.isActive ?? true,
  }), [providerId, editing]);

  const form = useForm<FormValues>({
    resolver: zodResolver(saveStaffSchema),
    values: defaultValues,
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const response = await saveStaffAction(values);
      if (!response.ok) {
        toast.error(response.error || "Staff could not be saved.");
        return;
      }
      toast.success(editing ? "Staff updated." : "Staff created.");
      onDone();
      router.refresh();
    });
  };

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> {editing ? "Edit staff" : "Add staff"}
        </CardTitle>
        <CardDescription>Specialists remain linked to the selected provider only.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" {...form.register("providerId")} />
          <input type="hidden" {...form.register("staffId")} />
          <input type="hidden" {...form.register("providerStaffId")} />

          <Field label="Name English" error={form.formState.errors.nameEn?.message}>
            <Input {...form.register("nameEn")} disabled={isPending} />
          </Field>
          <Field label="Name Persian">
            <Input {...form.register("nameFa")} disabled={isPending} />
          </Field>
          <Field label="Title English">
            <Input {...form.register("titleEn")} disabled={isPending} />
          </Field>
          <Field label="Title Persian">
            <Input {...form.register("titleFa")} disabled={isPending} />
          </Field>
          <Field label="Biography English" className="md:col-span-2">
            <Textarea {...form.register("biographyEn")} rows={4} disabled={isPending} />
          </Field>
          <Field label="Biography Persian" className="md:col-span-2">
            <Textarea {...form.register("biographyFa")} rows={4} disabled={isPending} />
          </Field>
          <Field label="Profile image URL / media id">
            <Input {...form.register("profileImageUrl")} disabled={isPending} />
          </Field>
          <Field label="Specialty">
            <Input {...form.register("specialty")} disabled={isPending} />
          </Field>
          <Field label="Experience years">
            <Input {...form.register("experienceYears")} type="number" disabled={isPending} />
          </Field>
          <Field label="Consultation fee">
            <Input {...form.register("consultationFee")} type="number" step="0.01" disabled={isPending} />
          </Field>
          <Field label="Provider notes English">
            <Input {...form.register("notesEn")} disabled={isPending} />
          </Field>
          <Field label="Provider notes Persian">
            <Input {...form.register("notesFa")} disabled={isPending} />
          </Field>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" {...form.register("isActive")} className="h-4 w-4 rounded border-slate-300" />
            Active
          </label>
          <div className="flex justify-end gap-3 border-t pt-5 md:col-span-2">
            {editing ? <Button type="button" variant="outline" onClick={onDone}>Cancel edit</Button> : null}
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : editing ? "Save staff" : "Add staff"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DeactivateStaffButton({ providerId, providerStaffId }: { providerId: string; providerStaffId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Deactivate this staff link?")) return;
        startTransition(async () => {
          const response = await deleteStaffLinkAction({ providerId, providerStaffId });
          if (!response.ok) {
            toast.error(response.error || "Staff could not be deactivated.");
            return;
          }
          toast.success("Staff deactivated.");
          router.refresh();
        });
      }}
    >
      <UserX className="mr-2 h-4 w-4" /> Deactivate
    </Button>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`space-y-2 ${className || ""}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </label>
  );
}
