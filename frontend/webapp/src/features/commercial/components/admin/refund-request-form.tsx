'use client';


import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { createRefundRequestAction } from '../../actions/admin-commercial-actions';
import { RefundRequestInput, RefundRequestSchema } from '../../schemas';

export function RefundRequestForm({ bookingId, paymentId, chargeLines = [] as any[] }: { bookingId: string; paymentId?: string | null; chargeLines?: any[]; }) {
  const tAdmin = useTranslations("AdminGenerated");
  const [isPending, startTransition] = useTransition();
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]);

  const totalSelected = useMemo(() => chargeLines
    .filter((line) => selectedLineIds.includes(line.id))
    .reduce((sum, line) => sum + Number(line.net_amount ?? 0), 0), [chargeLines, selectedLineIds]);

  const form = useForm<RefundRequestInput>({
    resolver: zodResolver(RefundRequestSchema),
    defaultValues: {
      bookingId,
      paymentId: paymentId ?? null,
      refundScope: 'full',
      reason: '',
      customerNote: '',
      adminNote: '',
      refundLines: [],
    },
  });

  const onSubmit = (values: RefundRequestInput) => {
    const lines = values.refundScope === 'partial'
      ? chargeLines.filter((line) => selectedLineIds.includes(line.id)).map((line) => ({
          chargeLineId: line.id,
          bookingChildId: line.booking_child_id,
          bookingAddonId: line.booking_addon_id,
          lineType: line.line_type,
          quantity: line.quantity ?? 1,
          paymentRefundAmount: Number(line.net_amount ?? 0),
        }))
      : [];

    startTransition(async () => {
      try {
        await createRefundRequestAction({ ...values, refundLines: lines });
        toast.success(tAdmin("refundRequestCreated"));
        form.reset({ bookingId, paymentId: paymentId ?? null, refundScope: 'full', reason: '', customerNote: '', adminNote: '', refundLines: [] });
        setSelectedLineIds([]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create refund request.');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tAdmin("createRefundRequest")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="refundScope" render={({ field }) => (
                <FormItem><FormLabel>{tAdmin("refundScope")}</FormLabel><FormControl><select {...field} className="w-full rounded-md border bg-background px-3 py-2 text-sm" disabled={isPending}><option value="full">{tAdmin("fullRefund")}</option><option value="partial">{tAdmin("partialRefund")}</option></select></FormControl><FormMessage /></FormItem>
              )} />
              <div className="rounded-md border p-3 text-sm">
                <div className="text-muted-foreground">{tAdmin("selectedAmount")}</div>
                <div className="font-semibold">{totalSelected.toFixed(2)}</div>
              </div>
            </div>

            {form.watch('refundScope') === 'partial' && (
              <div className="space-y-2 rounded-xl border p-4">
                <div className="font-medium">{tAdmin("selectChargeLinesToRefund")}</div>
                {chargeLines.map((line) => {
                  const checked = selectedLineIds.includes(line.id);
                  return (
                    <label key={line.id} className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm">
                      <div className="flex gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setSelectedLineIds((current) => e.target.checked ? [...current, line.id] : current.filter((id) => id !== line.id));
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
            )}

            <FormField control={form.control} name="reason" render={({ field }) => (
              <FormItem><FormLabel>{tAdmin("reason")}</FormLabel><FormControl><Input {...field} disabled={isPending} placeholder={tAdmin("customerCancelledBeforeConfirmation")} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="customerNote" render={({ field }) => (
              <FormItem><FormLabel>{tAdmin("customerNote")}</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} rows={3} disabled={isPending} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="adminNote" render={({ field }) => (
              <FormItem><FormLabel>{tAdmin("adminNote")}</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} rows={3} disabled={isPending} /></FormControl><FormMessage /></FormItem>
            )} />

            <Button type="submit" disabled={isPending || (form.watch('refundScope') === 'partial' && selectedLineIds.length === 0)}>
              {isPending ? 'Submitting...' : 'Create refund request'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
