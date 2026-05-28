import { notFound } from 'next/navigation';

import { getAdminRefundRequest } from '@/features/commercial/api/server/get-admin-commercial';
import { RefundRequestDetail } from '@/features/commercial/components/admin/refunds/refund-request-detail';

export default async function RefundRequestDetailPage({ params }: { params: Promise<{ refundRequestId: string }> }) {
  const { refundRequestId } = await params;
  const data = await getAdminRefundRequest(refundRequestId);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Refund request detail</h1>
        <p className="text-sm text-muted-foreground">Review refund scope, individual refunded lines, and execution results.</p>
      </div>
      <RefundRequestDetail data={data} />
    </div>
  );
}
