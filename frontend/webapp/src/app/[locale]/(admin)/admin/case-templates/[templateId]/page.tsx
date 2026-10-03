import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page/page-header";
import { ProcessTemplateEditor } from "@/features/case-management/components/process-template-editor";
import { getProcessTemplate } from "@/features/case-management/server/admin-repository";

export default async function ProcessTemplateDetailPage({
  params,
}: {
  params: Promise<{ locale: string; templateId: string }>;
}) {
  const { locale, templateId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(templateId)) notFound();
  const [template, t] = await Promise.all([
    getProcessTemplate(templateId, locale),
    getTranslations({ locale, namespace: "CaseManagement" }),
  ]);
  if (!template) notFound();
  return (
    <div className="space-y-6">
      <PageHeader
        title={template.name}
        description={`${template.scopeName} · v${template.version}`}
      />
      <ProcessTemplateEditor
        template={template}
        readOnly={!template.isActive}
      />
      {!template.isActive && (
        <p className="text-muted-foreground text-sm">
          {t("templateEditor.archivedVersion")}
        </p>
      )}
    </div>
  );
}
