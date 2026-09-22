"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";

import { PATIENTS_TRANSLATION_KEY } from "../../types";
import type { PatientSearchResultRow } from "../../types";
import { PatientCreateDialog } from "./patient-create-dialog";
import { PatientsSearchTable } from "./patients-search-table";

export function PatientsAdminBoard({
  initialQuery,
  results,
}: {
  initialQuery: string;
  results: PatientSearchResultRow[];
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [createOpen, setCreateOpen] = useState(false);

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/admin/patients?q=${encodeURIComponent(trimmed)}` : "/admin/patients");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>{t("admin.search.title")}</CardTitle>
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {t("admin.create.trigger")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={search} className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("admin.search.placeholder")}
          />
          <Button type="submit" variant="outline">
            <Search className="size-4" />
            {t("admin.search.submit")}
          </Button>
        </form>

        {initialQuery ? (
          <PatientsSearchTable results={results} />
        ) : (
          <p className="text-muted-foreground py-6 text-center text-sm">{t("admin.search.prompt")}</p>
        )}
      </CardContent>

      <PatientCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </Card>
  );
}
