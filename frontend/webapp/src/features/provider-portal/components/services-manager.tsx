"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit,
  Eye,
  ImageIcon,
  ListChecks,
  Plus,
  Sparkles,
  Trash2,
  Workflow,
  HelpCircle,
  Gift,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  deleteProviderServiceAction,
  saveProviderServiceAction,
} from "@/features/provider-portal/actions";
import { saveProviderServiceSchema } from "@/features/provider-portal/schemas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/navigation";

import { LocalizedRichPreview } from "./localized-rich-preview";
import { PortalImage } from "./portal-image";
import { displayTranslation, joinCsv } from "../lib/normalizers";
import { tCommon, tLabel, tMessage, tStatus } from "../lib/i18n";
import type {
  ProviderServiceRow,
  ProviderWorkspace,
  ServiceDefinitionOption,
} from "../types";

type FormValues = z.infer<typeof saveProviderServiceSchema>;

function actionLinkClass(primary = false) {
  return [
    "inline-flex h-9 items-center justify-center rounded-xl px-3 text-sm font-medium transition",
    primary
      ? "bg-slate-950 text-white hover:bg-slate-800"
      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950",
  ].join(" ");
}

export function ServicesManager({
  workspace,
  services,
  definitions,
  initialServiceId,
  formOnly = false,
}: {
  workspace: ProviderWorkspace;
  services: ProviderServiceRow[];
  definitions: ServiceDefinitionOption[];
  initialServiceId?: string;
  formOnly?: boolean;
}) {
  const t = useTranslations("ProviderPortal");
  const initialEditing = initialServiceId
    ? (services.find((service) => service.id === initialServiceId) ?? null)
    : null;
  const [editing, setEditing] = useState<ProviderServiceRow | null>(
    initialEditing,
  );
  const canManage = workspace.permissions.manageServices;
  const base = `/provider-portal/providers/${workspace.provider.id}`;

  if (formOnly) {
    return (
      <div className="space-y-6">
        {canManage ? (
          <ServiceForm
            providerId={workspace.provider.id}
            definitions={definitions}
            editing={editing}
            onDone={() => setEditing(null)}
          />
        ) : (
          <PermissionNotice role={workspace.role} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Sparkles className="h-4 w-4" />{" "}
              {tCommon(t, "services", "Services")}
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">
              {tCommon(t, "manageProviderServices", "Manage provider services")}
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              {tCommon(
                t,
                "servicesManagerDescription",
                "This is the provider-owned service catalog. Each row has direct admin-style actions for editing, media, add-ons, included items, process steps and FAQs.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManage ? (
              <Link
                href={`${base}/services/new`}
                className={actionLinkClass(true)}
              >
                <Plus className="mr-2 h-4 w-4" />{" "}
                {tCommon(t, "addService", "Add service")}
              </Link>
            ) : null}
            <Link href={`${base}/dashboard`} className={actionLinkClass(false)}>
              <Eye className="mr-2 h-4 w-4" />{" "}
              {tCommon(t, "dashboard", "Dashboard")}
            </Link>
          </div>
        </div>
        {!canManage ? <PermissionNotice role={workspace.role} /> : null}
      </div>

      <Card className="overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/60">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{tCommon(t, "allServices", "All services")}</CardTitle>
              <CardDescription>
                {tCommon(
                  t,
                  "servicesVisibilityDescription",
                  "Visible edit/manage buttons are rendered per row when your provider membership role can manage services.",
                )}
              </CardDescription>
            </div>
            <Badge variant="outline" className="w-fit rounded-xl px-3 py-1.5">
              {tCommon(t, "recordsCount", "{count} records", {
                count: services.length,
              })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {services.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-white text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">
                      {tLabel(t, "Service")}
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      {tLabel(t, "Price")}
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      {tLabel(t, "Timing")}
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      {tLabel(t, "Status")}
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      {tCommon(t, "actions", "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {services.map((service) => (
                    <tr
                      key={service.id}
                      className="align-top transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex gap-4">
                          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                            <PortalImage
                              src={service.imageUrl}
                              alt={service.name}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-950">
                                {service.name}
                              </p>
                              {service.isPopular ? (
                                <Badge variant="outline">
                                  {tCommon(t, "popular", "Popular")}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {service.serviceDefinitionName}
                            </p>
                            <div className="mt-2 line-clamp-2 max-w-xl text-sm text-slate-600">
                              <LocalizedRichPreview
                                translations={service.description}
                              />
                            </div>
                            {service.tags?.length ? (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {service.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {service.currency} {service.value.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <div>
                          {tCommon(
                            t,
                            "durationMinutesValue",
                            "{count} min duration",
                            { count: service.durationMinutes },
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {tCommon(
                            t,
                            "slotIntervalValue",
                            "{count} min slot interval",
                            { count: service.slotIntervalMinutes },
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={service.isActive ? "default" : "secondary"}
                        >
                          {service.isActive
                            ? tStatus(t, "active")
                            : tStatus(t, "inactive")}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          {canManage ? (
                            <>
                              <Link
                                href={`${base}/services/${service.id}/edit`}
                                className={actionLinkClass(false)}
                              >
                                <Edit className="mr-2 h-4 w-4" />{" "}
                                {tCommon(t, "edit", "Edit")}
                              </Link>
                              <Link
                                href={`${base}/services/${service.id}/gallery`}
                                className={actionLinkClass(false)}
                              >
                                <ImageIcon className="mr-2 h-4 w-4" />{" "}
                                {tCommon(t, "media", "Media")}
                              </Link>
                              <Link
                                href={`${base}/services/${service.id}/add-ons`}
                                className={actionLinkClass(false)}
                              >
                                <Gift className="mr-2 h-4 w-4" />{" "}
                                {tCommon(t, "addOns", "Add-ons")}
                              </Link>
                              <Link
                                href={`${base}/services/${service.id}/included`}
                                className={actionLinkClass(false)}
                              >
                                <ListChecks className="mr-2 h-4 w-4" />{" "}
                                {tCommon(t, "included", "Included")}
                              </Link>
                              <Link
                                href={`${base}/services/${service.id}/process`}
                                className={actionLinkClass(false)}
                              >
                                <Workflow className="mr-2 h-4 w-4" />{" "}
                                {tCommon(t, "process", "Process")}
                              </Link>
                              <Link
                                href={`${base}/services/${service.id}/faqs`}
                                className={actionLinkClass(false)}
                              >
                                <HelpCircle className="mr-2 h-4 w-4" />{" "}
                                {tCommon(t, "faqs", "FAQs")}
                              </Link>
                              <DeleteServiceButton
                                providerId={workspace.provider.id}
                                serviceId={service.id}
                              />
                            </>
                          ) : (
                            <span className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                              {tCommon(t, "readOnlyRole", "Read-only role")}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="rounded-3xl bg-slate-100 p-4 text-slate-500">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <p className="font-semibold text-slate-950">
                  {tCommon(t, "noServicesYet", "No services yet")}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {tCommon(
                    t,
                    "createFirstProviderService",
                    "Create the first provider-owned service for this workspace.",
                  )}
                </p>
              </div>
              {canManage ? (
                <Link
                  href={`${base}/services/new`}
                  className={actionLinkClass(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />{" "}
                  {tCommon(t, "addService", "Add service")}
                </Link>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PermissionNotice({ role }: { role: string }) {
  const t = useTranslations("ProviderPortal");

  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
      {tCommon(
        t,
        "servicePermissionNoticePrefix",
        "Your current provider portal role is",
      )}{" "}
      <span className="font-semibold">{role}</span>
      {tCommon(
        t,
        "servicePermissionNoticeSuffix",
        ", so service edit actions are disabled. For the actual provider owner, the row in",
      )}{" "}
      <code>provider_portal.provider_members</code>{" "}
      {tCommon(t, "servicePermissionNoticeMustBe", "must be")}{" "}
      <code>owner</code>, <code>admin</code>, <code>manager</code>,{" "}
      {tCommon(t, "or", "or")} <code>editor</code>.
    </div>
  );
}

function ServiceForm({
  providerId,
  definitions,
  editing,
  onDone,
}: {
  providerId: string;
  definitions: ServiceDefinitionOption[];
  editing: ProviderServiceRow | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("ProviderPortal");
  const [isPending, startTransition] = useTransition();

  const defaultValues = useMemo<FormValues>(
    () => ({
      providerId,
      serviceId: editing?.id || undefined,
      serviceDefinitionId:
        editing?.serviceDefinitionId || definitions[0]?.id || "",
      nameEn: editing
        ? displayTranslation(editing.displayName, "en-US", "")
        : "",
      nameFa: editing
        ? displayTranslation(editing.displayName, "fa-IR", "")
        : "",
      descriptionEn: editing
        ? displayTranslation(editing.description, "en-US", "")
        : "",
      descriptionFa: editing
        ? displayTranslation(editing.description, "fa-IR", "")
        : "",
      currency: editing?.currency || definitions[0]?.currency || "USD",
      value: editing?.value || definitions[0]?.value || 0,
      durationMinutes:
        editing?.durationMinutes || definitions[0]?.durationMinutes || 0,
      slotIntervalMinutes: editing?.slotIntervalMinutes || 15,
      imageUrl: editing?.imageUrl || "",
      isActive: editing?.isActive ?? true,
      isPopular: editing?.isPopular ?? false,
      tagsCsv: joinCsv(editing?.tags || []),
    }),
    [providerId, definitions, editing],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(saveProviderServiceSchema),
    values: defaultValues,
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const response = await saveProviderServiceAction(values);
      if (!response.ok) {
        toast.error(
          response.error ||
            tCommon(t, "serviceCouldNotBeSaved", "Service could not be saved."),
        );
        return;
      }
      toast.success(
        editing
          ? tCommon(t, "serviceUpdated", "Service updated.")
          : tCommon(t, "serviceCreated", "Service created."),
      );
      onDone();
      router.refresh();
    });
  };

  return (
    <Card className="rounded-[2rem] border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {editing
            ? tCommon(t, "editService", "Edit service")
            : tCommon(t, "addService", "Add service")}
        </CardTitle>
        <CardDescription>
          {tCommon(
            t,
            "servicePricingDescription",
            "Prices are stored in source currency. Use your multicurrency kit in customer-facing UI.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 md:grid-cols-2"
        >
          <input type="hidden" {...form.register("providerId")} />
          <input type="hidden" {...form.register("serviceId")} />

          <label className="space-y-2">
            <span className="text-sm font-medium">
              {tLabel(t, "Global service definition")}
            </span>
            <select
              {...form.register("serviceDefinitionId")}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              {definitions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            {form.formState.errors.serviceDefinitionId ? (
              <p className="text-xs text-red-600">
                {form.formState.errors.serviceDefinitionId.message}
              </p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              {tLabel(t, "Image URL / media id")}
            </span>
            <Input {...form.register("imageUrl")} disabled={isPending} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              {tLabel(t, "Name English")}
            </span>
            <Input {...form.register("nameEn")} disabled={isPending} />
            {form.formState.errors.nameEn ? (
              <p className="text-xs text-red-600">
                {form.formState.errors.nameEn.message}
              </p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              {tLabel(t, "Name Persian")}
            </span>
            <Input {...form.register("nameFa")} disabled={isPending} />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">
              {tLabel(t, "Description English")}
            </span>
            <Textarea
              {...form.register("descriptionEn")}
              rows={4}
              disabled={isPending}
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">
              {tLabel(t, "Description Persian")}
            </span>
            <Textarea
              {...form.register("descriptionFa")}
              rows={4}
              disabled={isPending}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">{tLabel(t, "Currency")}</span>
            <Input
              {...form.register("currency")}
              maxLength={15}
              disabled={isPending}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">{tLabel(t, "Price")}</span>
            <Input
              {...form.register("value")}
              type="number"
              step="0.01"
              disabled={isPending}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              {tLabel(t, "Duration minutes")}
            </span>
            <Input
              {...form.register("durationMinutes")}
              type="number"
              disabled={isPending}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              {tLabel(t, "Slot interval minutes")}
            </span>
            <Input
              {...form.register("slotIntervalMinutes")}
              type="number"
              disabled={isPending}
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">{tLabel(t, "Tags CSV")}</span>
            <Input
              {...form.register("tagsCsv")}
              placeholder={tMessage(t, "VIP, Popular, Dental")}
              disabled={isPending}
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...form.register("isActive")}
              className="h-4 w-4 rounded border-slate-300"
            />
            {tStatus(t, "active")}
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...form.register("isPopular")}
              className="h-4 w-4 rounded border-slate-300"
            />
            {tCommon(t, "popular", "Popular")}
          </label>

          <div className="flex justify-end gap-3 border-t pt-5 md:col-span-2">
            {editing ? (
              <Button
                type="button"
                variant="outline"
                onClick={onDone}
                disabled={isPending}
              >
                {tCommon(t, "cancelEdit", "Cancel edit")}
              </Button>
            ) : null}
            <Button type="submit" disabled={isPending}>
              {isPending
                ? tCommon(t, "saving", "Saving...")
                : editing
                  ? tCommon(t, "saveService", "Save service")
                  : tCommon(t, "addService", "Add service")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteServiceButton({
  providerId,
  serviceId,
}: {
  providerId: string;
  serviceId: string;
}) {
  const router = useRouter();
  const t = useTranslations("ProviderPortal");
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={isPending}
      className="rounded-xl"
      onClick={() => {
        if (
          !confirm(
            tCommon(t, "deactivateThisService", "Deactivate this service?"),
          )
        )
          return;
        startTransition(async () => {
          const response = await deleteProviderServiceAction({
            providerId,
            serviceId,
          });
          if (!response.ok) {
            toast.error(
              response.error ||
                tCommon(
                  t,
                  "serviceCouldNotBeDeactivated",
                  "Service could not be deactivated.",
                ),
            );
            return;
          }
          toast.success(
            tCommon(t, "serviceDeactivated", "Service deactivated."),
          );
          router.refresh();
        });
      }}
    >
      <Trash2 className="mr-2 h-4 w-4" />{" "}
      {tCommon(t, "deactivate", "Deactivate")}
    </Button>
  );
}
