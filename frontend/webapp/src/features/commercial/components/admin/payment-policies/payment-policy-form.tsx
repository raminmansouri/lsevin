'use client';


import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
type PaymentPolicyScopeType = (typeof scopeTypeOptions)[number];
const collectionModeOptions = ['free_booking', 'deposit_percent', 'deposit_fixed', 'full_prepay'] as const;
const depositTypeOptions = ['none', 'percent', 'fixed'] as const;
const roundingOptions = ['none', 'up_100', 'up_1000', 'up_10000'] as const;
const triggerOptions = ['manual', 'before_service', 'on_arrival', 'after_confirmation'] as const;
const refundableOptions = ['always_refundable', 'never_refundable', 'policy_based'] as const;

export function BookingPaymentPolicyForm({
  policy,
  lookups,
}: {
  policy?: BookingPaymentPolicyRecord | null;
  lookups: CommercialPolicyLookups;
}) {
  const tAdmin = useTranslations("AdminGenerated");
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

  const scopeType = (useWatch({ control: form.control, name: 'scopeType' }) ?? 'global') as PaymentPolicyScopeType;
  const collectionMode = useWatch({ control: form.control, name: 'collectionMode' });
  const didMountScopeWatcher = useRef(false);

  useEffect(() => {
    if (!didMountScopeWatcher.current) {
      didMountScopeWatcher.current = true;
      return;
    }

    form.setValue('scopeId', '', { shouldDirty: true, shouldValidate: true });
  }, [scopeType, form]);

  useEffect(() => {
    if (collectionMode === 'deposit_percent') {
      form.setValue('depositType', 'percent');
    } else if (collectionMode === 'deposit_fixed') {
      form.setValue('depositType', 'fixed');
    } else {
      form.setValue('depositType', 'none');
    }
  }, [collectionMode, form]);

  const scopeHelp = useMemo(
    () =>
      ({
        global: 'Default booking payment collection rule when no narrower rule applies.',
        provider_type: 'Use for provider-type-wide deposit rules, e.g. hotels vs clinics.',
        provider: 'Override deposit policy for one provider.',
        service_definition: 'Set booking collection rules per service definition.',
        provider_service: 'Use the narrowest rule for one exact provider service.',
      }[scopeType]),
    [scopeType]
  );

  const onSubmit = (values: BookingPaymentPolicyFormInput) => {
    startTransition(async () => {
      try {
        await upsertBookingPaymentPolicyAction(values);
        toast.success(tAdmin("bookingPaymentPolicySaved"));
        router.push('/admin/commercial/payment-policies');
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save booking payment policy.');
      }
    });
  };

  const targetDisabled = scopeType === 'global' || !scopeType;
  const depositTypeDisabled = collectionMode === 'free_booking' || collectionMode === 'full_prepay';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{policy ? 'Edit booking payment policy' : 'Create booking payment policy'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("name")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("priority")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAdmin("description")}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="scopeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("scopeType")}</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        disabled={isPending}
                      >
                        {scopeTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scopeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("scopeTarget")}</FormLabel>
                    <FormControl>
                      <div key={scopeType}>
                        {scopeType === 'provider_type' ? (
                          <LazyAdminLookupSelect
                            lookupType="providerTypes"
                            locale="en"
                            value={field.value ?? ''}
                            onValueChange={field.onChange}
                            placeholder={tAdmin("selectProviderType")}
                            initialOptions={lookups.providerTypes}
                            disabled={isPending}
                          />
                        ) : scopeType === 'provider' ? (
                          <LazyAdminLookupSelect
                            lookupType="providers"
                            locale="en"
                            value={field.value ?? ''}
                            onValueChange={field.onChange}
                            placeholder={tAdmin("selectProvider")}
                            initialOptions={lookups.providers}
                            disabled={isPending}
                            contentClassName="w-[460px]"
                          />
                        ) : scopeType === 'service_definition' ? (
                          <LazyAdminLookupSelect
                            lookupType="serviceDefinitions"
                            locale="en"
                            value={field.value ?? ''}
                            onValueChange={field.onChange}
                            placeholder={tAdmin("selectServiceDefinition")}
                            initialOptions={lookups.serviceDefinitions}
                            disabled={isPending}
                            contentClassName="w-[460px]"
                          />
                        ) : scopeType === 'provider_service' ? (
                          <LazyAdminLookupSelect
                            lookupType="providerServices"
                            locale="en"
                            value={field.value ?? ''}
                            onValueChange={field.onChange}
                            placeholder={tAdmin("selectProviderService")}
                            initialOptions={lookups.providerServices}
                            disabled={isPending}
                            contentClassName="w-[520px]"
                          />
                        ) : (
                          <Input
                            value=""
                            placeholder={tAdmin("noScopeTargetRequiredForGlobalPolicies")}
                            disabled={targetDisabled || isPending}
                          />
                        )}
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{scopeHelp}</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="collectionMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("collectionMode")}</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        disabled={isPending}
                      >
                        {collectionModeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="depositType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("depositType")}</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        disabled={depositTypeDisabled || isPending}
                      >
                        {depositTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="depositValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("depositValue")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="minimumDueNowAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("minimumDueNow")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capDueNowAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("capDueNow")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ''} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueNowRoundingMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("roundingMode")}</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        disabled={isPending}
                      >
                        {roundingOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="balanceDueTrigger"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("balanceDueTrigger")}</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        disabled={isPending}
                      >
                        {triggerOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="depositRefundableMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("depositRefundableMode")}</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        disabled={isPending}
                      >
                        {refundableOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="allowWalletForDueNow"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                      <FormLabel>{tAdmin("wallet")}</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allowGatewayForDueNow"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                      <FormLabel>{tAdmin("gateway")}</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                  <FormLabel>{tAdmin("active")}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metadataText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAdmin("metadataJSON")}</FormLabel>
                  <FormControl>
                    <Textarea rows={6} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {policy ? 'Save changes' : 'Create policy'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/admin/commercial/payment-policies')}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}