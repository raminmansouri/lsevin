"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";

import { PASSPORT_LANGUAGES, PASSPORT_SECTIONS } from "../../passport-types";
import type { PatientPassportRow } from "../../passport-types";
import { generatePatientPassportAction } from "../../server/passport-actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function PassportTab({ patientId, passports }: { patientId: string; passports: PatientPassportRow[] }) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [language, setLanguage] = useState<(typeof PASSPORT_LANGUAGES)[number]>("en");
  const [sections, setSections] = useState<string[]>([...PASSPORT_SECTIONS]);

  const toggleSection = (section: string) => {
    setSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]));
  };

  const generate = () => {
    if (sections.length === 0) return;
    startTransition(async () => {
      const result = await generatePatientPassportAction({ patientId, language, includedSections: sections as never });
      if (result.ok) {
        toast.success(t("admin.passport.generated"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.passport.generate")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-xs">{t("admin.passport.missingSectionsNotice")}</p>

          <div className="space-y-2">
            <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PASSPORT_LANGUAGES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.passport.languages.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            {PASSPORT_SECTIONS.map((section) => (
              <label key={section} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={sections.includes(section)} onChange={() => toggleSection(section)} />
                {t(`admin.passport.sections.${section}`)}
              </label>
            ))}
          </div>

          <Button type="button" size="sm" disabled={isPending || sections.length === 0} onClick={generate}>
            {t("admin.passport.generate")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.passport.history")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {passports.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {passports.map((passport) => (
            <div key={passport.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{t(`admin.passport.languages.${passport.language}`)}</p>
                <p dir="ltr" className="text-muted-foreground text-xs">
                  {formatDateTime(passport.createdAt)}
                </p>
              </div>
              <Button asChild type="button" size="sm" variant="ghost">
                <a href={`/api/v1/patients/${patientId}/passports/${passport.id}/fhir`} target="_blank" rel="noreferrer">
                  <Download className="size-4" />
                  {t("admin.passport.viewFhirBundle")}
                </a>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
