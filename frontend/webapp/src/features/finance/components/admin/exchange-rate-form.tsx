'use client';


import { useTranslations } from "next-intl";
import { useTransition } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from '@/i18n/navigation';

import { createExchangeRateAction, updateExchangeRateAction } from '../../actions/admin-currency-actions';
import type { Currency } from '../../types';
import { ExchangeRateFormSchema } from "../../schemas/admin-currency-schemas";
import type { AdminExchangeRate } from '../../api/server/get-admin-finance';

type FormInput = z.infer<typeof ExchangeRateFormSchema>;

type ExchangeRateFormProps = {
    currencies: Currency[];
    // When provided, the form edits this row in place instead of creating a new
    // one. base/quote/as_of are not editable here — see the note on
    // ExchangeRateUpdateSchema for why — so only rate/source/expiresAt are sent.
    existingRate?: AdminExchangeRate;
};

export function ExchangeRateForm({ currencies, existingRate }: ExchangeRateFormProps) {
    const t = useTranslations("AdminGenerated");
    const tAdmin = useTranslations("AdminGenerated");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const isEditMode = Boolean(existingRate);

    const form = useForm<FormInput>({
        // zod's z.coerce fields (e.g. `rate`) give the schema a different input
        // type than its output type, which is what FormInput (z.infer, the
        // output) describes. zodResolver's inferred generic reflects that input
        // type instead, so TypeScript sees it as incompatible with
        // useForm<FormInput>'s expected Resolver<FormInput> — even though at
        // runtime the resolver coerces correctly. This cast just tells
        // TypeScript to trust the runtime behavior; it isn't hiding a real bug.
        resolver: zodResolver(ExchangeRateFormSchema) as Resolver<FormInput>,
        defaultValues: existingRate
            ? {
                baseCurrencyCode: existingRate.baseCurrencyCode,
                quoteCurrencyCode: existingRate.quoteCurrencyCode,
                rate: existingRate.rate,
                source: existingRate.source,
                expiresAt: existingRate.expiresAt ? existingRate.expiresAt.slice(0, 16) : '',
            }
            : {
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
                if (isEditMode && existingRate) {
                    await updateExchangeRateAction({
                        id: existingRate.id,
                        rate: values.rate,
                        source: values.source,
                        expiresAt: values.expiresAt,
                    });
                } else {
                    await createExchangeRateAction(values);
                }
                toast.success(tAdmin("exchangeRateSaved"));
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
                <CardTitle>
                    {isEditMode
                        ? `${tAdmin("createExchangeRate").replace(/create/i, 'Edit')} — ${existingRate?.baseCurrencyCode} → ${existingRate?.quoteCurrencyCode}`
                        : tAdmin("createExchangeRate")}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <FormField control={form.control} name="baseCurrencyCode" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{tAdmin("base")}</FormLabel>
                                    {isEditMode ? (
                                        <FormControl>
                                            <Input value={field.value} disabled readOnly />
                                        </FormControl>
                                    ) : (
                                        <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                                            <FormControl><SelectTrigger><SelectValue placeholder={tAdmin("base")} /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {currencies.map((currency) => <SelectItem key={currency.code} value={currency.code}>{currency.code} — {currency.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="quoteCurrencyCode" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{tAdmin("quote")}</FormLabel>
                                    {isEditMode ? (
                                        <FormControl>
                                            <Input value={field.value} disabled readOnly />
                                        </FormControl>
                                    ) : (
                                        <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                                            <FormControl><SelectTrigger><SelectValue placeholder={tAdmin("quote")} /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {currencies.map((currency) => <SelectItem key={currency.code} value={currency.code}>{currency.code} — {currency.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="rate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{tAdmin("rate")}</FormLabel>
                                    <FormControl><Input {...field} type="number" step="0.000000000001" min="0" disabled={isPending} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="source" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{tAdmin("source")}</FormLabel>
                                    <FormControl><Input {...field} disabled={isPending} placeholder={t("manualAdmin")} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="expiresAt" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{tAdmin("expiresAt")}</FormLabel>
                                    <FormControl><Input {...field} value={field.value || ''} type="datetime-local" disabled={isPending} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {isEditMode ? (
                            <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                                Base and quote currency can&apos;t be changed on an existing rate — they identify which
                                point in this pair&apos;s history this row is. To record a different pair, create a new rate instead.
                            </div>
                        ) : (
                            <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                                Example: if 1 USD = 32.50 TRY, set Base = USD, Quote = TRY, Rate = 32.50.
                                The system can also use inverse rates and USD-pivot conversion when direct pairs are missing.
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save rate'}</Button>
                            <Button type="button" variant="outline" disabled={isPending} onClick={() => router.push('/admin/finance/exchange-rates')}>{t("cancel")}</Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
