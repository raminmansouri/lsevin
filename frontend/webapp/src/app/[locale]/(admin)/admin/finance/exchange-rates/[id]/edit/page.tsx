import { notFound } from 'next/navigation';

import { getAdminCurrencies, getAdminExchangeRateById } from '@/features/finance/api/server/get-admin-finance';
import { ExchangeRateForm } from '@/features/finance/components/admin/exchange-rate-form';

export default async function EditExchangeRatePage({
                                                       params,
                                                   }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const [currencies, existingRate] = await Promise.all([
        getAdminCurrencies(),
        getAdminExchangeRateById(id),
    ]);

    if (!existingRate) {
        notFound();
    }

    return (
        <ExchangeRateForm
            currencies={currencies.filter((item) => item.isActive)}
            existingRate={existingRate}
        />
    );
}
