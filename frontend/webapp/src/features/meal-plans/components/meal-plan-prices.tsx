'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type Plan = { code: 'room_only' | 'breakfast' | 'full_board'; amount: number; currencyCode: string };

// Read-only list of a room's meal plans and nightly prices, for the service page before booking.
// Same source as the booking wizard's picker, so both show the same converted prices.
// Renders nothing when the room only offers room-only.
export function MealPlanPrices(props: { serviceId: string }) {
  const locale = useLocale();
  const t = useTranslations('Booking');
  const [plans, setPlans] = useState<Plan[]>([]);

  const numberFormat = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    } catch {
      return new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
    }
  }, [locale]);

  useEffect(() => {
    let alive = true;
    fetch('/api/booking-pro/meal-plans?serviceId=' + encodeURIComponent(props.serviceId), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { plans: [] }))
      .then((data) => {
        if (alive) setPlans(Array.isArray(data?.plans) ? data.plans : []);
      })
      .catch(() => {
        if (alive) setPlans([]);
      });
    return () => {
      alive = false;
    };
  }, [props.serviceId]);

  if (plans.length < 2) return null;

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-base font-bold text-gray-900">{t('mealPlan.label')}</h2>
      <div className="space-y-2">
        {plans.map((plan) => (
          <div key={plan.code} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2">
            <span>
              <span className="block text-sm font-semibold text-gray-900">{t(('mealPlan.' + plan.code + '.name') as never)}</span>
              <span className="block text-xs text-gray-500">{t(('mealPlan.' + plan.code + '.description') as never)}</span>
            </span>
            <span className="shrink-0 text-sm font-bold text-[#083f30]">
              {plan.currencyCode + ' ' + numberFormat.format(plan.amount)} <span className="text-xs font-normal text-gray-500">· {t('stay.perNight')}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
