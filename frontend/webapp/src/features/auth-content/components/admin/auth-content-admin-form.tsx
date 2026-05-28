"use client";


import { useTranslations } from "next-intl";
import { useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORTED_LOCALE_HEADERS } from "@/config/locales";
import {
  AUTH_CONTENT_TYPE_OPTIONS,
  AUTH_ONBOARDING_STEP_CONTENT_TYPE,
  AUTH_PAGE_CONTENT_TYPE,
} from "@/features/auth-content/lib/auth-content.constants";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import useAction from "@/hooks/use-action";
import { Link, useRouter } from "@/i18n/navigation";

import { saveAuthContentItemAction } from "../../actions/admin";
import { type AuthContentAdminDetails } from "@/features/auth-content/types/auth-content.types";
import {
  type AdminLocalizedInputValue,
  toLocalizedInputValue,
} from "../../lib/localized";
import {
  saveAuthContentItemSchema,
  type SaveAuthContentItemInput,
} from "../../schemas/admin-auth-content.schemas";

type Props = {
  item?: AuthContentAdminDetails | null;
  locale: string;
};

type FormValues = Omit<
  SaveAuthContentItemInput,
  "eyebrow" | "title" | "subtitle" | "body" | "buttonTitle" | "alt"
> & {
  eyebrow: AdminLocalizedInputValue;
  title: AdminLocalizedInputValue;
  subtitle: AdminLocalizedInputValue;
  body: AdminLocalizedInputValue;
  buttonTitle: AdminLocalizedInputValue;
  alt: AdminLocalizedInputValue;
};

function prettyJson(value: unknown) {
  if (!value || typeof value !== "object") return "{}";
  return JSON.stringify(value, null, 2);
}

function currentLocaleValue(value: unknown, locale: string) {
  const record = toLocalizedInputValue(value, locale, SUPPORTED_LOCALE_HEADERS);
  return record[locale] || record["en-US"] || Object.values(record).find(Boolean) || "";
}

function buildDefaultValues(item: AuthContentAdminDetails | null | undefined, locale: string): FormValues {
  const metadata = item?.metadata || {};
  const secondaryTranslations =
    metadata.secondaryButtonTitleTranslations &&
    typeof metadata.secondaryButtonTitleTranslations === "object" &&
    !Array.isArray(metadata.secondaryButtonTitleTranslations)
      ? metadata.secondaryButtonTitleTranslations
      : {};

  return {
    id: item?.id,
    typeCode: (item?.typeCode as FormValues["typeCode"]) || AUTH_PAGE_CONTENT_TYPE,
    itemKey: item?.itemKey || "sign-in",
    mediaUrl: item?.mediaUrl || "",
    mediaKind: item?.mediaKind || "image",
    eyebrow: toLocalizedInputValue(item?.eyebrow, locale, SUPPORTED_LOCALE_HEADERS),
    title: toLocalizedInputValue(item?.title, locale, SUPPORTED_LOCALE_HEADERS),
    subtitle: toLocalizedInputValue(item?.subtitle, locale, SUPPORTED_LOCALE_HEADERS),
    body: toLocalizedInputValue(item?.body, locale, SUPPORTED_LOCALE_HEADERS),
    buttonTitle: toLocalizedInputValue(item?.buttonTitle, locale, SUPPORTED_LOCALE_HEADERS),
    buttonUrl: item?.buttonUrl || "",
    alt: toLocalizedInputValue(item?.alt, locale, SUPPORTED_LOCALE_HEADERS),
    displayOrder: item?.displayOrder || 0,
    isActive: item?.isActive ?? true,
    openInNewTab: item?.openInNewTab ?? false,
    secondaryButtonTitle: currentLocaleValue(secondaryTranslations, locale),
    secondaryButtonUrl:
      typeof metadata.secondaryButtonUrl === "string" ? metadata.secondaryButtonUrl : "",
    metadataJson: prettyJson(item?.metadata || {}),
    styleJson: prettyJson(item?.style || {}),
    locale,
  };
}

type LocalizedInputBridgeProps = {
  label: string;
  value: unknown;
  onChange: (value: AdminLocalizedInputValue) => void;
  locale: string;
  required?: boolean;
  description?: string;
  multiline?: boolean;
  rows?: number;
};

function LocalizedInputBridge({ value, onChange, locale, ...props }: LocalizedInputBridgeProps) {
  const normalizedValue = useMemo(
    () => toLocalizedInputValue(value, locale, SUPPORTED_LOCALE_HEADERS),
    [value, locale],
  );

  return (
    <LocalizedInput
      {...props}
      value={normalizedValue}
      onChange={(nextValue) =>
        onChange(toLocalizedInputValue(nextValue, locale, SUPPORTED_LOCALE_HEADERS))
      }
      supportedLocales={SUPPORTED_LOCALE_HEADERS}
    />
  );
}

export function AuthContentAdminForm({ item, locale }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(item?.id);

  const defaultValues = useMemo(() => buildDefaultValues(item, locale), [item, locale]);

  const form = useForm<FormValues>({
    resolver: zodResolver(saveAuthContentItemSchema) as any,
    defaultValues,
  });

  const typeCode = form.watch("typeCode");

  const { execute } = useAction(saveAuthContentItemAction, {
    startTransition,
    onSuccess: (id) => {
      toast.success(isEdit ? "Auth content updated." : "Auth content created.");
      router.push(`/admin/auth-content/${id}`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.detail || error.title || "Could not save auth content.");
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      await execute({ ...values, locale });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button asChild variant="ghost" className="mb-2 px-0">
              <Link href="/admin/auth-content">
                <ArrowLeft className="mr-2 size-4" />
                Back to auth content
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isEdit ? "Edit auth content" : "Create auth content"}
            </h1>
            <p className="text-muted-foreground text-sm">
              These values override translation JSON for the selected auth placement.
            </p>
          </div>
          <Button disabled={isPending} type="submit">
            <Save className="mr-2 size-4" />
            Save
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{tAdmin("placement")}</CardTitle>
            <CardDescription>
              Auth pages use fixed keys. Onboarding steps are sorted by display order.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="typeCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAdmin("contentType")}</FormLabel>
                  <FormControl>
                    <select
                      className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {AUTH_CONTENT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
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
              name="itemKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAdmin("itemKey")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        typeCode === AUTH_ONBOARDING_STEP_CONTENT_TYPE
                          ? "step-1"
                          : "sign-in"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAdmin("displayOrder")}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-end gap-8">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 pb-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">{tAdmin("active")}</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="openInNewTab"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 pb-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">{tAdmin("openButtonInNewTab")}</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tAdmin("text")}</CardTitle>
            <CardDescription>
              Fill any locale supported by the platform. Empty locales fall back automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="eyebrow"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <LocalizedInputBridge label={tAdmin("eyebrow")} value={field.value} onChange={field.onChange} locale={locale} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <LocalizedInputBridge label={tAdmin("title")} value={field.value} onChange={field.onChange} locale={locale} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <LocalizedInputBridge label={tAdmin("subtitleDescription")} value={field.value} onChange={field.onChange} locale={locale} multiline rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <LocalizedInputBridge label={tAdmin("body")} value={field.value} onChange={field.onChange} locale={locale} multiline rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tAdmin("mediaAndButtons")}</CardTitle>
            <CardDescription>
              Image URL accepts uploaded media paths or full CDN URLs. Secondary button is used by onboarding steps.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="mediaUrl"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{tAdmin("imageMediaURL")}</FormLabel>
                  <FormControl>
                    <Input placeholder="/images/auth/sign-in.png" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="alt"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormControl>
                    <LocalizedInputBridge label={tAdmin("imageAltText")} value={field.value} onChange={field.onChange} locale={locale} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="buttonTitle"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <LocalizedInputBridge label={tAdmin("primaryButtonTitle")} value={field.value} onChange={field.onChange} locale={locale} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="buttonUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAdmin("primaryButtonURL")}</FormLabel>
                  <FormControl>
                    <Input placeholder="/sign-up" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secondaryButtonTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAdmin("secondaryButtonTitle")}</FormLabel>
                  <FormControl>
                    <Input placeholder={tAdmin("signIn")} {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secondaryButtonUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAdmin("secondaryButtonURL")}</FormLabel>
                  <FormControl>
                    <Input placeholder="/sign-in" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tAdmin("advancedJSON")}</CardTitle>
            <CardDescription>
              Keep valid JSON objects. Metadata can hold tracking tags or extra UI options; style can hold future design controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="metadataJson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAdmin("metadataJSON")}</FormLabel>
                  <FormControl>
                    <Textarea rows={8} className="font-mono text-xs" {...field} value={field.value || "{}"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="styleJson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAdmin("styleJSON")}</FormLabel>
                  <FormControl>
                    <Textarea rows={8} className="font-mono text-xs" {...field} value={field.value || "{}"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
