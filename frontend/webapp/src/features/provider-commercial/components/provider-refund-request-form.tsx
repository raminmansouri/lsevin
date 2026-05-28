'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createProviderRefundRequestAction } from '../actions/provider-refund-actions';

export function ProviderRefundRequestForm({ providerId, bookingId, paymentId, chargeLines }: { providerId: string; bookingId: string; paymentId?: string | null; chargeLines: any[]; }) {
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState('');
  const [providerNote, setProviderNote] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const totalSelected = useMemo(() => chargeLines
    .filter((line) => selected.includes(line.id))
    .reduce((sum, line) => sum + Number(line.net_amount ?? 0), 0), [chargeLines, selected]);

  return (
    <Card>
      <CardHeader><CardTitle>Request refund review</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-xl border p-4">
          <div className="font-medium">Select provider lines to refund</div>
          {chargeLines.map((line) => {
            const checked = selected.includes(line.id);
            return (
              <label key={line.id} className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm">
                <div className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setSelected((current) => e.target.checked ? [...current, line.id] : current.filter((id) => id !== line.id));
                    }}
                  />
                  <div>
                    <div className="font-medium">{line.description}</div>
                    <div className="text-muted-foreground">{line.line_type}</div>
                  </div>
                </div>
                <div className="font-medium">{Number(line.net_amount ?? 0).toFixed(2)} {line.payment_currency_code}</div>
              </label>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-3 text-sm">
            <div className="text-muted-foreground">Selected amount</div>
            <div className="font-semibold">{totalSelected.toFixed(2)}</div>
          </div>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for refund review" />
        </div>

        <Textarea value={providerNote} onChange={(e) => setProviderNote(e.target.value)} rows={3} placeholder="Provider note for admin review" />

        <Button
          type="button"
          disabled={isPending || selected.length === 0 || reason.trim().length < 3}
          onClick={() => startTransition(async () => {
            try {
              await createProviderRefundRequestAction({ providerId, bookingId, paymentId: paymentId ?? null, reason, providerNote, selectedChargeLineIds: selected });
              toast.success('Refund request sent for admin review.');
              setReason('');
              setProviderNote('');
              setSelected([]);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Failed to create provider refund request.');
            }
          })}
        >
          {isPending ? 'Submitting...' : 'Request refund review'}
        </Button>
      </CardContent>
    </Card>
  );
}
