import { getTranslations } from "next-intl/server";
import { notFound } from 'next/navigation';

import { getAdminCompensationPolicy } from '@/features/commercial/api/server/get-admin-commercial';
import { CompensationPolicyForm } from '@/features/commercial/components/admin/compensation-policy-form';
import { getAdminCommercialPolicyLookups } from '@/features/commercial/api/server/get-admin-commercial';

export default async function EditCommercialPolicyPage({ params }: { params: Promise<{ policyId: string }> }) {
  const t = await getTranslations("AdminPages");
  const { policyId } = await params;
  const [policy, lookups] = await Promise.all([
    getAdminCompensationPolicy(policyId),
    getAdminCommercialPolicyLookups(),
  ]);
  if (!policy) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("editCompensationPolicy")}</h1>
        <p className="text-sm text-muted-foreground">{t("updatePriorityScopePricingModelAndActiveWindows")}</p>
      </div>
      <CompensationPolicyForm policy={policy} lookups={lookups} />
    </div>
  );
}
