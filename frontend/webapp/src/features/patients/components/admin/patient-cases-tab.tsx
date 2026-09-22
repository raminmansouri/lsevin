"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useRouter } from "@/i18n/navigation";

import { CASE_PRIORITIES } from "../../cases-schemas";
import type { MedicalCaseRow } from "../../cases-types";
import { createMedicalCaseAction } from "../../server/cases-actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

const PRIORITY_VARIANT: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  urgent: "destructive",
  high: "secondary",
  normal: "outline",
  low: "outline",
};

export function CasesTab({ patientId, cases }: { patientId: string; cases: MedicalCaseRow[] }) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{t("admin.cases.title")}</CardTitle>
        <Button type="button" size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
          {t("admin.cases.new")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {cases.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
        {cases.map((medicalCase) => (
          <Link
            key={medicalCase.id}
            href={`/admin/patients/${patientId}/cases/${medicalCase.id}`}
            className="hover:bg-accent flex items-center justify-between gap-2 rounded-md border-b px-2 py-2 last:border-0"
          >
            <div>
              <p className="text-sm font-medium">{medicalCase.title}</p>
              <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
                <span dir="ltr">{medicalCase.caseNumber}</span>
                <span dir="ltr">· {formatDate(medicalCase.openedAt)}</span>
              </div>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Badge variant={PRIORITY_VARIANT[medicalCase.priority] ?? "outline"}>{t(`admin.cases.priorities.${medicalCase.priority}`)}</Badge>
              <Badge variant="outline">{t(`admin.cases.statuses.${medicalCase.caseStatus}`)}</Badge>
            </div>
          </Link>
        ))}
      </CardContent>

      <CreateCaseDialog patientId={patientId} open={createOpen} onOpenChange={setCreateOpen} />
    </Card>
  );
}

function CreateCaseDialog({
  patientId,
  open,
  onOpenChange,
}: {
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [caseType, setCaseType] = useState("");
  const [priority, setPriority] = useState<(typeof CASE_PRIORITIES)[number]>("normal");

  const save = () => {
    startTransition(async () => {
      const result = await createMedicalCaseAction({ patientId, title: title.trim(), caseType: caseType.trim(), priority });
      if (result.ok && result.data) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        router.push(`/admin/patients/${patientId}/cases/${result.data.id}`);
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.cases.new")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.title")}</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.caseType")}</Label>
            <Input value={caseType} onChange={(event) => setCaseType(event.target.value)} placeholder={t("admin.cases.fields.caseTypePlaceholder")} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.priority")}</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CASE_PRIORITIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.cases.priorities.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !title.trim() || !caseType.trim()}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
