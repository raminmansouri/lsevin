'use client';

import { useMemo, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from '@/i18n/navigation';
import { LazyAdminLookupSelect } from '@/features/service-providers/components/admin/lazy-admin-lookup-select';

import { BookingPaymentPolicyFormInput, BookingPaymentPolicyFormSchema } from '../../../schemas';
import type { BookingPaymentPolicyRecord } from '../../../types';
import type { CommercialPolicyLookups } from '../../../lib/server/admin-lookups';
import { upsertBookingPaymentPolicyAction } from '../../../actions/admin-payment-policy-actions';

const scopeTypeOptions = ['global', 'provider_type', 'provider', 'service_definition', 'provider_service'] as const;
const collectionModeOptions = ['free_booking', 'deposit_percent', 'deposit_fixed', 'full_prepay'] as const;
const depositTypeOptions = ['none', 'percent', 'fixed'] as const;
const roundingOptions = ['none', 'up_100', 'up_1000', 'up_10000'] as const;
const triggerOptions = ['manual', 'before_service', 'on_arrival', 'after_confirmation'] as const;
const refundableOptions = ['always_refundable', 'never_refundable', 'policy_based'] as const;

export function BookingPaymentPolicyForm({ policy, lookups }: { policy?: BookingPaymentPolicyRecord | null; lookups: CommercialPolicyLookups }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<BookingPaymentPolicyFormInput>({
    resolver: zodResolver(BookingPaymentPolicyFormSchema),
    defaultValues: {
      policyId: policy?.id,
      name: policy?.name ?? '',
      description: policy?.description ?? '',
      scopeType: policy?.scopeType ?? 'global',
      scopeId: policy?.scopeId ?? '',
      collectionMode: policy?.collectionMode ?? 'full_prepay',
      depositType: policy?.depositType ?? 'none',
      depositValue: policy?.depositValue ?? 0,
      minimumDueNowAmount: policy?.minimumDueNowAmount ?? 0,
      capDueNowAmount: policy?.capDueNowAmount ?? null,
      dueNowRoundingMode: policy?.dueNowRoundingMode ?? 'none',
      balanceDueTrigger: policy?.balanceDueTrigger ?? 'manual',
      allowWalletForDueNow: policy?.allowWalletForDueNow ?? true,
      allowGatewayForDueNow: policy?.allowGatewayForDueNow ?? true,
      depositRefundableMode: policy?.depositRefundableMode ?? 'policy_based',
      priority: policy?.priority ?? 100,
      isActive: policy?.isActive ?? true,
      metadataText: JSON.stringify(policy?.metadata ?? {}, null, 2),
    },
  });

  const scopeType = form.watch('scopeType');
  const collectionMode = form.watch('collectionMode');

  const scopeHelp = useMemo(() => ({
    global: 'Default booking payment collection rule when no narrower rule applies.',
    provider_type: 'Use for provider-type-wide deposit rules, e.g. hotels vs clinics.',
    provider: 'Override deposit policy for one provider.',
    service_definition: 'Set booking collection rules per service definition.',
    provider_service: 'Use the narrowest rule for one exact provider service.',
  }[scopeType]), [scopeType]);

  const onSubmit = (values: BookingPaymentPolicyFormInput) => {
    startTransition(async () => {
      try {
        await upsertBookingPaymentPolicyAction(values);
        toast.success('Booking payment policy saved.');
        router.push('/admin/commercial/payment-policies');
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save booking payment policy.');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{policy ? 'Edit booking payment policy' : 'Create booking payment policy'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem><FormLabel>Priority</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="scopeType" render={({ field }) => (
                <FormItem><FormLabel>Scope type</FormLabel><FormControl>
                  <select value={field.value} onChange={(e) => field.onChange(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    {scopeTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="scopeId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Scope target</FormLabel>
                  <FormControl>
                    {scopeType === 'provider_type' ? <LazyAdminLookupSelect lookupType="providerTypes" locale="en" value={field.value ?? ''} onValueChange={field.onChange} placeholder="Select provider type" initialOptions={lookups.providerTypes} disabled={isPending} />
                    : scopeType === 'provider' ? <LazyAdminLookupSelect lookupType="serviceProviders" locale="en" value={field.value ?? ''} onValueChange={field.onChange} placeholder="Select provider" initialOptions={lookups.providers} disabled={isPending} />
                    : scopeType === 'service_definition' ? <LazyAdminLookupSelect lookupType="serviceDefinitions" locale="en" value={field.value ?? ''} onValueChange={field.onChange} placeholder="Select service definition" initialOptions={lookups.serviceDefinitions} disabled={isPending} />
                    : scopeType === 'provider_service' ? <LazyAdminLookupSelect lookupType="providerServices" locale="en" value={field.value ?? ''} onValueChange={field.onChange} placeholder="Select provider service" initialOptions={lookups.providerServices} disabled={isPending} />
                    : <Input value={field.value ?? ''} onChange={field.onChange} placeholder="No scope target required for global policies" disabled />}
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{scopeHelp}</p>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField control={form.control} name="collectionMode" render={({ field }) => (
                <FormItem><FormLabel>Collection mode</FormLabel><FormControl>
                  <select value={field.value} onChange={(e) => field.onChange(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    {collectionModeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="depositType" render={({ field }) => (
                <FormItem><FormLabel>Deposit type</FormLabel><FormControl>
                  <select value={field.value} onChange={(e) => field.onChange(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" disabled={collectionMode === 'free_booking' || collectionMode === 'full_prepay'}>
                    {depositTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="depositValue" render={({ field }) => (
                <FormItem><FormLabel>Deposit value</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField control={form.control} name="minimumDueNowAmount" render={({ field }) => (
                <FormItem><FormLabel>Minimum due now</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="capDueNowAmount" render={({ field }) => (
                <FormItem><FormLabel>Cap due now</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="dueNowRoundingMode" render={({ field }) => (
                <FormItem><FormLabel>Rounding mode</FormLabel><FormControl>
                  <select value={field.value} onChange={(e) => field.onChange(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    {roundingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField control={form.control} name="balanceDueTrigger" render={({ field }) => (
                <FormItem><FormLabel>Balance due trigger</FormLabel><FormControl>
                  <select value={field.value} onChange={(e) => field.onChange(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    {triggerOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="depositRefundableMode" render={({ field }) => (
                <FormItem><FormLabel>Deposit refundable mode</FormLabel><FormControl>
                  <select value={field.value} onChange={(e) => field.onChange(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    {refundableOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="allowWalletForDueNow" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border px-3 py-2"><FormLabel>Wallet</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="allowGatewayForDueNow" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border px-3 py-2"><FormLabel>Gateway</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                )} />
              </div>
            </div>

            <FormField control={form.control} name="isActive" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border px-3 py-2"><FormLabel>Active</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
            )} />

            <FormField control={form.control} name="metadataText" render={({ field }) => (
              <FormItem><FormLabel>Metadata JSON</FormLabel><FormControl><Textarea rows={6} {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>{policy ? 'Save changes' : 'Create policy'}</Button>
              <Button type="button" variant="outline" onClick={() => router.push('/admin/commercial/payment-policies')}>Cancel</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
