import { notFound } from 'next/navigation';

import { getAdminCurrencies } from '@/features/finance/api/server/get-admin-finance';
import { CurrencyForm } from '@/features/finance/components/admin/currency-form';

export default async function EditCurrencyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const currencies = await getAdminCurrencies();
  const currency = currencies.find((item) => item.code === code.toUpperCase());

  if (!currency) notFound();

  return <CurrencyForm currency={currency} />;
}
