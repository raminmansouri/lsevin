import { getAdminCurrencies } from '@/features/finance/api/server/get-admin-finance';
import { ExchangeRateForm } from '@/features/finance/components/admin/exchange-rate-form';

export default async function NewExchangeRatePage() {
  const currencies = await getAdminCurrencies();
  return <ExchangeRateForm currencies={currencies.filter((item) => item.isActive)} />;
}
