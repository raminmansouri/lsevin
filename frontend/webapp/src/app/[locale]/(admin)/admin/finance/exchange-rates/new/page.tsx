import { getAdminCurrencies } from '@/features/finance/api/server/get-admin-finance';
import { ExchangeRateForm } from '@/features/finance/components/admin/exchange-rate-form';

export default async function NewExchangeRatePage() {
  const currencies = await getAdminCurrencies();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create exchange rate</h1>
        <p className="text-sm text-muted-foreground">Insert a latest rate row that pricing and quote resolution can use immediately.</p>
      </div>
      <ExchangeRateForm currencies={currencies} />
    </div>
  );
}
