"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RHFSingleMediaPickerField } from "@/features/media-picker-addon";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import { Link, useRouter } from "@/i18n/navigation";

import { saveSitePageAction, type EditorialActionFailure } from "../../actions";
import type { SitePageFormInput } from "../../actions/schema";
import type { SitePageAdminRow } from "../../types";

export function SitePageForm({ page }: { page: SitePageAdminRow }) {
  const t = useTranslations("AdminEditorial");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SitePageFormInput>({
    defaultValues: {
      slug: page.slug,
      title: { translations: page.title as Record<string, string> },
      summary: { translations: page.summary as Record<string, string> },
      body: { translations: page.body as Record<string, string> },
      heroMedia: page.heroMedia ?? "",
      isPublished: page.isPublished,
      showInFooter: page.showInFooter,
      displayOrder: page.displayOrder,
    },
  });

  const onSubmit = (values: SitePageFormInput) => {
    form.clearErrors();
    startTransition(async () => {
      const result = await saveSitePageAction(values);
      if (result.ok) {
        toast.success(t("saved"));
        router.refresh();
        return;
      }
      // strictNullChecks is off in this project, so `ok` does not narrow the union.
      const failure = result as EditorialActionFailure;
      for (const [field, message] of Object.entries(failure.fieldErrors ?? {})) {
        form.setError(field as FieldPath<SitePageFormInput>, { message });
      }
      toast.error(failure.message);
    });
  };

  const errorOf = (name: "title" | "summary" | "body") => form.formState.errors[name]?.message as string | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editPage")}</CardTitle>
        <CardDescription>
          {t("pageUrl")}: <span className="font-mono">/{"{locale}"}/{page.slug}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="site-page-form">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex min-h-[72px] items-center justify-between gap-3 rounded-xl border px-4">
                    <div>
                      <FormLabel>{t("published")}</FormLabel>
                      <p className="text-xs text-muted-foreground">{t("publishedHelp")}</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                        aria-label={t("published")}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="showInFooter"
                render={({ field }) => (
                  <FormItem className="flex min-h-[72px] items-center justify-between gap-3 rounded-xl border px-4">
                    <div>
                      <FormLabel>{t("showInFooter")}</FormLabel>
                      <p className="text-xs text-muted-foreground">{t("showInFooterHelp")}</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                        aria-label={t("showInFooter")}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
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
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <LocalizedInput label={t("title")} value={field.value} onChange={field.onChange} maxLength={120} error={errorOf("title")} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <LocalizedInput
                    label={t("summary")}
                    value={field.value}
                    onChange={field.onChange}
                    multiline
                    rows={2}
                    maxLength={300}
                    description={t("summaryHelp")}
                    error={errorOf("summary")}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <LocalizedInput
                    label={t("body")}
                    value={field.value}
                    onChange={field.onChange}
                    richText
                    description={t("bodyHelp")}
                    error={errorOf("body")}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <RHFSingleMediaPickerField
              control={form.control}
              name="heroMedia"
              label={t("heroImage")}
              placeholder={t("pickImage")}
              mediaType="image"
              helperText={t("heroImageHelp")}
              disabled={isPending}
            />

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? t("saving") : t("save")}
              </Button>
              <Button type="button" variant="outline" disabled={isPending} onClick={() => router.push("/admin/editorial")}>
                {t("back")}
              </Button>
              {page.isPublished ? (
                <Button asChild variant="ghost">
                  <Link href={`/${page.slug}`} target="_blank">
                    {t("viewPage")}
                  </Link>
                </Button>
              ) : null}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
