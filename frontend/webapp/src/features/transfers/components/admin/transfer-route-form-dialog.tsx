"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { saveProviderServiceAction } from "@/features/service-providers/actions/admin";
import { StaffLazySearchableSelect } from "@/features/staff/components/staff-lazy-select";
import useAction from "@/hooks/use-action";

import { upsertTransferRouteAction } from "../../server/actions";
import { TRANSFERS_TRANSLATION_KEY, type TransferRouteAdminRow } from "../../types";

export type TransferRouteFormState = {
  id?: string;
  providerServiceId?: string;
  serviceProviderId: string;
  providerLabel: string;
  serviceDefinitionId: string;
  serviceDefinitionLabel: string;
  from: string;
  to: string;
  vehicleType: string;
  price: string;
  currency: string;
  isActive: boolean;
  // Full translation maps carried through so saving from one admin locale
  // never wipes another locale's text -- both on the provider_services row
  // (display name / description) and on this route's own from/to columns.
  displayNameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  fromTranslations: Record<string, string>;
  toTranslations: Record<string, string>;
};

export const EMPTY_TRANSFER_ROUTE_FORM: TransferRouteFormState = {
  serviceProviderId: "",
  providerLabel: "",
  serviceDefinitionId: "",
  serviceDefinitionLabel: "",
  from: "",
  to: "",
  vehicleType: "",
  price: "",
  currency: "IRR",
  isActive: true,
  displayNameTranslations: {},
  descriptionTranslations: {},
  fromTranslations: {},
  toTranslations: {},
};

export function transferRouteToFormState(route: TransferRouteAdminRow, locale: string): TransferRouteFormState {
  return {
    id: route.id,
    providerServiceId: route.providerServiceId,
    serviceProviderId: route.serviceProviderId,
    providerLabel: route.providerName,
    serviceDefinitionId: route.serviceDefinitionId,
    serviceDefinitionLabel: route.serviceDefinitionName,
    from: route.fromTranslations[locale] ?? route.from,
    to: route.toTranslations[locale] ?? route.to,
    vehicleType: route.vehicleType || "",
    price: String(route.price),
    currency: route.currency,
    isActive: route.isActive,
    displayNameTranslations: route.displayNameTranslations,
    descriptionTranslations: route.descriptionTranslations,
    fromTranslations: route.fromTranslations,
    toTranslations: route.toTranslations,
  };
}

export function TransferRouteFormDialog({
  form,
  setForm,
  open,
  onOpenChange,
}: {
  form: TransferRouteFormState;
  setForm: (updater: (prev: TransferRouteFormState) => TransferRouteFormState) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations(TRANSFERS_TRANSLATION_KEY);
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSavingRoute, setIsSavingRoute] = useState(false);

  const saveService = useAction(saveProviderServiceAction, {
    startTransition,
    onSuccess: async (serviceId) => {
      if (!serviceId) return;

      setIsSavingRoute(true);
      try {
        const result = await upsertTransferRouteAction({
          id: form.id,
          providerServiceId: serviceId,
          serviceProviderId: form.serviceProviderId,
          fromTranslations: { translations: { ...form.fromTranslations, [locale]: form.from } },
          toTranslations: { translations: { ...form.toTranslations, [locale]: form.to } },
          vehicleType: form.vehicleType || undefined,
        });

        if (result.ok) {
          toast.success(t("admin.routes.saved"));
          onOpenChange(false);
          router.refresh();
          return;
        }

        toast.error(result.error || t("admin.errors.generic"));
      } catch {
        toast.error(t("admin.errors.generic"));
      } finally {
        setIsSavingRoute(false);
      }
    },
  });

  const isPendingAny = isPending || isSavingRoute;

  const save = () => {
    const displayName = { ...form.displayNameTranslations, [locale]: `${form.from} → ${form.to}` };

    saveService.execute({
      id: form.providerServiceId,
      serviceProviderId: form.serviceProviderId,
      serviceDefinitionId: form.serviceDefinitionId,
      displayName,
      description: form.descriptionTranslations,
      isActive: form.isActive,
      currency: form.currency,
      value: Number(form.price),
      durationMinutes: 0,
      isPopular: false,
      isFeatured: false,
      trendingScore: 0,
      slotIntervalMinutes: 15,
      addonIds: [],
    });
  };

  const canSave =
    Boolean(form.serviceProviderId) &&
    Boolean(form.serviceDefinitionId) &&
    Boolean(form.from.trim()) &&
    Boolean(form.to.trim()) &&
    Boolean(form.price);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? t("admin.routes.edit") : t("admin.routes.create")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("admin.routes.provider")}</Label>
              <StaffLazySearchableSelect
                resource="serviceProviders"
                locale={locale}
                value={form.serviceProviderId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, serviceProviderId: value }))}
                initialOptions={form.providerLabel ? [{ id: form.serviceProviderId, label: form.providerLabel }] : []}
                disabled={Boolean(form.id)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.routes.serviceDefinition")}</Label>
              <StaffLazySearchableSelect
                resource="serviceDefinitions"
                locale={locale}
                value={form.serviceDefinitionId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, serviceDefinitionId: value }))}
                initialOptions={
                  form.serviceDefinitionLabel ? [{ id: form.serviceDefinitionId, label: form.serviceDefinitionLabel }] : []
                }
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="transfer-route-from">{t("admin.routes.from")}</Label>
              <Input
                id="transfer-route-from"
                value={form.from}
                onChange={(event) => setForm((prev) => ({ ...prev, from: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-route-to">{t("admin.routes.to")}</Label>
              <Input
                id="transfer-route-to"
                value={form.to}
                onChange={(event) => setForm((prev) => ({ ...prev, to: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-route-vehicle">{t("admin.routes.vehicleType")}</Label>
            <Input
              id="transfer-route-vehicle"
              value={form.vehicleType}
              onChange={(event) => setForm((prev) => ({ ...prev, vehicleType: event.target.value }))}
              placeholder={t("admin.routes.vehicleTypePlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="transfer-route-price">{t("admin.routes.price")}</Label>
              <Input
                id="transfer-route-price"
                dir="ltr"
                inputMode="numeric"
                value={form.price}
                onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-route-currency">{t("admin.routes.currency")}</Label>
              <Input
                id="transfer-route-currency"
                dir="ltr"
                value={form.currency}
                onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="transfer-route-active"
              checked={form.isActive}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="transfer-route-active" className="font-normal">
              {t("admin.routes.isActive")}
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPendingAny}>
            {t("admin.routes.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPendingAny || !canSave}>
            {isPendingAny ? t("admin.routes.saving") : t("admin.routes.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
