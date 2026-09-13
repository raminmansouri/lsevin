'use client';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { changeBookingCart } from '../actions/cart';
import type { CartBooking } from '../server/cart.repository';

export function CartBookings({ bookings, locale }: { bookings: CartBooking[]; locale: string }) {
  const t = useTranslations('BookingCart');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  if (!bookings.length) return null;
  return <section className="space-y-3 px-4 pt-4" aria-label={t('title')}>
    <h2 className="text-lg font-bold text-neutral-900">{t('title')}</h2>
    <p className="text-sm text-neutral-600">{t('hint')}</p>
    {error && <p role="alert" className="text-sm text-red-700">{t('error')}</p>}
    {bookings.map(booking => <article key={booking.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-neutral-900">{booking.service || t('title')}</h3>
      <p className="text-sm text-neutral-600">{booking.provider}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-semibold">{new Intl.NumberFormat(locale, { style: 'currency', currency: booking.currency }).format(booking.amount)}</span>
        <div className="flex items-center gap-4">
          <button type="button" disabled={pending} className="min-h-11 text-sm text-red-700 disabled:opacity-50" onClick={() => {
            setError(false);
            startTransition(async () => {
              try { await changeBookingCart({ action: 'remove', draftId: booking.id }); router.refresh(); }
              catch { setError(true); }
            });
          }}>{t('remove')}</button>
          <Link className="rounded-xl bg-[#083f30] px-4 py-3 text-sm font-semibold text-white" href={`/n/app/mobile/booking?draftId=${encodeURIComponent(booking.id)}`}>{t('resume')}</Link>
        </div>
      </div>
    </article>)}
    <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-[#083f30] underline" href="/n/app/mobile/booking">{t('another')}</Link>
  </section>;
}
