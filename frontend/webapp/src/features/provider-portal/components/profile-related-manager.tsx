"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, ShieldCheck, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  deleteProviderCertificationAction,
  deleteProviderPolicyAction,
  saveProviderCertificationAction,
  saveProviderPolicyAction,
} from "@/features/provider-portal/actions";
import { saveProviderCertificationSchema, saveProviderPolicySchema } from "@/features/provider-portal/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import SingleMediaPickerInput from "@/features/media-picker-addon/components/SingleMediaPickerInput";

import { LocalizedRichPreview } from "./localized-rich-preview";
import { displayTranslation } from "../lib/normalizers";
import type { ProviderCertificationRow, ProviderPolicyRow, ProviderProfileRelatedRecords, ProviderWorkspace } from "../types";

type CertificationFormValues = z.infer<typeof saveProviderCertificationSchema>;
type PolicyFormValues = z.infer<typeof saveProviderPolicySchema>;

export function ProfileRelatedManager({
  workspace,
  related,
  focus = "all",
}: {
  workspace: ProviderWorkspace;
  related: ProviderProfileRelatedRecords;
  focus?: "all" | "certifications" | "policies";
}) {
  if (!workspace.permissions.manageProfile) return null;

  const showCertifications = focus === "all" || focus === "certifications";
  const showPolicies = focus === "all" || focus === "policies";

  return (
    <div className={focus === "all" ? "grid gap-6 xl:grid-cols-2" : "space-y-6"}>
      {showCertifications ? <ProviderCertificationsCard providerId={workspace.provider.id} certifications={related.certifications} /> : null}
      {showPolicies ? <ProviderPoliciesCard providerId={workspace.provider.id} related={related} /> : null}
    </div>
  );
}

function ProviderCertificationsCard({ providerId, certifications }: { providerId: string; certifications: ProviderCertificationRow[] }) {
  const t = useTranslations("ProviderPortal.profile.related");
  const [editing, setEditing] = useState<ProviderCertificationRow | null>(null);

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> {t("certifications.title")}</CardTitle>
        <CardDescription>{t("certifications.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <CertificationForm providerId={providerId} editing={editing} onDone={() => setEditing(null)} />
        <div className="space-y-3">
          {certifications.length ? certifications.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-950">{item.name}</p>
                  <Badge variant={item.isVerified ? "default" : "secondary"}>{item.isVerified ? t("certifications.verified") : t("certifications.providerAdded")}</Badge>
                </div>
                {item.isVerified ? <p className="mt-1 text-xs text-slate-500">{t("certifications.verifiedLocked")}</p> : null}
                {(item.imageUrl || item.secondaryImageUrl) ? (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    {item.imageUrl ? <span className="rounded-full bg-slate-100 px-2 py-1">{t("certifications.image1Attached")}</span> : null}
                    {item.secondaryImageUrl ? <span className="rounded-full bg-slate-100 px-2 py-1">{t("certifications.image2Attached")}</span> : null}
                  </div>
                ) : null}
              </div>
              {!item.isVerified ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(item)}><Edit className="mr-2 h-4 w-4" /> {t("buttons.edit")}</Button>
                  <DeleteButton label={t("buttons.delete")} onDelete={async () => deleteProviderCertificationAction({ providerId, certificationId: item.id })} />
                </div>
              ) : null}
            </div>
          )) : <Empty text={t("certifications.empty")} />}
        </div>
      </CardContent>
    </Card>
  );
}

function CertificationForm({ providerId, editing, onDone }: { providerId: string; editing: ProviderCertificationRow | null; onDone: () => void }) {
  const router = useRouter();
  const t = useTranslations("ProviderPortal.profile.related");
  const [isPending, startTransition] = useTransition();
  const form = useForm<CertificationFormValues>({
    resolver: zodResolver(saveProviderCertificationSchema),
    values: {
      providerId,
      certificationId: editing?.id || null,
      name: editing?.name || "",
      imageUrl: editing?.imageUrl || null,
      secondaryImageUrl: editing?.secondaryImageUrl || null,
    },
  });

  const onSubmit = (values: CertificationFormValues) => {
    startTransition(async () => {
      const response = await saveProviderCertificationAction(values);
      if (!response.ok) return toast.error(response.error || t("certifications.saveFailed"));
      toast.success(t("certifications.saveSuccess"));
      form.reset({ providerId, certificationId: null, name: "", imageUrl: null, secondaryImageUrl: null });
      onDone();
      router.refresh();
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
      <input type="hidden" {...form.register("providerId")} />
      <input type="hidden" {...form.register("certificationId")} />
      <Field label={t("certifications.fields.name")} error={form.formState.errors.name?.message}>
        <Input {...form.register("name")} placeholder={t("certifications.placeholders.name")} disabled={isPending} />
      </Field>
      <div className="flex gap-2">
        {editing ? <Button type="button" variant="outline" onClick={onDone}>{t("buttons.cancel")}</Button> : null}
        <Button type="submit" disabled={isPending}>{isPending ? t("buttons.saving") : editing ? t("buttons.update") : t("buttons.add")}</Button>
      </div>
      <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
        <SingleMediaPickerInput
          name="imageUrl"
          label={t("certifications.fields.image")}
          placeholder={t("certifications.placeholders.image")}
          mediaType="image"
          value={form.watch("imageUrl") || ""}
          onValueChange={(value) => form.setValue("imageUrl", value || null, { shouldDirty: true })}
          disabled={isPending}
          helperText={t("certifications.helpers.image")}
          modalTitle={t("certifications.modalTitle.image")}
        />
        <SingleMediaPickerInput
          name="secondaryImageUrl"
          label={t("certifications.fields.secondImage")}
          placeholder={t("certifications.placeholders.secondImage")}
          mediaType="image"
          value={form.watch("secondaryImageUrl") || ""}
          onValueChange={(value) => form.setValue("secondaryImageUrl", value || null, { shouldDirty: true })}
          disabled={isPending}
          helperText={t("certifications.helpers.secondImage")}
          modalTitle={t("certifications.modalTitle.secondImage")}
        />
      </div>
    </form>
  );
}

function ProviderPoliciesCard({ providerId, related }: { providerId: string; related: ProviderProfileRelatedRecords }) {
  const t = useTranslations("ProviderPortal.profile.related");
  const [editing, setEditing] = useState<ProviderPolicyRow | null>(null);

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>{t("policies.title")}</CardTitle>
        <CardDescription>{t("policies.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <PolicyForm providerId={providerId} policyTypes={related.policyTypes} editing={editing} onDone={() => setEditing(null)} />
        <div className="space-y-3">
          {related.policies.length ? related.policies.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{item.displayType || t("policies.fallbackType")}</p>
                  <div className="mt-2 text-sm text-slate-600"><LocalizedRichPreview translations={item.description} /></div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(item)}><Edit className="mr-2 h-4 w-4" /> {t("buttons.edit")}</Button>
                  <DeleteButton label={t("buttons.delete")} onDelete={async () => deleteProviderPolicyAction({ providerId, policyId: item.id })} />
                </div>
              </div>
            </div>
          )) : <Empty text={t("policies.empty")} />}
        </div>
      </CardContent>
    </Card>
  );
}

function PolicyForm({
  providerId,
  policyTypes,
  editing,
  onDone,
}: {
  providerId: string;
  policyTypes: ProviderProfileRelatedRecords["policyTypes"];
  editing: ProviderPolicyRow | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("ProviderPortal.profile.related");
  const [isPending, startTransition] = useTransition();
  const defaultTypeId = policyTypes[0]?.id || null;

  const values = useMemo<PolicyFormValues>(() => ({
    providerId,
    policyId: editing?.id || null,
    providerPolicyTypeId: editing?.providerPolicyTypeId || defaultTypeId,
    typeEn: editing ? displayTranslation(editing.type, "en-US", "") : "",
    typeFa: editing ? displayTranslation(editing.type, "fa-IR", "") : "",
    descriptionEn: editing ? displayTranslation(editing.description, "en-US", "") : "",
    descriptionFa: editing ? displayTranslation(editing.description, "fa-IR", "") : "",
  }), [defaultTypeId, editing, providerId]);

  const form = useForm<PolicyFormValues>({ resolver: zodResolver(saveProviderPolicySchema), values });

  const onSubmit = (formValues: PolicyFormValues) => {
    startTransition(async () => {
      const response = await saveProviderPolicyAction(formValues);
      if (!response.ok) return toast.error(response.error || t("policies.saveFailed"));
      toast.success(t("policies.saveSuccess"));
      onDone();
      router.refresh();
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <input type="hidden" {...form.register("providerId")} />
      <input type="hidden" {...form.register("policyId")} />
      <Field label={t("policies.fields.policyType")}>
        <select {...form.register("providerPolicyTypeId")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" disabled={isPending}>
          <option value="">{t("policies.customPolicy")}</option>
          {policyTypes.map((item) => <option key={item.id} value={item.id}>{item.label || item.code}</option>)}
        </select>
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("policies.fields.typeEn")}><Input {...form.register("typeEn")} disabled={isPending} /></Field>
        <Field label={t("policies.fields.typeFa")}><Input {...form.register("typeFa")} disabled={isPending} /></Field>
      </div>
      <Field label={t("policies.fields.descriptionEn")}><Textarea {...form.register("descriptionEn")} rows={3} disabled={isPending} /></Field>
      <Field label={t("policies.fields.descriptionFa")}><Textarea {...form.register("descriptionFa")} rows={3} disabled={isPending} /></Field>
      <div className="flex justify-end gap-2">
        {editing ? <Button type="button" variant="outline" onClick={onDone}>{t("buttons.cancel")}</Button> : null}
        <Button type="submit" disabled={isPending}>{isPending ? t("buttons.saving") : editing ? t("buttons.updatePolicy") : t("buttons.addPolicy")}</Button>
      </div>
    </form>
  );
}

function DeleteButton({ label, onDelete }: { label: string; onDelete: () => Promise<{ ok: boolean; error?: string }> }) {
  const router = useRouter();
  const t = useTranslations("ProviderPortal.profile.related");
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      disabled={isPending}
      onClick={() => {
        if (!confirm(t("delete.confirm"))) return;
        startTransition(async () => {
          const response = await onDelete();
          if (!response.ok) return toast.error(response.error || t("delete.failed"));
          toast.success(t("delete.success"));
          router.refresh();
        });
      }}
    >
      <Trash2 className="mr-2 h-4 w-4" /> {label}
    </Button>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">{text}</div>;
}
