'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useRouter } from '@/i18n/navigation';

import { upsertCurrencyAction } from '../../actions/admin-currency-actions';
import { CurrencyFormSchema } from '../../schemas/admin-currency-schemas';
import type { Currency } from '../../types';

type FormInput = z.infer<typeof CurrencyFormSchema>;

export function CurrencyForm({ currency }: { currency?: Currency }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormInput>({
    resolver: zodResolver(CurrencyFormSchema),
    defaultValues: {
      code: currency?.code ?? '',
      name: currency?.name ?? '',
      nativeName: currency?.nativeName ?? '',
      symbol: currency?.symbol ?? '',
      decimalDigits: currency?.decimalDigits ?? 2,
      isIso: currency?.isIso ?? true,
      isActive: currency?.isActive ?? true,
      isDisplayEnabled: currency?.isDisplayEnabled ?? true,
      isPaymentEnabled: currency?.isPaymentEnabled ?? false,
      isSettlementEnabled: currency?.isSettlementEnabled ?? false,
      sortOrder: currency?.sortOrder ?? 0,
    },
  });

  const onSubmit = (values: FormInput) => {
    startTransition(async () => {
      try {
        await upsertCurrencyAction(values);
        toast.success('Currency saved.');
        router.push('/admin/finance/currencies');
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save currency.');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{currency ? `Edit ${currency.code}` : 'Create currency'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl><Input {...field} disabled={!!currency || isPending} placeholder="USD" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input {...field} disabled={isPending} placeholder="United States Dollar" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nativeName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Native name</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} disabled={isPending} placeholder="US Dollar" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="symbol" render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl><Input {...field} disabled={isPending} placeholder="$" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="decimalDigits" render={({ field }) => (
                <FormItem>
                  <FormLabel>Decimal digits</FormLabel>
                  <FormControl><Input {...field} type="number" min={0} max={6} disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="sortOrder" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort order</FormLabel>
                  <FormControl><Input {...field} type="number" disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid gap-4 md:grid-cols-5">
              {[
                ['isIso', 'ISO currency'],
                ['isActive', 'Active'],
                ['isDisplayEnabled', 'Display'],
                ['isPaymentEnabled', 'Payment'],
                ['isSettlementEnabled', 'Settlement'],
              ].map(([name, label]) => (
                <FormField key={name} control={form.control} name={name as keyof FormInput} render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-xl border p-3">
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )} />
              ))}
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save currency'}</Button>
              <Button type="button" variant="outline" disabled={isPending} onClick={() => router.push('/admin/finance/currencies')}>Cancel</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
