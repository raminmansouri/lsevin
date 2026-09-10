import { getTranslations } from "next-intl/server";
import { CompensationPolicyForm } from '@/features/commercial/components/admin/compensation-policy-form';
import { getAdminCommercialPolicyLookups } from '@/features/commercial/api/server/get-admin-commercial';

export default async function NewCommercialPolicyPage() {
  const t = await getTranslations("AdminPages");
  const lookups = await getAdminCommercialPolicyLookups();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("createCompensationPolicy")}</h1>
        <p className="text-sm text-muted-foreground">{t("createAScopeAwarePolicyThatAppliesTo")}</p>
      </div>
      <CompensationPolicyForm lookups={lookups} />
    </div>
  );
}
