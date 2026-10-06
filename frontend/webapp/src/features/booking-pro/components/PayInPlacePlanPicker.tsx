'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';

import {
    applyPayInPlacePlan,
    isPayInPlacePlanId,
    PAY_IN_PLACE_PLAN_IDS,
    PAY_IN_PLACE_PLANS,
    type PayInPlacePlanId,
} from '../utils/pay-in-place-plans';

type DepositMethod = { code: string; name: string };

const TEXT = {
    fa: {
        heading: 'طرح پرداخت در محل',
        intro: 'بخشی از مبلغ را همین حالا پرداخت می‌کنید و باقی را در محل. هرچه سهم پرداخت اکنون کمتر باشد، درصد افزوده به فاکتور بیشتر است.',
        payNow: (pct: number) => `پرداخت ${pct}٪ اکنون`,
        surcharge: (pct: number) => `${pct}٪ به مبلغ فاکتور افزوده می‌شود`,
        bill: 'مبلغ فاکتور',
        dueNow: 'پرداخت اکنون',
        dueLater: 'پرداخت در محل',
        methodHeading: 'بخش «پرداخت اکنون» را چگونه پرداخت می‌کنید؟',
        noMethods: 'برای پرداخت بخش اکنون به کیف پول یا پرداخت آنلاین نیاز است و در حال حاضر برای شما در دسترس نیست.',
        loading: 'در حال بارگذاری روش‌های پرداخت...',
    },
    en: {
        heading: 'Pay in place: choose a plan',
        intro: 'You pay part of the bill now and the rest at the place. The less you pay now, the more is added to the bill.',
        payNow: (pct: number) => `Pay ${pct}% now`,
        surcharge: (pct: number) => `${pct}% is added to the bill`,
        bill: 'Bill',
        dueNow: 'Due now',
        dueLater: 'Due at the place',
        methodHeading: 'How do you want to pay the part due now?',
        noMethods: 'Paying the part due now needs a wallet or online payment, and neither is available for you right now.',
        loading: 'Loading payment methods...',
    },
} as const;

export function PayInPlacePlanPicker(props: {
    /** Currency code of the bill, e.g. 'USD' or 'IRR'. */
    currency: string;
    /** The bill after discounts and BEFORE any plan addition. */
    baseTotal: number;
    plan?: string | null;
    depositMethod?: string | null;
    disabled?: boolean;
    onChange: (next: { plan: PayInPlacePlanId; depositMethod: string }) => void;
}) {
    const locale = useLocale();
    const t = String(locale).toLowerCase().startsWith('fa') ? TEXT.fa : TEXT.en;
    const numberFormat = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }), [locale]);
    const money = (amount: number) => `${props.currency} ${numberFormat.format(amount)}`;

    const [methods, setMethods] = useState<DepositMethod[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let alive = true;
        fetch(`/api/booking-pro/payments/methods?locale=${encodeURIComponent(locale)}`, { cache: 'no-store' })
            .then((res) => res.json())
            .then((data) => {
                if (!alive) return;
                // Only the wallet and online payment can take the part due now. Bank receipt
                // is an unverified claim and pay-in-place itself moves no money.
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

    const selectedPlan = isPayInPlacePlanId(props.plan) ? props.plan : null;
    const selectedMethod = methods.some((m) => m.code === props.depositMethod) ? (props.depositMethod as string) : null;

    // A plan is chosen but its payment method is missing or no longer offered: settle on the first usable one.
    useEffect(() => {
        if (!selectedPlan || !loaded || methods.length === 0 || selectedMethod) return;
        props.onChange({ plan: selectedPlan, depositMethod: methods[0].code });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPlan, loaded, methods, selectedMethod]);

    const choosePlan = (plan: PayInPlacePlanId) => {
        if (props.disabled || methods.length === 0) return;
        props.onChange({ plan, depositMethod: selectedMethod ?? methods[0].code });
    };

    const chooseMethod = (code: string) => {
        if (props.disabled || !selectedPlan) return;
        props.onChange({ plan: selectedPlan, depositMethod: code });
    };

    return (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
                <div className="text-sm font-semibold text-slate-800">{t.heading}</div>
                <p className="mt-1 text-xs text-slate-500">{t.intro}</p>
            </div>

            {loaded && methods.length === 0 ? <div className="text-xs text-amber-700">{t.noMethods}</div> : null}
            {!loaded ? <div className="text-xs text-slate-500">{t.loading}</div> : null}

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
                            <div className="font-semibold text-slate-900">{t.payNow(plan.payNowPercent)}</div>
                            <div className="mt-0.5 text-xs text-slate-500">{t.surcharge(plan.surchargePercent)}</div>
                            <dl className="mt-2 space-y-1 text-xs text-slate-600">
                                <div className="flex justify-between gap-2">
                                    <dt>{t.bill}</dt>
                                    <dd className="font-medium text-slate-800">{money(breakdown.totalAmount)}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>{t.dueNow}</dt>
                                    <dd className="font-medium text-slate-800">{money(breakdown.dueNowAmount)}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt>{t.dueLater}</dt>
                                    <dd className="font-medium text-slate-800">{money(breakdown.dueLaterAmount)}</dd>
                                </div>
                            </dl>
                        </button>
                    );
                })}
            </div>

            {selectedPlan && methods.length > 0 ? (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                    <div className="text-xs font-semibold text-slate-600">{t.methodHeading}</div>
                    {methods.map((method) => (
                        <button
                            key={method.code}
                            type="button"
                            disabled={props.disabled}
                            onClick={() => chooseMethod(method.code)}
                            className={`w-full rounded-xl border px-3 py-2 text-start text-sm ${
                                selectedMethod === method.code ? 'border-[#083f30] bg-[#083f30]/5' : 'border-slate-200 bg-white'
                            }`}
                        >
                            {method.name}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
