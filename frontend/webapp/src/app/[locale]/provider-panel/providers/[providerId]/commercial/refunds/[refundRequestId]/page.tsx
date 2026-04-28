import { notFound } from 'next/navigation';
import { getProviderRefundRequest } from '@/features/provider-commercial/server/repository';
import { ProviderRefundRequestDetail } from '@/features/provider-commercial/components/provider-refund-request-detail';

export default async function ProviderRefundRequestDetailPage({ params }: { params: Promise<{ providerId: string; refundRequestId: string }> }) {
  const { providerId, refundRequestId } = await params;
  const data = await getProviderRefundRequest(providerId, refundRequestId);
  if (!data) notFound();
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Refund request detail</h1><p className="text-sm text-muted-foreground">Provider-facing view of refund state and execution rows.</p></div>
      <ProviderRefundRequestDetail data={data} />
    </div>
  );
}
