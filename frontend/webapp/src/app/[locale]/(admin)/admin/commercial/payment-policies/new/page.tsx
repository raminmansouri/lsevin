import { getAdminCommercialPolicyLookups } from '@/features/commercial/api/server/get-admin-commercial';
import { BookingPaymentPolicyForm } from '@/features/commercial/components/admin/payment-policies/payment-policy-form';

export default async function NewBookingPaymentPolicyPage() {
  const lookups = await getAdminCommercialPolicyLookups();
  return <BookingPaymentPolicyForm lookups={lookups} />;
}
