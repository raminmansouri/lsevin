"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod/v4";
import { ArrowLeft, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import useAction from "@/hooks/use-action";
import { Link, useRouter } from "@/i18n/navigation";
import { saveNotificationChannelAction } from "@/features/notification/admin/actions";
import { SaveNotificationChannelSchema } from "@/features/notification/admin/actions/save-notification-channel/schema";
import type { InputType } from "@/features/notification/admin/actions/save-notification-channel/types";
import type { NotificationChannelConfig } from "@/features/notification/server/channel.repository";

export function NotificationChannelForm({ channel }: { channel: NotificationChannelConfig }) {
  const t = useTranslations("AdminPages.notificationChannels.form");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.input<typeof SaveNotificationChannelSchema>, unknown, InputType>({
    resolver: zodResolver(SaveNotificationChannelSchema),
    defaultValues: {
      code: channel.code,
      isEnabled: channel.isEnabled,
      settings: {
        smtpHost: channel.settings.smtpHost || "",
        smtpPort: channel.settings.smtpPort ?? 587,
        smtpUser: channel.settings.smtpUser || "",
        smtpPassword: "",
        smtpSecure: channel.settings.smtpSecure ?? false,
        fromAddress: channel.settings.fromAddress || "",
        fromName: channel.settings.fromName || "",
        smsUsername: channel.settings.smsUsername || "",
        smsPassword: "",
        smsBaseUrl: channel.settings.smsBaseUrl || "",
        vapidPublicKey: channel.settings.vapidPublicKey || "",
        vapidPrivateKey: "",
        vapidSubject: channel.settings.vapidSubject || "",
        whatsappApiKey: "",
        whatsappBaseUrl: channel.settings.whatsappBaseUrl || "",
        baleBotToken: "",
        baleBotUsername: channel.settings.baleBotUsername || "",
      },
    },
  });

  const { execute } = useAction(saveNotificationChannelAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("toastSaved"));
      router.refresh();
    },
    onError: (error) => {
      toast.error(error?.detail || error?.title || t("toastError"));
    },
  });

  const onSubmit = (values: InputType) => {
    execute(values);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-2 px-0">
            <Link href="/admin/notification-channels">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back")}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{t("settingsTitle", { name: t(`names.${channel.code}` as never) })}</h1>
          <p className="text-sm text-muted-foreground">{t(`descriptions.${channel.code}` as never)}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("statusTitle")}</CardTitle>
              <CardDescription>{t("statusDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="isEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-2xl border p-4">
                    <div>
                      <FormLabel>{t("enabledLabel")}</FormLabel>
                      <FormDescription>{t("enabledDescription")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {channel.code === "email" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("emailCredentialsTitle")}</CardTitle>
                <CardDescription>{t("emailCredentialsDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <FormField control={form.control} name="settings.smtpHost" render={({ field }) => (
                  <FormItem><FormLabel>{t("smtpHostLabel")}</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" placeholder="smtp.example.com" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="settings.smtpPort" render={({ field }) => (
                  <FormItem><FormLabel>{t("smtpPortLabel")}</FormLabel><FormControl><Input {...field} value={String(field.value ?? "")} type="number" dir="ltr" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="settings.smtpUser" render={({ field }) => (
                  <FormItem><FormLabel>{t("smtpUserLabel")}</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="settings.smtpPassword" render={({ field }) => (
                  <FormItem><FormLabel>{t("smtpPasswordLabel")}</FormLabel><FormControl><Input {...field} value={field.value || ""} type="password" autoComplete="new-password" dir="ltr" placeholder={channel.settings.smtpPassword ? `${t("current")}: ${channel.settings.smtpPassword}` : ""} disabled={isPending} /></FormControl><FormDescription>{t("keepBlankHint")}</FormDescription><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="settings.fromAddress" render={({ field }) => (
                  <FormItem><FormLabel>{t("fromAddressLabel")}</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" placeholder="no-reply@lsevin.com" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="settings.fromName" render={({ field }) => (
                  <FormItem><FormLabel>{t("fromNameLabel")}</FormLabel><FormControl><Input {...field} value={field.value || ""} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="settings.smtpSecure" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-2xl border p-4 md:col-span-2">
                    <div><FormLabel>{t("smtpSecureLabel")}</FormLabel><FormDescription>{t("smtpSecureDescription")}</FormDescription></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl>
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          )}

          {channel.code === "sms" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("smsCredentialsTitle")}</CardTitle>
                <CardDescription>{t("smsCredentialsDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <FormField control={form.control} name="settings.smsUsername" render={({ field }) => (
                  <FormItem><FormLabel>{t("smsUsernameLabel")}</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" placeholder={t("smsEnvFallbackPlaceholder")} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="settings.smsPassword" render={({ field }) => (
                  <FormItem><FormLabel>{t("smsPasswordLabel")}</FormLabel><FormControl><Input {...field} value={field.value || ""} type="password" autoComplete="new-password" dir="ltr" placeholder={channel.settings.smsPassword ? `${t("current")}: ${channel.settings.smsPassword}` : t("smsEnvFallbackPlaceholder")} disabled={isPending} /></FormControl><FormDescription>{t("keepBlankHint")}</FormDescription><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="settings.smsBaseUrl" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>{t("smsBaseUrlLabel")}</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" placeholder="https://rest.payamak-panel.com/api/" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>
          )}

          {channel.code === "push" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("pushCredentialsTitle")}</CardTitle>
                <CardDescription>{t("pushCredentialsDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <FormField control={form.control} name="settings.vapidPublicKey" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>{t("vapidPublicKeyLabel")}</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="settings.vapidPrivateKey" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>{t("vapidPrivateKeyLabel")}</FormLabel><FormControl><Input {...field} value={field.value || ""} type="password" autoComplete="new-password" dir="ltr" placeholder={channel.settings.vapidPrivateKey ? `${t("current")}: ${channel.settings.vapidPrivateKey}` : ""} disabled={isPending} /></FormControl><FormDescription>{t("keepBlankHint")}</FormDescription><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="settings.vapidSubject" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>{t("vapidSubjectLabel")}</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" placeholder="mailto:admin@lsevin.com" disabled={isPending} /></FormControl><FormDescription>{t("vapidSubjectDescription")}</FormDescription><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>
          )}

          {channel.code === "whatsapp" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("whatsappCredentialsTitle")}</CardTitle>
                <CardDescription>{t("whatsappCredentialsDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <FormField control={form.control} name="settings.whatsappApiKey" render={({ field }) => (
                  <FormItem><FormLabel>{t("whatsappApiKeyLabel")}</FormLabel><FormControl><Input {...field} value={field.value || ""} type="password" autoComplete="new-password" dir="ltr" placeholder={channel.settings.whatsappApiKey ? `${t("current")}: ${channel.settings.whatsappApiKey}` : t("whatsappEnvFallbackPlaceholder")} disabled={isPending} /></FormControl><FormDescription>{t("keepBlankHint")}</FormDescription><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="settings.whatsappBaseUrl" render={({ field }) => (
                  <FormItem><FormLabel>{t("whatsappBaseUrlLabel")}</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" placeholder="https://api.whatsiplus.com/" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>
          )}

          {channel.code === "bale" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("baleCredentialsTitle")}</CardTitle>
                <CardDescription>{t("baleCredentialsDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <FormField control={form.control} name="settings.baleBotToken" render={({ field }) => (
                  <FormItem><FormLabel>{t("baleBotTokenLabel")}</FormLabel><FormControl><Input {...field} value={field.value || ""} type="password" autoComplete="new-password" dir="ltr" placeholder={channel.settings.baleBotToken ? `${t("current")}: ${channel.settings.baleBotToken}` : ""} disabled={isPending} /></FormControl><FormDescription>{t("keepBlankHint")}</FormDescription><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="settings.baleBotUsername" render={({ field }) => (
                  <FormItem><FormLabel>{t("baleBotUsernameLabel")}</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" placeholder="lsevin_bot" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button asChild type="button" variant="outline">
              <Link href="/admin/notification-channels">{t("cancel")}</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
