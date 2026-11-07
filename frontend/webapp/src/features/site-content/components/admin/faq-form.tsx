"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RHFLazySearchableSelectField } from "@/features/admin-lazy-select";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import { useRouter } from "@/i18n/navigation";
import { catalogDataLocale } from "@/lib/pwa/data-locale";

import { saveFaqAction, type EditorialActionFailure } from "../../actions";
import type { FaqFormInput } from "../../actions/schema";
import { FAQ_APP_KEYS, FAQ_ENTITY_RESOURCE, FAQ_SCOPES, SITE_PAGE_SLUGS, type FaqAdminRow, type FaqScope } from "../../types";

export function FaqForm({ faq, initialScope }: { faq?: FaqAdminRow | null; initialScope?: FaqScope }) {
  const t = useTranslations("AdminEditorial");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FaqFormInput>({
    defaultValues: {
      id: faq?.id ?? null,
      scope: faq?.scope ?? initialScope ?? "home",
      entityId: faq?.entityId ?? null,
      entityKey: faq?.entityKey ?? null,
      question: { translations: (faq?.question ?? {}) as Record<string, string> },
      answer: { translations: (faq?.answer ?? {}) as Record<string, string> },
      displayOrder: faq?.displayOrder ?? 0,
      isActive: faq?.isActive ?? true,
    },
  });

  const scope = useWatch({ control: form.control, name: "scope" }) as FaqScope;
  const resource = FAQ_ENTITY_RESOURCE[scope];
  const keyOptions: readonly string[] = scope === "app" ? FAQ_APP_KEYS : scope === "site_page" ? SITE_PAGE_SLUGS : [];

  const onSubmit = (values: FaqFormInput) => {
    form.clearErrors();
    startTransition(async () => {
      const result = await saveFaqAction(values);
      if (result.ok) {
        toast.success(t("saved"));
        if (!values.id) {
          router.replace(`/admin/editorial/faqs/${result.data.id}`);
        }
        router.refresh();
        return;
      }
      // strictNullChecks is off in this project, so `ok` does not narrow the union.
      const failure = result as EditorialActionFailure;
      for (const [field, message] of Object.entries(failure.fieldErrors ?? {})) {
        form.setError(field as FieldPath<FaqFormInput>, { message });
      }
      toast.error(failure.message);
    });
  };

  const errorOf = (name: "question" | "answer") => form.formState.errors[name]?.message as string | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{faq ? t("editFaq") : t("newFaq")}</CardTitle>
        <CardDescription>{t("faqHelp")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="faq-form">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("showOn")}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("entityId", null);
                        form.setValue("entityKey", null);
                      }}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger aria-label={t("showOn")}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FAQ_SCOPES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(`scopes.${value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {keyOptions.length ? (
                <FormField
                  control={form.control}
                  name="entityKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{scope === "app" ? t("section") : t("page")}</FormLabel>
                      <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={isPending}>
                        <FormControl>
                          <SelectTrigger aria-label={scope === "app" ? t("section") : t("page")}>
                            <SelectValue placeholder={t("choose")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {keyOptions.map((value) => (
                            <SelectItem key={value} value={value}>
                              {scope === "app" ? t(`apps.${value}`) : t(`pages.${value}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : resource ? (
                <div>
                  <RHFLazySearchableSelectField
                    key={scope}
                    control={form.control}
                    name="entityId"
                    label={t("specificItem")}
                    resource={resource}
                    locale={catalogDataLocale(locale)}
                    placeholder={t("allItems")}
                    helperText={t("specificItemHelp")}
                    disabled={isPending}
                  />
                  {faq?.entityLabel ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("currentItem")}: {faq.entityLabel}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <LocalizedInput label={t("question")} value={field.value} onChange={field.onChange} maxLength={200} error={errorOf("question")} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <LocalizedInput label={t("answer")} value={field.value} onChange={field.onChange} richText error={errorOf("answer")} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("displayOrder")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={1000}
                        value={Number(field.value ?? 0)}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex min-h-[72px] items-center justify-between gap-3 rounded-xl border px-4">
                    <FormLabel>{t("active")}</FormLabel>
                    <FormControl>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                        aria-label={t("active")}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? t("saving") : t("save")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => router.push(`/admin/editorial?tab=faqs&scope=${scope}`)}
              >
                {t("back")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
