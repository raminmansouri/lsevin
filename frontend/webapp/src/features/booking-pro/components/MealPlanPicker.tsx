'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type PlanCode = 'room_only' | 'breakfast' | 'full_board';
type Plan = { code: PlanCode; amount: number; currencyCode: string };

// Shown only when the room offers more than room-only. Prices come from the server already
// converted for this visitor, per night.
export function MealPlanPicker(props: {
  serviceId?: string | null;
  value?: string | null;
  disabled?: boolean;
  onChange: (code: PlanCode) => void;
  // Lets the parent show the chosen plan's nightly price (e.g. in the nights line).
  onPlansLoaded?: (plans: Plan[]) => void;
}) {
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
    if (!props.serviceId) {
      setPlans([]);
      return;
    }
    let alive = true;
    fetch('/api/booking-pro/meal-plans?serviceId=' + encodeURIComponent(props.serviceId), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { plans: [] }))
      .then((data) => {
        const next = Array.isArray(data?.plans) ? data.plans : [];
        if (alive) { setPlans(next); props.onPlansLoaded?.(next); }
      })
      .catch(() => {
        if (alive) { setPlans([]); props.onPlansLoaded?.([]); }
      });
    return () => {
      alive = false;
    };
  }, [props.serviceId]);

  // Nothing to choose when the room only offers room-only.
  if (plans.length < 2) return null;

  // A saved plan this room does not offer counts as room-only (the server ignores it too).
  const selected = plans.some((p) => p.code === props.value) ? props.value : 'room_only';

  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold text-slate-800">{t('mealPlan.chooseTitle')}</div>
      {plans.map((plan) => {
        const active = selected === plan.code;
        return (
          <button
            key={plan.code}
            type="button"
            disabled={props.disabled}
            onClick={() => props.onChange(plan.code)}
            className={'flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-start disabled:opacity-60 ' + (active ? 'border-[#083f30] bg-[#083f30]/5' : 'border-slate-200 bg-white')}
          >
            <span>
              <span className="block text-sm font-semibold text-slate-900">{t(('mealPlan.' + plan.code + '.name') as never)}</span>
              <span className="block text-xs text-slate-500">{t(('mealPlan.' + plan.code + '.description') as never)}</span>
            </span>
            <span className="shrink-0 text-sm font-semibold text-slate-900">
              {plan.currencyCode + ' ' + numberFormat.format(plan.amount)} <span className="text-xs font-normal text-slate-500">· {t('stay.perNight')}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
