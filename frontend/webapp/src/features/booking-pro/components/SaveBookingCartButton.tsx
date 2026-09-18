'use client';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { changeBookingCart } from '../actions/cart';

export function SaveBookingCartButton({ draftId, disabled }: { draftId: string; disabled: boolean }) {
  const t = useTranslations('BookingCart');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  return <div className="mx-auto max-w-6xl px-5 py-3">
    <button type="button" disabled={disabled || pending} className="min-h-11 rounded-xl border border-[#083f30] bg-white px-4 py-2 text-sm font-semibold text-[#083f30] disabled:opacity-40" onClick={() => {
      setError(false);
      startTransition(async () => {
        try {
          await changeBookingCart({ action: 'save', draftId });
          router.push('/n/app/mobile/shop/cart');
        } catch { setError(true); }
      });
    }}>{pending ? t('saving') : t('save')}</button>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{t('error')}</p>}
  </div>;
}
