'use client';


import { useTranslations } from "next-intl";
import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { deleteBookingPaymentPolicyAction } from '../../../actions/admin-payment-policy-actions';
import type { BookingPaymentPolicyRecord } from '../../../types';

export function BookingPaymentPoliciesTable({ rows }: { rows: BookingPaymentPolicyRecord[] }) {
  const tAdmin = useTranslations("AdminGenerated");
  const [isPending, startTransition] = useTransition();

  if (!rows.length) {
    return <div className="rounded-md border p-6 text-sm text-muted-foreground">{tAdmin("noBookingPaymentPoliciesFound")}</div>;
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <th className="px-4 py-3 font-medium">{tAdmin("name")}</th>
            <th className="px-4 py-3 font-medium">{tAdmin("scope")}</th>
            <th className="px-4 py-3 font-medium">{tAdmin("collection")}</th>
            <th className="px-4 py-3 font-medium">{tAdmin("deposit")}</th>
            <th className="px-4 py-3 font-medium">{tAdmin("priority")}</th>
            <th className="px-4 py-3 font-medium">{tAdmin("active")}</th>
            <th className="px-4 py-3 font-medium text-right">{tAdmin("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t align-top">
              <td className="px-4 py-3">
                <div className="font-medium">{row.name}</div>
                {row.description ? <div className="text-xs text-muted-foreground">{row.description}</div> : null}
              </td>
              <td className="px-4 py-3"><div>{row.scopeType}</div><div className="text-xs text-muted-foreground break-all">{row.scopeId || 'global'}</div></td>
              <td className="px-4 py-3">{row.collectionMode}</td>
              <td className="px-4 py-3">{row.depositType === 'none' ? '—' : `${row.depositType}:${row.depositValue}`}</td>
              <td className="px-4 py-3">{row.priority}</td>
              <td className="px-4 py-3">{row.isActive ? 'Yes' : 'No'}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Button asChild variant="outline" size="sm"><Link href={`/admin/commercial/payment-policies/${row.id}/edit`}><Pencil className="mr-2 h-4 w-4" />{tAdmin("edit")}</Link></Button>
                  <Button variant="destructive" size="sm" disabled={isPending} onClick={() => {
                    if (!confirm(`Delete payment policy “${row.name}”?`)) return;
                    startTransition(async () => {
                      try {
                        await deleteBookingPaymentPolicyAction(row.id);
                        toast.success(tAdmin("bookingPaymentPolicyDeleted"));
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : 'Delete failed.');
                      }
                    });
                  }}><Trash2 className="mr-2 h-4 w-4" />{tAdmin("delete")}</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
