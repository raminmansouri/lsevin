'use client';


import { useTranslations } from "next-intl";
import Link from 'next/link';

export function ProviderLedgerTable({ rows }: { rows: any[] }) {
  const tAdmin = useTranslations("AdminGenerated");
  // Read-only: approving and paying a provider happens in the financial panel.

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full min-w-[1100px] text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-3 text-left">{tAdmin("provider")}</th>
            <th className="p-3 text-left">{tAdmin("entryType")}</th>
            <th className="p-3 text-left">{tAdmin("amount")}</th>
            <th className="p-3 text-left">{tAdmin("currency")}</th>
            <th className="p-3 text-left">{tAdmin("status")}</th>
            <th className="p-3 text-left">{tAdmin("reference")}</th>
            <th className="p-3 text-left">{tAdmin("booking")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t align-top">
              <td className="p-3">
                <div className="font-medium">{row.providerName ?? row.providerId}</div>
                <div className="text-xs text-muted-foreground">{row.providerId}</div>
              </td>
              <td className="p-3">{row.entryType}</td>
              <td className="p-3 font-medium">{Number(row.amount ?? 0).toFixed(2)}</td>
              <td className="p-3">{row.currencyCode}</td>
              <td className="p-3">{row.status}</td>
              <td className="p-3 text-xs text-muted-foreground">{row.referenceType ?? '—'}</td>
              <td className="p-3">{row.bookingId ? <Link href={`/admin/bookings/${row.bookingId}/financial`} className="underline">{tAdmin("openFinancials")}</Link> : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
