"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useTransition } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

import {
  createSupportTicketAction,
  saveGalleryItemAction,
  saveOfferAction,
  savePayoutAccountAction,
  saveProviderCertificationAction,
  saveProviderPolicyAction,
  saveProviderServiceAction,
  saveServiceAddonSettingAction,
  saveServiceFaqAction,
  saveServiceGalleryItemAction,
  saveServiceIncludedAction,
  saveServiceProcessAction,
  saveStaffAction,
  saveStaffAvailabilityAction,
  saveStaffCertificationAction,
  saveStaffEducationAction,
  saveStaffGalleryItemAction,
  saveStaffServiceAction,
  updateSupportTicketAction,
} from "@/features/provider-portal/actions";
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

import { tCommon, tLabel, tMessage } from "../lib/i18n";

import type { ActionResult } from "../types";

type Option = { value: string | number; label: string };

type FieldType =
  | "hidden"
  | "text"
  | "email"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "date"
  | "time"
  | "datetime-local";

export type ProviderRecordFormField = {
  name: string;
  label?: string;
  type: FieldType;
  options?: Option[];
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  step?: string;
  min?: string | number;
  max?: string | number;
  rows?: number;
  className?: string;
  fullWidth?: boolean;
};

export type ProviderRecordFormOperation =
  | "saveProviderService"
  | "saveStaff"
  | "saveProviderGallery"
  | "saveOffer"
  | "savePayoutAccount"
  | "createSupportTicket"
  | "updateSupportTicket"
  | "saveProviderCertification"
  | "saveProviderPolicy"
  | "saveServiceGalleryItem"
  | "saveServiceAddonSetting"
  | "saveServiceIncluded"
  | "saveServiceProcess"
  | "saveServiceFaq"
  | "saveStaffCertification"
  | "saveStaffEducation"
  | "saveStaffAvailability"
  | "saveStaffGalleryItem"
  | "saveStaffService";

const actionMap: Record<
  ProviderRecordFormOperation,
  (input: unknown) => Promise<ActionResult<unknown>>
> = {
  saveProviderService: saveProviderServiceAction,
  saveStaff: saveStaffAction,
  saveProviderGallery: saveGalleryItemAction,
  saveOffer: saveOfferAction,
  savePayoutAccount: savePayoutAccountAction,
  createSupportTicket: createSupportTicketAction,
  updateSupportTicket: updateSupportTicketAction,
  saveProviderCertification: saveProviderCertificationAction,
  saveProviderPolicy: saveProviderPolicyAction,
  saveServiceGalleryItem: saveServiceGalleryItemAction,
  saveServiceAddonSetting: saveServiceAddonSettingAction,
  saveServiceIncluded: saveServiceIncludedAction,
  saveServiceProcess: saveServiceProcessAction,
  saveServiceFaq: saveServiceFaqAction,
  saveStaffCertification: saveStaffCertificationAction,
  saveStaffEducation: saveStaffEducationAction,
  saveStaffAvailability: saveStaffAvailabilityAction,
  saveStaffGalleryItem: saveStaffGalleryItemAction,
  saveStaffService: saveStaffServiceAction,
};

function valueToString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function normalizeInputValue(field: ProviderRecordFormField, data: FormData) {
  if (field.type === "checkbox") return data.has(field.name);
  const value = data.get(field.name);
  if (value === null) return undefined;
  const normalized = String(value);
  return normalized.length ? normalized : undefined;
}

export function ProviderRecordForm({
  operation,
  title,
  description,
  fields,
  initialValues,
  successMessage = "Saved successfully.",
  submitLabel = "Save",
  backHref,
}: {
  operation: ProviderRecordFormOperation;
  title: string;
  description?: string;
  fields: ProviderRecordFormField[];
  initialValues?: Record<string, unknown>;
  successMessage?: string;
  submitLabel?: string;
  backHref: string;
}) {
  const router = useRouter();
  const t = useTranslations("ProviderPortal");
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(
      fields.map((field) => [field.name, normalizeInputValue(field, formData)]),
    );

    startTransition(async () => {
      const response = await actionMap[operation](payload);
      if (!response.ok) {
        toast.error(
          response.error ||
            tCommon(
              t,
              "recordCouldNotBeSaved",
              "The record could not be saved.",
            ),
        );
        return;
      }
      toast.success(tMessage(t, successMessage));
      router.push(backHref);
      router.refresh();
    });
  }

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{tMessage(t, title)}</CardTitle>
            {description ? (
              <CardDescription>{tMessage(t, description)}</CardDescription>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(backHref)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> {tCommon(t, "back", "Back")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => {
            const rawValue = initialValues?.[field.name];
            const value = valueToString(rawValue);
            const commonProps = {
              name: field.name,
              defaultValue: value,
              placeholder: field.placeholder
                ? tMessage(t, field.placeholder)
                : undefined,
              required: field.required,
              disabled: isPending,
            };

            if (field.type === "hidden") {
              return (
                <input
                  key={field.name}
                  type="hidden"
                  name={field.name}
                  value={value}
                />
              );
            }

            return (
              <label
                key={field.name}
                className={
                  field.fullWidth ? "space-y-2 md:col-span-2" : "space-y-2"
                }
              >
                {field.label ? (
                  <span className="text-sm font-medium text-slate-800">
                    {tLabel(t, field.label)}
                  </span>
                ) : null}

                {field.type === "textarea" ? (
                  <Textarea {...commonProps} rows={field.rows || 4} />
                ) : field.type === "select" ? (
                  <select
                    name={field.name}
                    defaultValue={value}
                    required={field.required}
                    disabled={isPending}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">
                      {tCommon(t, "selectPlaceholder", "Select...")}
                    </option>
                    {(field.options || []).map((option) => (
                      <option
                        key={String(option.value)}
                        value={String(option.value)}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 px-3">
                    <input
                      type="checkbox"
                      name={field.name}
                      defaultChecked={Boolean(rawValue)}
                      disabled={isPending}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-600">
                      {tCommon(t, "enabled", "Enabled")}
                    </span>
                  </div>
                ) : (
                  <Input
                    {...commonProps}
                    type={field.type}
                    step={field.step}
                    min={field.min}
                    max={field.max}
                  />
                )}

                {field.helpText ? (
                  <p className="text-xs text-slate-500">
                    {tMessage(t, field.helpText)}
                  </p>
                ) : null}
              </label>
            );
          })}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 md:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(backHref)}
              disabled={isPending}
            >
              {tCommon(t, "cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />{" "}
              {isPending
                ? tCommon(t, "saving", "Saving...")
                : tMessage(t, submitLabel)}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
