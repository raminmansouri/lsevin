'use client';

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

import { CompensationPolicyFormInput, CompensationPolicyFormSchema } from '../../schemas';
import type { CompensationPolicy } from '../../types';
import type { CommercialPolicyLookups } from '../../lib/server/admin-lookups';
import { upsertCompensationPolicyAction } from '../../actions/admin-commercial-actions';

const scopeTypeOptions = ['global', 'provider_type', 'provider', 'service_definition', 'provider_service', 'addon'] as const;
type CompensationPolicyScopeType = (typeof scopeTypeOptions)[number];
const appliesToOptions = ['main_booking', 'child_booking', 'addon'] as const;
const feeModeOptions = ['percent', 'fixed', 'hybrid'] as const;
const gatewayFeeModeOptions = ['platform_pays', 'provider_pays', 'split'] as const;

export function CompensationPolicyForm({
  policy,
  lookups,
}: {
  policy?: CompensationPolicy | null;
  lookups: CommercialPolicyLookups;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CompensationPolicyFormInput>({
    resolver: zodResolver(CompensationPolicyFormSchema),
    defaultValues: {
      policyId: policy?.id,
      name: policy?.name ?? '',
      description: policy?.description ?? '',
      scopeType: policy?.scopeType ?? 'global',
      scopeId: policy?.scopeId ?? '',
      appliesTo: policy?.appliesTo ?? 'main_booking',
      feeMode: policy?.feeMode ?? 'percent',
      platformPercent: policy?.platformPercent ?? 0,
      platformFixedAmount: policy?.platformFixedAmount ?? 0,
      minimumPlatformAmount: policy?.minimumPlatformAmount ?? 0,
      providerPercentOverride: policy?.providerPercentOverride ?? null,
      gatewayFeeMode: policy?.gatewayFeeMode ?? 'platform_pays',
      currencyCode: policy?.currencyCode ?? '',
      priority: policy?.priority ?? 100,
      isActive: policy?.isActive ?? true,
      effectiveFrom: policy?.effectiveFrom ? String(policy.effectiveFrom).slice(0, 16) : '',
      effectiveTo: policy?.effectiveTo ? String(policy.effectiveTo).slice(0, 16) : '',
      metadataText: JSON.stringify(policy?.metadata ?? {}, null, 2),
    },
  });

  const scopeType = (useWatch({ control: form.control, name: 'scopeType' }) ?? 'global') as CompensationPolicyScopeType;
  const didMountScopeWatcher = useRef(false);

  useEffect(() => {
    if (!didMountScopeWatcher.current) {
      didMountScopeWatcher.current = true;
      return;
    }

    form.setValue('scopeId', '', { shouldDirty: true, shouldValidate: true });
  }, [scopeType, form]);

  const scopeHelp = useMemo(
    () =>
      ({
        global: 'Global policies apply when no narrower scope rule wins.',
        provider_type: 'Pick a provider type for broad rules like hotel or clinic.',
        provider: 'Pick one provider to override defaults.',
        service_definition: 'Pick a service definition for service-level compensation.',
        provider_service: 'Pick one concrete provider service for the narrowest booking rule.',
        addon: 'Pick one addon to define addon-specific commercial behavior.',
      }[scopeType]),
    [scopeType]
  );

  const onSubmit = (values: CompensationPolicyFormInput) => {
    startTransition(async () => {
      try {
        await upsertCompensationPolicyAction(values);
        toast.success('Compensation policy saved.');
        router.push('/admin/commercial/policies');
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save compensation policy.');
      }
    });
  };

  const targetDisabled = scopeType === 'global' || !scopeType;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{policy ? 'Edit compensation policy' : 'Create compensation policy'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="xl:col-span-2">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scopeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope type</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        disabled={isPending}
                      >
                        {scopeTypeOptions.map((x) => (
                          <option key={x} value={x}>
                            {x}
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
                name="appliesTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applies to</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        disabled={isPending}
                      >
                        {appliesToOptions.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="scopeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scope target</FormLabel>
                  <FormControl>
                    <div key={scopeType}>
                      {scopeType === 'global' ? (
                        <Input value="" disabled placeholder="No scope target needed for global policies" />
                      ) : scopeType === 'provider_type' ? (
                        <LazyAdminLookupSelect
                          lookupType="providerTypes"
                          locale="en"
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                          placeholder="Select provider type"
                          initialOptions={lookups.providerTypes}
                          disabled={isPending}
                        />
                      ) : scopeType === 'provider' ? (
                        <LazyAdminLookupSelect
                          lookupType="providers"
                          locale="en"
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                          placeholder="Select provider"
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
                          placeholder="Select service definition"
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
                          placeholder="Select provider service"
                          initialOptions={lookups.providerServices}
                          disabled={isPending}
                          contentClassName="w-[520px]"
                        />
                      ) : scopeType === 'addon' ? (
                        <LazyAdminLookupSelect
                          lookupType="addons"
                          locale="en"
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                          placeholder="Select addon"
                          initialOptions={lookups.addons}
                          disabled={isPending}
                        />
                      ) : (
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          disabled={targetDisabled || isPending}
                          placeholder="Scope id"
                        />
                      )}
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{scopeHelp}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormField
                control={form.control}
                name="feeMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee mode</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        disabled={isPending}
                      >
                        {feeModeOptions.map((x) => (
                          <option key={x} value={x}>
                            {x}
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
                name="gatewayFeeMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gateway fee mode</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        disabled={isPending}
                      >
                        {gatewayFeeModeOptions.map((x) => (
                          <option key={x} value={x}>
                            {x}
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
                name="currencyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency override</FormLabel>
                    <FormControl>
                      <LazyAdminLookupSelect
                        lookupType="currencies"
                        locale="en"
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                        placeholder="Select currency"
                        initialOptions={lookups.currencies}
                        disabled={isPending}
                      />
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
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormField
                control={form.control}
                name="platformPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform percent</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="platformFixedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform fixed amount</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minimumPlatformAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum platform amount</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="providerPercentOverride"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider percent override</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" value={field.value ?? ''} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="effectiveFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective from</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" value={field.value ?? ''} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="effectiveTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective to</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" value={field.value ?? ''} disabled={isPending} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                  <FormLabel>Active</FormLabel>
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
                  <FormLabel>Metadata JSON</FormLabel>
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
              <Button type="button" variant="outline" onClick={() => router.push('/admin/commercial/policies')}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}