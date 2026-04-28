"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RHFSingleMediaPickerField } from "@/features/media-picker-addon";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";

import {
  SPONSERED_SLIDER_ALIGNMENTS,
  SPONSERED_SLIDER_OVERLAY_VARIANTS,
  SPONSERED_SLIDER_PLACEMENTS,
  type SponseredSliderAdminRow,
} from "../types";
import { saveSponseredSliderAction } from "../server/actions";
import { SponseredSliderInputSchema, type SponseredSliderFormValues } from "../server/schema";

type FormValues = SponseredSliderFormValues & { id?: string };

const emptyTranslations = {
  "ar-SA": "",
  "de-DE": "",
  "en-US": "",
  "es-ES": "",
  "fa-IR": "",
  "fr-FR": "",
  "ku-KU": "",
  "tr-TR": "",
};

function hasTranslationValue(value?: Record<string, string> | null) {
  return Object.values(value || {}).some((text) => typeof text === "string" && text.trim().length > 0);
}

function withTranslationDefaults(value?: Record<string, string> | null, fallback?: Record<string, string>) {
  const source = hasTranslationValue(value) ? value : fallback;
  return { ...emptyTranslations, ...(source || {}) };
}

function localizedValue(value?: Record<string, string> | null) {
  return { translations: withTranslationDefaults(value) };
}

function localizedTranslations(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const maybeLocalized = value as { translations?: unknown };
  if (
    maybeLocalized.translations &&
    typeof maybeLocalized.translations === "object" &&
    !Array.isArray(maybeLocalized.translations)
  ) {
    return maybeLocalized.translations as Record<string, string>;
  }
  return value as Record<string, string>;
}

function toFormValues(row?: SponseredSliderAdminRow | null): FormValues {
  return {
    id: row?.id,
    placementKey: (row?.placementKey as FormValues["placementKey"]) || "home_native_ad",
    mediaId: row?.mediaId || "",
    url: row?.url || "",
    link: row?.link || "",
    secondaryLink: row?.secondaryLink || "",
    mediaTypeId: row?.mediaTypeId || "",
    eyebrowTranslations: withTranslationDefaults(row?.eyebrowTranslations),
    titleTranslations: withTranslationDefaults(row?.titleTranslations, row?.legacyTitle ? { "en-US": row.legacyTitle } : {}),
    subtitleTranslations: withTranslationDefaults(row?.subtitleTranslations, row?.legacySubtitle ? { "en-US": row.legacySubtitle } : {}),
    descriptionTranslations: withTranslationDefaults(row?.descriptionTranslations),
    buttonLabelTranslations: withTranslationDefaults(row?.buttonLabelTranslations, row?.legacyButtonLabel ? { "en-US": row.legacyButtonLabel } : { "en-US": "Learn More" }),
    badgeTranslations: withTranslationDefaults(row?.badgeTranslations),
    secondaryButtonLabelTranslations: withTranslationDefaults(row?.secondaryButtonLabelTranslations),
    ariaLabelTranslations: withTranslationDefaults(row?.ariaLabelTranslations),
    overlayVariant: row?.overlayVariant || "dark",
    contentAlignment: row?.contentAlignment || "left",
    opensInNewTab: row?.opensInNewTab ?? false,
    displayOrder: row?.displayOrder ?? 0,
    isActive: row?.isActive ?? true,
    metadata: row?.metadata || {},
  };
}

function prettify(value: string) {
  return value.replaceAll("_", " ");
}

function labelFromPath(path: string) {
  return prettify(path.replace(/Translations$/, " translations").replace(/([a-z])([A-Z])/g, "$1 $2")).trim();
}

function collectFormErrorMessages(errors: Record<string, any>, prefix = ""): string[] {
  return Object.entries(errors || {}).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!value) return [];

    const current = typeof value.message === "string" ? [`${labelFromPath(path)}: ${value.message}`] : [];
    const children =
      typeof value === "object"
        ? collectFormErrorMessages(
            Object.fromEntries(
              Object.entries(value).filter(([childKey]) => !["message", "type", "ref", "types"].includes(childKey))
            ),
            path
          )
        : [];

    return [...current, ...children];
  });
}

function serverFieldErrorsToMessages(fieldErrors?: Record<string, string[]>) {
  return Object.entries(fieldErrors || {}).flatMap(([fieldName, messages]) => {
    if (!messages?.length) return [];
    return messages.map((message) => `${labelFromPath(fieldName)}: ${message}`);
  });
}

export function SponseredSliderAdminForm({ slider }: { slider?: SponseredSliderAdminRow | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [errorSummary, setErrorSummary] = useState<string[]>([]);
  const defaults = useMemo(() => toFormValues(slider), [slider]);

  const form = useForm<FormValues>({
    resolver: zodResolver(SponseredSliderInputSchema),
    defaultValues: defaults,
    mode: "onSubmit",
  });

  function setLocalizedField(name: keyof Pick<
    FormValues,
    | "eyebrowTranslations"
    | "titleTranslations"
    | "subtitleTranslations"
    | "descriptionTranslations"
    | "buttonLabelTranslations"
    | "badgeTranslations"
    | "secondaryButtonLabelTranslations"
    | "ariaLabelTranslations"
  >) {
    return (value: unknown) => {
      form.setValue(name as never, localizedTranslations(value) as never, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false,
      });
    };
  }

  function onSubmit(values: FormValues) {
    setServerMessage(null);
    setErrorSummary([]);
    startTransition(async () => {
      const result = await saveSponseredSliderAction(values);
      if (!result.ok) {
        setServerMessage(result.message || "Failed to save slider.");
        setErrorSummary(serverFieldErrorsToMessages(result.fieldErrors));
        for (const [fieldName, messages] of Object.entries(result.fieldErrors || {})) {
          form.setError(fieldName as never, { message: messages?.[0] || "Invalid value" });
        }
        return;
      }
      router.push("/admin/sponsered-slider");
      router.refresh();
    });
  }

  function onInvalid(errors: Record<string, any>) {
    setServerMessage("Please review the highlighted fields.");
    const messages = collectFormErrorMessages(errors);
    setErrorSummary(messages.length ? messages : ["Some values need review before saving."]);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-2 -ml-3 gap-2">
            <Link href="/admin/sponsered-slider">
              <ArrowLeft className="h-4 w-4" />
              Back to sliders
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {slider ? "Edit sponsored slider" : "Create sponsored slider"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage every visible frontend text: eyebrow, title, subtitle, description, badge, and CTA labels.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Placement and media</CardTitle>
              <CardDescription>Select where this slide appears and attach its image, GIF, or video.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="placementKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placement</FormLabel>
                    <Select disabled={isPending} value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select placement" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SPONSERED_SLIDER_PLACEMENTS.map((placement) => (
                          <SelectItem key={placement} value={placement}>{prettify(placement)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Use the same key in the frontend component, for example home_native_ad.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <RHFSingleMediaPickerField
                control={form.control}
                name="mediaId"
                label="Media library item"
                placeholder="Pick image, GIF, or video"
                mediaType="all"
                helperText="Preferred. The frontend resolves the file URL from media.media_library."
                modalTitle="Pick slider media"
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direct media URL fallback</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} disabled={isPending} placeholder="https://..." />
                    </FormControl>
                    <FormDescription>Used only when no media library item is selected.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main CTA link</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} disabled={isPending} placeholder="/n/app/mobile/offers" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondaryLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary CTA link</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} disabled={isPending} placeholder="Optional" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="opensInNewTab"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 rounded-2xl border border-slate-200 p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Open links in new tab</FormLabel>
                      <FormDescription>Useful for external campaign URLs.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frontend texts</CardTitle>
              <CardDescription>These fields replace hardcoded texts like “Premium placement” and “Discover featured wellness offers”. All text fields are optional; empty values simply hide or fall back on the frontend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <LocalizedInput
                label="Eyebrow / small top text"
                value={localizedValue(form.watch("eyebrowTranslations") as never) as never}
                onChange={setLocalizedField("eyebrowTranslations")}
                maxLength={120}
              />
              <LocalizedInput
                label="Title"
                value={localizedValue(form.watch("titleTranslations") as never) as never}
                onChange={setLocalizedField("titleTranslations")}
                maxLength={180}
              />
              <LocalizedInput
                label="Subtitle"
                value={localizedValue(form.watch("subtitleTranslations") as never) as never}
                onChange={setLocalizedField("subtitleTranslations")}
                maxLength={260}
              />
              <LocalizedInput
                label="Description / body text"
                value={localizedValue(form.watch("descriptionTranslations") as never) as never}
                onChange={setLocalizedField("descriptionTranslations")}
                multiline
                rows={4}
                maxLength={1200}
              />
              <LocalizedInput
                label="Main button label"
                value={localizedValue(form.watch("buttonLabelTranslations") as never) as never}
                onChange={setLocalizedField("buttonLabelTranslations")}
                maxLength={80}
              />
              <LocalizedInput
                label="Secondary button label"
                value={localizedValue(form.watch("secondaryButtonLabelTranslations") as never) as never}
                onChange={setLocalizedField("secondaryButtonLabelTranslations")}
                maxLength={80}
              />
              <LocalizedInput
                label="Badge text"
                value={localizedValue(form.watch("badgeTranslations") as never) as never}
                onChange={setLocalizedField("badgeTranslations")}
                maxLength={100}
              />
              <LocalizedInput
                label="ARIA label"
                value={localizedValue(form.watch("ariaLabelTranslations") as never) as never}
                onChange={setLocalizedField("ariaLabelTranslations")}
                maxLength={180}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Display controls</CardTitle>
              <CardDescription>Fine tune ordering, overlay style, and activation.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="overlayVariant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overlay variant</FormLabel>
                    <Select disabled={isPending} value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {SPONSERED_SLIDER_OVERLAY_VARIANTS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contentAlignment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content alignment</FormLabel>
                    <Select disabled={isPending} value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {SPONSERED_SLIDER_ALIGNMENTS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display order</FormLabel>
                    <FormControl><Input {...field} value={String(field.value ?? 0)} disabled={isPending} type="number" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 rounded-2xl border border-slate-200 p-4">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>Inactive slides are hidden from frontend.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>Optional JSON for campaign id, tracking tags, provider ids, or custom flags.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="metadata"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metadata JSON</FormLabel>
                    <FormControl>
                      <Textarea
                        value={JSON.stringify(field.value || {}, null, 2)}
                        onChange={(event) => {
                          try {
                            field.onChange(JSON.parse(event.target.value || "{}"));
                          } catch {
                            field.onChange(field.value);
                          }
                        }}
                        className="min-h-36 font-mono text-xs"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {(serverMessage || errorSummary.length > 0) && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverMessage && <p className="font-medium">{serverMessage}</p>}
              {errorSummary.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {errorSummary.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button asChild type="button" variant="outline">
              <Link href="/admin/sponsered-slider">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              <Save className="h-4 w-4" />
              Save slider
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
