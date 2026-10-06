'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { reservePackageAction } from '@/features/special-packages/server/actions';

type PaymentMethod = {
    code: string;
    name: string;
    description: string;
    provider: string | null;
};

export default function PackageCheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const packageId = String(params?.packageId || '');

    const [bookingId, setBookingId] = useState<string | null>(null);
    const [amount, setAmount] = useState<number | null>(null);
    const [currency, setCurrency] = useState<string | null>(null);
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [step, setStep] = useState<'creating' | 'choosing' | 'paying' | 'error'>('creating');
    const [error, setError] = useState<string | null>(null);

    // Step 1: create the booking the instant this page loads — the customer
    // chose nothing, so there is nothing to wait on before reserving it.
    useEffect(() => {
        let alive = true;

        (async () => {
            const result = await reservePackageAction({ packageId });
            if (!alive) return;

            if (!result.ok) {
                setError(
                    result.error === 'PACKAGE_NOT_BOOKABLE_YET'
                        ? 'این پکیج هنوز برای رزرو آماده نشده است.'
                        : result.error
                );
                setStep('error');
                return;
            }

            setBookingId(result.bookingId);
            setAmount(result.amount);
            setCurrency(result.currency);

            try {
                const res = await fetch('/api/booking-pro/payments/methods');
                const data = await res.json();
                if (!alive) return;
                setMethods(data.items ?? []);
                setStep('choosing');
            } catch {
                if (!alive) return;
                setError('بارگذاری روش‌های پرداخت با خطا مواجه شد.');
                setStep('error');
            }
        })();

        return () => {
            alive = false;
        };
        // packageId is stable for the life of this page.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function pay() {
        if (!bookingId || !selectedMethod) return;
        setStep('paying');
        setError(null);

        try {
            const res = await fetch('/api/booking-pro/payments/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, paymentMethodCode: selectedMethod }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'پرداخت با خطا مواجه شد.');
                setStep('choosing');
                return;
            }

            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
                return;
            }

            // Wallet (and any other instantly-settled method) returns no redirect —
            // the booking is already paid, so go straight to its invoice.
            router.push(`/n/app/mobile/bookings/${bookingId}/invoice`);
        } catch {
            setError('پرداخت با خطا مواجه شد.');
            setStep('choosing');
        }
    }

    return (
        <div className="min-h-screen bg-white pb-24">
            <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-gray-100 bg-white px-5 pb-4 pt-3">
                <Link
                    href={`/n/app/mobile/packages/${packageId}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
                >
                    <ChevronLeft size={24} className="text-gray-700 rtl:rotate-180" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900">پرداخت پکیج</h1>
            </div>

            <div className="px-5 py-6">
                {step === 'creating' && (
                    <div className="flex flex-col items-center gap-3 py-16 text-gray-500">
                        <Loader2 size={28} className="animate-spin" />
                        <p className="text-sm">در حال ثبت رزرو...</p>
                    </div>
                )}

                {step === 'error' && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center">
                        <p className="text-sm text-red-700">{error}</p>
                        <Link
                            href={`/n/app/mobile/packages/${packageId}`}
                            className="mt-4 inline-block rounded-xl bg-[#083f30] px-5 py-2 text-sm font-semibold text-white"
                        >
                            بازگشت
                        </Link>
                    </div>
                )}

                {(step === 'choosing' || step === 'paying') && (
                    <>
                        {amount != null && currency ? (
                            <div className="mb-6 rounded-2xl bg-gray-50 px-4 py-4">
                                <div className="text-sm text-gray-500">مبلغ قابل پرداخت</div>
                                <div className="mt-1 text-2xl font-bold text-[#083f30]">
                                    {amount.toLocaleString()} {currency}
                                </div>
                            </div>
                        ) : null}

                        <div className="mb-3 text-sm font-bold text-gray-900">روش پرداخت</div>
                        <div className="space-y-2">
                            {methods.map((method) => (
                                <button
                                    key={method.code}
                                    type="button"
                                    disabled={step === 'paying'}
                                    onClick={() => setSelectedMethod(method.code)}
                                    className={`flex w-full flex-col items-start rounded-xl border px-4 py-3 text-right transition-colors ${
                                        selectedMethod === method.code
                                            ? 'border-[#083f30] bg-[#083f30]/5'
                                            : 'border-gray-200 bg-white'
                                    }`}
                                >
                                    <span className="font-semibold text-gray-900">{method.name}</span>
                                    {method.description ? (
                                        <span className="mt-0.5 text-xs text-gray-500">{method.description}</span>
                                    ) : null}
                                </button>
                            ))}
                        </div>

                        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

                        <button
                            type="button"
                            disabled={!selectedMethod || step === 'paying'}
                            onClick={pay}
                            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#083f30] to-[#0a5a44] font-bold text-white transition-all hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {step === 'paying' ? <Loader2 size={18} className="animate-spin" /> : null}
                            پرداخت و تکمیل رزرو
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
