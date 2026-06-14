"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Percent, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  deleteOfferAction,
  saveOfferAction,
} from "@/features/provider-portal/actions";
import { saveOfferSchema } from "@/features/provider-portal/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import type { OfferRow, ProviderServiceRow, ProviderWorkspace } from "../types";

type FormValues = z.infer<typeof saveOfferSchema>;

export function OffersManager({
  workspace,
  offers,
  services,
  initialOfferId,
  formOnly = false,
}: {
  workspace: ProviderWorkspace;
  offers: OfferRow[];
  services: ProviderServiceRow[];
  initialOfferId?: number;
  formOnly?: boolean;
}) {
  const t = useTranslations("ProviderPortal");
  const initialEditing = initialOfferId
    ? (offers.find((offer) => offer.id === initialOfferId) ?? null)
    : null;
  const [editing, setEditing] = useState<OfferRow | null>(initialEditing);
  const visibleOffers = formOnly && editing ? [editing] : offers;

  return (
    <div className="space-y-6">
      {workspace.permissions.manageOffers ? (
        <OfferForm
          providerId={workspace.provider.id}
          services={services}
          editing={editing}
          onDone={() => setEditing(null)}
        />
      ) : null}

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            {t("offersManager.title")}
          </CardTitle>
          <CardDescription>
            {t("offersManager.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleOffers.length ? (
            visibleOffers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{offer.title}</h3>
                      <Badge>{offer.discountPercent}%</Badge>
                      <Badge variant={offer.isActive ? "default" : "secondary"}>
                        {offer.isActive
                          ? t("status.active")
                          : t("status.inactive")}
                      </Badge>
                      {offer.isFeatured ? (
                        <Badge variant="outline">
                          {t("status.featured")}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {offer.serviceName}
                    </p>
                    {offer.subtitle ? (
                      <p className="mt-2 text-sm text-slate-600">
                        {offer.subtitle}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500">
                      {t("offerForm.validUntil")}{" "}
                      {new Date(offer.validUntil).toLocaleString()} ·{" "}
                      {t("offersManager.used")} {offer.usedCount}
                      {offer.usageLimit ? `/${offer.usageLimit}` : ""}
                    </p>
                  </div>
                  {workspace.permissions.manageOffers ? (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(offer)}
                      >
                        <Edit className="mr-2 h-4 w-4" />{" "}
                        {t("common.edit")}
                      </Button>
                      <DeleteOfferButton
                        providerId={workspace.provider.id}
                        offerId={offer.id}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
              {t("offersManager.noOffersYet")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OfferForm({
  providerId,
  services,
  editing,
  onDone,
}: {
  providerId: string;
  services: ProviderServiceRow[];
  editing: OfferRow | null;
  onDone: () => void;
}) {
  const t = useTranslations("ProviderPortal");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues = useMemo<FormValues>(
    () => ({
      providerId,
      offerId: editing?.id || undefined,
      providerServiceId: editing?.providerServiceId || services[0]?.id || "",
      title: editing?.title || "",
      subtitle: editing?.subtitle || "",
      discountPercent: editing?.discountPercent || 0,
      validUntil: editing?.validUntil ? editing.validUntil.slice(0, 16) : "",
      code: editing?.code || "",
      isActive: editing?.isActive ?? true,
      isFeatured: editing?.isFeatured ?? false,
      usageLimit: editing?.usageLimit || undefined,
      descriptionEn: "",
      descriptionFa: "",
    }),
    [providerId, services, editing],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(saveOfferSchema),
    values: defaultValues,
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const response = await saveOfferAction(values);
      if (!response.ok) {
        toast.error(
          response.error ||
            t("offersManager.offerCouldNotBeSaved"),
        );
        return;
      }
      toast.success(
        editing
          ? t("offersManager.offerUpdated")
          : t("offersManager.offerCreated"),
      );
      onDone();
      router.refresh();
    });
  };

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>
          {editing
            ? t("offerForm.editTitle")
            : t("offerForm.createTitle")}
        </CardTitle>
        <CardDescription>
          {t("offerForm.requiresService")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {services.length ? (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 md:grid-cols-2"
          >
            <input type="hidden" {...form.register("providerId")} />
            <input type="hidden" {...form.register("offerId")} />

            <label className="space-y-2">
              <span className="text-sm font-medium">
                {t("offerForm.service")}
              </span>
              <select
                {...form.register("providerServiceId")}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">{t("offerForm.code")}</span>
              <Input
                {...form.register("code")}
                placeholder={t("common.optional")}
                disabled={isPending}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">{t("offerForm.title")}</span>
              <Input {...form.register("title")} disabled={isPending} />
              {form.formState.errors.title ? (
                <p className="text-xs text-red-600">
                  {form.formState.errors.title.message}
                </p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">
                {t("offerForm.subtitle")}
              </span>
              <Input {...form.register("subtitle")} disabled={isPending} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">
                {t("offerForm.discountPercent")}
              </span>
              <Input
                type="number"
                step="0.01"
                {...form.register("discountPercent")}
                disabled={isPending}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">
                {t("offerForm.validUntil")}
              </span>
              <Input
                type="datetime-local"
                {...form.register("validUntil")}
                disabled={isPending}
              />
              {form.formState.errors.validUntil ? (
                <p className="text-xs text-red-600">
                  {form.formState.errors.validUntil.message}
                </p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">
                {t("offerForm.usageLimit")}
              </span>
              <Input
                type="number"
                {...form.register("usageLimit")}
                disabled={isPending}
              />
            </label>

            <div className="flex items-end gap-5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...form.register("isActive")}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {t("status.active")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...form.register("isFeatured")}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {t("status.featured")}
              </label>
            </div>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">
                {t("offerForm.descriptionEn")}
              </span>
              <Textarea
                {...form.register("descriptionEn")}
                disabled={isPending}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">
                {t("offerForm.descriptionFa")}
              </span>
              <Textarea
                {...form.register("descriptionFa")}
                disabled={isPending}
              />
            </label>

            <div className="flex justify-end gap-3 border-t pt-5 md:col-span-2">
              {editing ? (
                <Button type="button" variant="outline" onClick={onDone}>
                  {t("offerForm.cancelEdit")}
                </Button>
              ) : null}
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? t("common.saving")
                  : t("offerForm.saveOffer")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
            {t("offersManager.createServiceFirstThenOffers")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeleteOfferButton({
  providerId,
  offerId,
}: {
  providerId: string;
  offerId: number;
}) {
  const t = useTranslations("ProviderPortal");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm(t("offersManager.deleteThisOffer")))
          return;
        startTransition(async () => {
          const response = await deleteOfferAction({ providerId, offerId });
          if (!response.ok) {
            toast.error(
              response.error ||
                t("offersManager.offerCouldNotBeDeleted"),
            );
            return;
          }
          toast.success(t("offersManager.offerDeleted"));
          router.refresh();
        });
      }}
    >
      <Trash2 className="mr-2 h-4 w-4" /> {t("common.delete")}
    </Button>
  );
}
