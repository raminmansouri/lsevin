import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderProfileRelatedRecords } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { policyTypeOptions, providerPortalBack, tr } from "@/features/provider-portal/lib/form-page-utils";

export default async function EditProviderPolicyPage({ params }: { params: Promise<{ locale: string; providerId: string; policyId: string }> }) {
  const { locale, providerId, policyId } = await params;
  const t = await getTranslations({ locale, namespace: "ProviderPortal.profile.related" });
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const related = await listProviderProfileRelatedRecords(userId, providerId, locale);
  const policy = related.policies.find((item) => item.id === policyId);
  if (!policy) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "policyId", type: "hidden" as const },
    { name: "providerPolicyTypeId", label: t("policies.fields.policyType"), type: "select" as const, options: policyTypeOptions(related.policyTypes), fullWidth: true },
    { name: "typeEn", label: t("policies.fields.typeEn"), type: "text" as const },
    { name: "typeFa", label: t("policies.fields.typeFa"), type: "text" as const },
    { name: "descriptionEn", label: t("policies.fields.descriptionEn"), type: "textarea" as const, rows: 5, fullWidth: true },
    { name: "descriptionFa", label: t("policies.fields.descriptionFa"), type: "textarea" as const, rows: 5, fullWidth: true },
  ];

  return <ProviderRecordForm operation="saveProviderPolicy" title={t("policies.editTitle")} description={t("policies.updateDescription")} fields={fields} initialValues={{ providerId, policyId: policy.id, providerPolicyTypeId: policy.providerPolicyTypeId || "", typeEn: tr(policy.type, "en-US"), typeFa: tr(policy.type, "fa-IR"), descriptionEn: tr(policy.description, "en-US"), descriptionFa: tr(policy.description, "fa-IR") }} backHref={providerPortalBack(providerId, "/profile/policies")} submitLabel={t("policies.saveButton")} successMessage={t("policies.updated")} />;
}
