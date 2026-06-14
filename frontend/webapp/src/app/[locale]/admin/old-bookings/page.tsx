
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function AdminBookingsPage() {
  const tAdmin = useTranslations('AdminGenerated');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/bookings', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{tAdmin("bookingsReview")}</h1>
        <p className="mt-1 text-sm text-slate-500">{tAdmin("reviewParentBookingsEmbeddedAddOnChildBookingsPaymentsAndProviderNotes")}</p>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-5 py-4">{tAdmin("booking")}</th>
              <th className="px-5 py-4">{tAdmin("provider")}</th>
              <th className="px-5 py-4">{tAdmin("service")}</th>
              <th className="px-5 py-4">{tAdmin("payment")}</th>
              <th className="px-5 py-4">{tAdmin("children")}</th>
              <th className="px-5 py-4">{tAdmin("total")}</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item: any) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-5 py-4">
                  <Link href={`./bookings/${item.id}`} className="font-semibold text-[#083f30] hover:underline">{item.id}</Link>
                  <div className="mt-1 text-xs text-slate-500">{new Date(item.createDate).toLocaleString()}</div>
                </td>
                <td className="px-5 py-4">{item.providerName ?? '-'}</td>
                <td className="px-5 py-4">{item.serviceName ?? '-'}</td>
                <td className="px-5 py-4">
                  <div>{item.paymentStatus ?? '-'}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.paymentMethod ?? '-'}</div>
                </td>
                <td className="px-5 py-4">{item.childCount}</td>
                <td className="px-5 py-4 font-semibold">{item.currencyCode} {item.totalAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
