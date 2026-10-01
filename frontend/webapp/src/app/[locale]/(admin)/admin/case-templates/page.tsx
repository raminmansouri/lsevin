import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listProcessTemplates } from "@/features/case-management/server/admin-repository";

export default async function CaseTemplatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [templates, t] = await Promise.all([listProcessTemplates(locale), getTranslations({ locale, namespace: "CaseManagement" })]);
  return <div className="space-y-6">
    <PageHeader title={t("templates")} description={t("description")} />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => <Card key={template.id}><CardContent className="space-y-3 p-5"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{template.name}</p><p className="text-sm text-muted-foreground">{template.scopeName}</p></div>{template.isActive && <Badge>{t("active")}</Badge>}</div><div className="flex justify-between text-xs text-muted-foreground"><span>{t("steps")}: {template.stepCount}</span><span>v{template.version}</span></div></CardContent></Card>)}
      {templates.length === 0 && <div className="col-span-full rounded-xl border border-dashed p-10 text-center text-muted-foreground">{t("noCases")}</div>}
    </div>
  </div>;
}
