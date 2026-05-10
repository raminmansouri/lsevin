'use client';


import { useTranslations } from "next-intl";
import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { deleteCompensationPolicyAction } from '../../../actions/admin-commercial-actions';

export function PoliciesTable({ rows }: { rows: any[] }) {
  const tAdmin = useTranslations("AdminGenerated");
  const [isPending, startTransition] = useTransition();

  const onDelete = (id: string) => {
    if (!confirm('Delete this compensation policy?')) return;
    startTransition(async () => {
      try {
        await deleteCompensationPolicyAction(id);
        toast.success(tAdmin("policyDeleted"));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to delete policy.');
      }
    });
  };

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full min-w-[1200px] text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-3 text-left">{tAdmin("name")}</th>
            <th className="p-3 text-left">{tAdmin("scope")}</th>
            <th className="p-3 text-left">{tAdmin("appliesTo")}</th>
            <th className="p-3 text-left">{tAdmin("feeMode")}</th>
            <th className="p-3 text-left">{tAdmin("platform")}</th>
            <th className="p-3 text-left">{tAdmin("minimum")}</th>
            <th className="p-3 text-left">{tAdmin("priority")}</th>
            <th className="p-3 text-left">{tAdmin("active")}</th>
            <th className="p-3 text-right">{tAdmin("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t align-top">
              <td className="p-3">
                <div className="font-medium">{row.name}</div>
                <div className="text-xs text-muted-foreground">{row.description ?? '—'}</div>
              </td>
              <td className="p-3">
                <div>{row.scopeType}</div>
                <div className="text-xs text-muted-foreground">{row.scopeId ?? 'global'}</div>
              </td>
              <td className="p-3">{row.appliesTo}</td>
              <td className="p-3">{row.feeMode}</td>
              <td className="p-3">{Number(row.platformPercent ?? 0).toFixed(2)}% + {Number(row.platformFixedAmount ?? 0).toFixed(2)}</td>
              <td className="p-3">{Number(row.minimumPlatformAmount ?? 0).toFixed(2)}</td>
              <td className="p-3">{row.priority}</td>
              <td className="p-3">{row.isActive ? 'Yes' : 'No'}</td>
              <td className="p-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline"><Link href={`/admin/commercial/policies/${row.id}/edit`}>{tAdmin("edit")}</Link></Button>
                  <Button size="sm" variant="ghost" disabled={isPending} onClick={() => onDelete(row.id)}>Delete</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
