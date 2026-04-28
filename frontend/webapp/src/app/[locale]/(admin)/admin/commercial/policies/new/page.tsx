import { CompensationPolicyForm } from '@/features/commercial/components/admin/compensation-policy-form';
import { getAdminCommercialPolicyLookups } from '@/features/commercial/api/server/get-admin-commercial';

export default async function NewCommercialPolicyPage() {
  const lookups = await getAdminCommercialPolicyLookups();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create compensation policy</h1>
        <p className="text-sm text-muted-foreground">Create a scope-aware policy that applies to main bookings, child bookings, or add-ons.</p>
      </div>
      <CompensationPolicyForm lookups={lookups} />
    </div>
  );
}
