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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from '@/i18n/navigation';

import { createExchangeRateAction, ExchangeRateFormSchema } from '../../actions/admin-currency-actions';
import type { Currency } from '../../types';

type FormInput = z.infer<typeof ExchangeRateFormSchema>;

export function ExchangeRateForm({ currencies }: { currencies: Currency[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormInput>({
    resolver: zodResolver(ExchangeRateFormSchema),
    defaultValues: {
      baseCurrencyCode: 'USD',
      quoteCurrencyCode: 'AED',
      rate: 1,
      source: 'manual_admin',
      expiresAt: '',
    },
  });

  const onSubmit = (values: FormInput) => {
    startTransition(async () => {
      try {
        await createExchangeRateAction(values);
        toast.success('Exchange rate saved.');
        router.push('/admin/finance/exchange-rates');
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save exchange rate.');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create exchange rate</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-5">
              <FormField control={form.control} name="baseCurrencyCode" render={({ field }) => (
                <FormItem>
                  <FormLabel>Base</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Base" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {currencies.map((currency) => <SelectItem key={currency.code} value={currency.code}>{currency.code} — {currency.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="quoteCurrencyCode" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quote</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Quote" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {currencies.map((currency) => <SelectItem key={currency.code} value={currency.code}>{currency.code} — {currency.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="rate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate</FormLabel>
                  <FormControl><Input {...field} type="number" step="0.000000000001" min="0" disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="source" render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl><Input {...field} disabled={isPending} placeholder="manual_admin" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="expiresAt" render={({ field }) => (
                <FormItem>
                  <FormLabel>Expires at</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} type="datetime-local" disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              Example: if 1 USD = 32.50 TRY, set Base = USD, Quote = TRY, Rate = 32.50.
              The system can also use inverse rates and USD-pivot conversion when direct pairs are missing.
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save rate'}</Button>
              <Button type="button" variant="outline" disabled={isPending} onClick={() => router.push('/admin/finance/exchange-rates')}>Cancel</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
