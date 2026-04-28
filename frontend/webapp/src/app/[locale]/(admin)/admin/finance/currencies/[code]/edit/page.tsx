import { notFound } from 'next/navigation';
import { getAdminCurrencyByCode } from '@/features/finance/api/server/get-admin-finance';
import { CurrencyForm } from '@/features/finance/components/admin/currency-form';

export default async function EditCurrencyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const currency = await getAdminCurrencyByCode(code);
  if (!currency) notFound();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit currency</h1>
        <p className="text-sm text-muted-foreground">Update activation and usage flags for this currency.</p>
      </div>
      <CurrencyForm currency={currency} />
    </div>
  );
}
