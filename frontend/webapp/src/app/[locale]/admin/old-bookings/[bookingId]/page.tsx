
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

async function getBooking(bookingId: string) {
  const res = await fetch(`/api/admin/bookings/${bookingId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load booking');
  return res.json();
}

export default function AdminBookingDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const tAdmin = useTranslations('AdminGenerated');
  const [item, setItem] = useState<any>(null);
  const [bookingId, setBookingId] = useState<string>('');
  const [providerNotes, setProviderNotes] = useState('');
  const [bookingStatus, setBookingStatus] = useState('Pending');
  const [childNotes, setChildNotes] = useState<Record<string, string>>({});
  const [childStatuses, setChildStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    params.then(async ({ bookingId }) => {
      setBookingId(bookingId);
      const { item } = await getBooking(bookingId);
      setItem(item);
      setProviderNotes(item.providerNotes ?? '');
      setBookingStatus(item.bookingStatus ?? 'Pending');
      const nextNotes: Record<string, string> = {};
      const nextStatuses: Record<string, string> = {};
      for (const child of item.childBookings ?? []) {
        nextNotes[child.id] = child.providerNotes ?? '';
        nextStatuses[child.id] = child.status ?? 'Confirmed';
      }
      setChildNotes(nextNotes);
      setChildStatuses(nextStatuses);
    });
  }, [params]);

  if (!item) return <div className="p-8 text-sm text-slate-500">{tAdmin("loadingBooking")}</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{tAdmin("bookingReview")}</h1>
        <p className="mt-1 text-sm text-slate-500">{tAdmin("inspectParentBookingEmbeddedAddOnChildBookingsDocumentsAndPayments")}</p>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-slate-500">{tAdmin("provider")}</div>
            <div className="font-semibold text-slate-900">{item.providerName ?? '-'}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">{tAdmin("service")}</div>
            <div className="font-semibold text-slate-900">{item.serviceName ?? '-'}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">{tAdmin("specialist")}</div>
            <div className="font-semibold text-slate-900">{item.specialistName ?? tAdmin('notRequired')}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">{tAdmin("payment")}</div>
            <div className="font-semibold text-slate-900">{item.paymentStatus} · {item.paymentMethod}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[200px_1fr]">
          <label className="text-sm font-semibold text-slate-700">
            {tAdmin("bookingStatus")}
            <select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4">
              <option value="Pending">{tAdmin("pending")}</option>
              <option value="Confirmed">{tAdmin("confirmed")}</option>
              <option value="Rejected">{tAdmin("rejected")}</option>
              <option value="Cancelled">{tAdmin("cancelled")}</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {tAdmin("providerAdminNotes")}
            <textarea value={providerNotes} onChange={(e) => setProviderNotes(e.target.value)} className="mt-2 min-h-[96px] w-full rounded-2xl border border-slate-200 px-4 py-3" />
          </label>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">{tAdmin("embeddedAddOnSubBookings")}</h2>
        <div className="mt-4 space-y-4">
          {(item.childBookings ?? []).map((child: any) => (
            <div key={child.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="font-semibold text-slate-900">{child.providerName ?? tAdmin('childProvider')}</div>
                  <div className="text-sm text-slate-500">{child.serviceName ?? tAdmin('childService')}</div>
                </div>
                <label className="text-sm font-semibold text-slate-700">
                  {tAdmin("childStatus")}
                  <select value={childStatuses[child.id] ?? child.status ?? 'Confirmed'} onChange={(e) => setChildStatuses((prev) => ({ ...prev, [child.id]: e.target.value }))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4">
                    <option value="Pending">{tAdmin("pending")}</option>
                    <option value="Confirmed">{tAdmin("confirmed")}</option>
                    <option value="Rejected">{tAdmin("rejected")}</option>
                    <option value="Cancelled">{tAdmin("cancelled")}</option>
                  </select>
                </label>
              </div>
              <textarea
                value={childNotes[child.id] ?? ''}
                onChange={(e) => setChildNotes((prev) => ({ ...prev, [child.id]: e.target.value }))}
                placeholder={tAdmin("notesForThisSubBooking")}
                className="mt-3 min-h-[88px] w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">{tAdmin("documents")}</h2>
        <div className="mt-4 space-y-2">
          {(item.documents ?? []).map((doc: any) => (
            <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
              <div>
                <div className="font-medium text-slate-900">{doc.title}</div>
                <div className="text-xs text-slate-500">{doc.fileName}</div>
              </div>
              <a href={doc.fileUrl} target="_blank" className="text-sm font-medium text-[#083f30]">{tAdmin("open")}</a>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">{tAdmin("payments")}</h2>
        <div className="mt-4 space-y-3">
          {(item.payments ?? []).map((payment: any) => (
            <div key={payment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900">{payment.paymentMethod}</div>
                <div className="text-sm text-slate-600">{payment.status}</div>
              </div>
              <div className="mt-2 text-sm text-slate-600">{payment.currency} {payment.amount}</div>
              {payment.externalReference ? <div className="mt-1 text-xs text-slate-500">{payment.externalReference}</div> : null}
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={async () => {
          await fetch(`/api/admin/bookings/${bookingId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingStatus,
              providerNotes,
              childReviews: (item.childBookings ?? []).map((child: any) => ({
                id: child.id,
                status: childStatuses[child.id] ?? child.status,
                providerNotes: childNotes[child.id] ?? '',
              })),
            }),
          });
          alert(tAdmin('bookingReviewSaved'));
        }}
        className="rounded-2xl bg-[#083f30] px-5 py-3 text-sm font-semibold text-white"
      >
        {tAdmin("saveReviewDecision")}
      </button>
    </div>
  );
}
