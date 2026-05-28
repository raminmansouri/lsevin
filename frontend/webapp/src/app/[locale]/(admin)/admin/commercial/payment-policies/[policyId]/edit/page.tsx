import { notFound } from 'next/navigation';

import { getAdminBookingPaymentPolicy, getAdminCommercialPolicyLookups } from '@/features/commercial/api/server/get-admin-commercial';
import { BookingPaymentPolicyForm } from '@/features/commercial/components/admin/payment-policies/payment-policy-form';

export default async function EditBookingPaymentPolicyPage({ params }: { params: Promise<{ policyId: string }>; }) {
  const { policyId } = await params;
  const [policy, lookups] = await Promise.all([
    getAdminBookingPaymentPolicy(policyId),
    getAdminCommercialPolicyLookups(),
  ]);
  if (!policy) notFound();
  return <BookingPaymentPolicyForm policy={policy as any} lookups={lookups} />;
}
