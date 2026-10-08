'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import {
    applyPayInPlacePlan,
    isPayInPlacePlanId,
    PAY_IN_PLACE_PLAN_IDS,
    PAY_IN_PLACE_PLANS,
    type PayInPlacePlanId,
} from '../utils/pay-in-place-plans';

type DepositMethod = { code: string; name: string };

export function PayInPlacePlanPicker(props: {
    /** Currency code of the bill, e.g. 'EUR' or 'IRR'. */
    currency: string;
    /** The bill after discounts and BEFORE any plan addition. */
    baseTotal: number;
    plan?: string | null;
    depositMethod?: string | null;
    disabled?: boolean;
    onChange: (next: { plan: PayInPlacePlanId; depositMethod: string }) => void;
}) {
    const locale = useLocale();
    const t = useTranslations('Booking');

    const numberFormat = useMemo(() => {
        try {
            return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
        } catch {
            return new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
        }
    }, [locale]);
    const money = (amount: number) => `${props.currency} ${numberFormat.format(amount)}`;

    const [methods, setMethods] = useState<DepositMethod[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let alive = true;
        fetch(`/api/booking-pro/payments/methods?locale=${encodeURIComponent(locale)}`, { cache: 'no-store' })
            .then((res) => res.json())
            .then((data) => {
                if (!alive) return;
                // Only the wallet and online payment can take the part due now. Bank receipt is an
                // unverified claim and pay-in-place itself moves no money.
                const usable = ((data?.items ?? []) as DepositMethod[]).filter(
                    (item) => item.code === 'wallet' || item.code === 'gateway_card',
                );
                setMethods(usable);
            })
            .catch(() => {})
            .finally(() => alive && setLoaded(true));
        return () => {
            alive = false;
        };
    }, [locale]);

    // Names come from the app's own translations, not from the database row (which only
    // holds fa/en text), so every supported language shows them in its own words.
    const methodLabel = (method: DepositMethod) =>
        method.code === 'wallet'
            ? t('builtinPaymentMethods.wallet.name')
            : method.code === 'gateway_card'
                ? t('onlineCardPayment')
                : method.name;

    const selectedPlan = isPayInPlacePlanId(props.plan) ? props.plan : null;
    const selectedMethod = methods.some((m) => m.code === props.depositMethod) ? (props.depositMethod as string) : null;

    // Online card is the default for the part due now; the wallet only when card isn't offered.
    const defaultMethod = methods.find((m) => m.code === 'gateway_card')?.code ?? methods[0]?.code;

    // A plan is chosen but its payment method is missing or no longer offered: settle on the default one.
    useEffect(() => {
        if (!selectedPlan || !loaded || !defaultMethod || selectedMethod) return;
        props.onChange({ plan: selectedPlan, depositMethod: defaultMethod });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPlan, loaded, defaultMethod, selectedMethod]);

    const choosePlan = (plan: PayInPlacePlanId) => {
        if (props.disabled || !defaultMethod) return;
        props.onChange({ plan, depositMethod: selectedMethod ?? defaultMethod });
    };

    const chooseMethod = (code: string) => {
        if (props.disabled || !selectedPlan) return;
        props.onChange({ plan: selectedPlan, depositMethod: code });
    };

    return (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
                <div className="text-sm font-semibold text-slate-800">{t('payInPlace.heading')}</div>
                <p className="mt-1 text-xs text-slate-500">{t('payInPlace.intro')}</p>
            </div>

            {loaded && methods.length === 0 ? <div className="text-xs text-amber-700">{t('payInPlace.noMethods')}</div> : null}
            {!loaded ? <div className="text-xs text-slate-500">{t('payInPlace.loading')}</div> : null}

            <div className="space-y-2">
                {PAY_IN_PLACE_PLAN_IDS.map((id) => {
                    const plan = PAY_IN_PLACE_PLANS[id];
                    const breakdown = applyPayInPlacePlan(props.baseTotal, props.currency, id);
                    const active = selectedPlan === id;
                    return (
                        <button
                            key={id}
                            type="button"
                            disabled={props.disabled || methods.length === 0}
                            onClick={() => choosePlan(id)}
                            className={`w-full rounded-2xl border px-4 py-3 text-start disabled:opacity-60 ${
                                active ? 'border-[#083f30] bg-[#083f30]/5' : 'border-slate-200 bg-white'
                            }`}
                        >
                            <div className="font-semibold text-slate-900">{t('payInPlace.payNow', { percent: plan.payNowPercent })}</div>
                            <div className="mt-0.5 text-xs text-slate-500">{t('payInPlace.surcharge', { percent: plan.surchargePercent })}</div>
                            <dl className="mt-2 space-y-1 text-xs text-slate-600">
                                <div className="flex justify-between gap-2">
                                    <dt>{t('payInPlace.bill')}</dt>
                                    <dd className="font-medium text-slate-800">{money(breakdown.totalAmount)}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>{t('payInPlace.dueNow')}</dt>
                                    <dd className="font-medium text-slate-800">{money(breakdown.dueNowAmount)}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>{t('payInPlace.dueLater')}</dt>
                                    <dd className="font-medium text-slate-800">{money(breakdown.dueLaterAmount)}</dd>
                                </div>
                            </dl>
                        </button>
                    );
                })}
            </div>

            {selectedPlan && methods.length > 0 ? (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                    <div className="text-xs font-semibold text-slate-600">{t('payInPlace.methodHeading')}</div>
                    {methods.map((method) => (
                        <button
                            key={method.code}
                            type="button"
                            disabled={props.disabled}
                            onClick={() => chooseMethod(method.code)}
                            className={`w-full rounded-xl border px-3 py-2 text-center text-sm transition-colors ${
                                selectedMethod === method.code
                                    ? 'border-emerald-600 bg-emerald-600 font-semibold text-white'
                                    : 'border-slate-200 bg-white text-slate-800'
                            }`}
                        >
                            {methodLabel(method)}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
