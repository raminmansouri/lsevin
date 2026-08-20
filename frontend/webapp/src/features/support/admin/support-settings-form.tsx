"use client";


import { useTranslations } from "next-intl";
import { Eye, MessageCircle, Paintbrush, Save, Settings2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateSupportSettingsAction } from "../server/actions";
import type { SupportSettings } from "../types";
import { getSupportLabels } from "../components/support-ui-utils";

type Props = { settings: SupportSettings };

type LabelLocale = "en-US" | "fa-IR";

const labelKeys = [
  "launcherLabel",
  "headerTitle",
  "headerSubtitle",
  "welcomeTitle",
  "welcomeMessage",
  "inputPlaceholder",
  "startConversationLabel",
  "offlineLabel",
  "onlineLabel",
  "sendButton",
  "attachmentLabel",
] as const;

export function SupportSettingsForm({ settings }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const [form, setForm] = useState(settings);
  const [activeLocale, setActiveLocale] = useState<LabelLocale>("en-US");
  const [officeHoursText, setOfficeHoursText] = useState(JSON.stringify(settings.officeHours || {}, null, 2));
  const [offlineText, setOfflineText] = useState(JSON.stringify(settings.offlineSettings || {}, null, 2));
  const [autoReplyText, setAutoReplyText] = useState(JSON.stringify(settings.autoReplySettings || {}, null, 2));
  const [isPending, startTransition] = useTransition();
  const previewLabels = useMemo(() => getSupportLabels(form, activeLocale), [form, activeLocale]);

  const setValue = <K extends keyof SupportSettings>(key: K, value: SupportSettings[K]) => setForm((current) => ({ ...current, [key]: value }));
  const setLabel = (locale: LabelLocale, key: (typeof labelKeys)[number], value: string) => {
    setForm((current) => ({
      ...current,
      labels: {
        ...current.labels,
        [locale]: {
          ...(current.labels[locale] || {}),
          [key]: value,
        },
      },
    }));
  };

  const parseJson = (value: string, label: string) => {
    try {
      const parsed = JSON.parse(value || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(tAdmin("mustBeJsonObject"));
      return parsed;
    } catch (error) {
      throw new Error(`${label}: ${error instanceof Error ? error.message : tAdmin("invalidJson")}`);
    }
  };

  const save = () => {
    startTransition(async () => {
      try {
        const payload = {
          ...form,
          officeHours: parseJson(officeHoursText, tAdmin("officeHours")),
          offlineSettings: parseJson(offlineText, tAdmin("offlineSettings")),
          autoReplySettings: parseJson(autoReplyText, tAdmin("autoReplySettings")),
        };
        const result = await updateSupportSettingsAction(payload);
        if (result.data) {
          setForm(result.data);
          toast.success(tAdmin("supportSettingsSaved"));
        }
        if (result.fieldErrors) toast.error(Object.values(result.fieldErrors)[0]?.[0] || tAdmin("pleaseCheckSettings"));
        if (result.error) toast.error(result.error.detail || result.error.title);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : tAdmin("invalidSettingsJson"));
      }
    });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" />{tAdmin("behavior")}</CardTitle>
            <CardDescription>{tAdmin("controlWhereSupportAppearsAndWhoCanStartAConversation")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {[
              ["supportPageEnabled", "supportPageEnabled"],
              ["requireLogin", "requireLogin"],
              ["allowGuestConversation", "allowGuestConversation"],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between rounded-2xl border bg-slate-50 p-4">
                <Label>{tAdmin(label)}</Label>
                <Switch checked={Boolean(form[key as keyof SupportSettings])} onCheckedChange={(checked) => setValue(key as keyof SupportSettings, checked as any)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Paintbrush className="h-5 w-5" />{tAdmin("skin")}</CardTitle>
            <CardDescription>{tAdmin("customizeLauncherColorRadiusIconAndPosition")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>{tAdmin("primaryColor")}</Label><Input value={form.primaryColor} onChange={(event) => setValue("primaryColor", event.target.value)} /></div>
            <div className="space-y-2"><Label>{tAdmin("accentColor")}</Label><Input value={form.accentColor} onChange={(event) => setValue("accentColor", event.target.value)} /></div>
            <div className="space-y-2"><Label>{tAdmin("borderRadius")}</Label><Input value={form.borderRadius} onChange={(event) => setValue("borderRadius", event.target.value)} /></div>
            <div className="space-y-2"><Label>{tAdmin("themeMode")}</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.themeMode} onChange={(event) => setValue("themeMode", event.target.value as any)}><option value="system">{tAdmin("system")}</option><option value="light">{tAdmin("light")}</option><option value="dark">{tAdmin("dark")}</option></select></div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{tAdmin("labels")}</CardTitle>
            <CardDescription>{tAdmin("englishAndPersianLabelsAreStoredAsJSONBObjectsNotStringifiedJSON")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant={activeLocale === "en-US" ? "default" : "outline"} onClick={() => setActiveLocale("en-US")} className="rounded-2xl">{tAdmin("english")}</Button>
              <Button type="button" variant={activeLocale === "fa-IR" ? "default" : "outline"} onClick={() => setActiveLocale("fa-IR")} className="rounded-2xl">{tAdmin("persian")}</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {labelKeys.map((key) => (
                <div key={key} className="space-y-2">
                  <Label>{tAdmin(`supportLabelKeys.${key}`)}</Label>
                  {key.toLowerCase().includes("message") || key.toLowerCase().includes("subtitle") ? (
                    <Textarea value={form.labels[activeLocale]?.[key] || ""} onChange={(event) => setLabel(activeLocale, key, event.target.value)} className="min-h-[88px]" />
                  ) : (
                    <Input value={form.labels[activeLocale]?.[key] || ""} onChange={(event) => setLabel(activeLocale, key, event.target.value)} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{tAdmin("advancedJSONSettings")}</CardTitle>
            <CardDescription>{tAdmin("keepTheseAsValidJSONObjects")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2"><Label>{tAdmin("officeHours")}</Label><Textarea value={officeHoursText} onChange={(event) => setOfficeHoursText(event.target.value)} className="min-h-[180px] font-mono text-xs" /></div>
            <div className="space-y-2"><Label>{tAdmin("offlineSettings")}</Label><Textarea value={offlineText} onChange={(event) => setOfflineText(event.target.value)} className="min-h-[180px] font-mono text-xs" /></div>
            <div className="space-y-2"><Label>{tAdmin("autoReplySettings")}</Label><Textarea value={autoReplyText} onChange={(event) => setAutoReplyText(event.target.value)} className="min-h-[180px] font-mono text-xs" /></div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-5">
        <Card className="sticky top-4 rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />{tAdmin("livePreview")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-[28px] border bg-white shadow-xl">
              <div className="p-5 text-white" style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.accentColor})` }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20"><MessageCircle className="h-5 w-5" /></div>
                  <div><p className="font-bold">{previewLabels.headerTitle}</p><p className="text-xs text-white/80">{previewLabels.onlineLabel}</p></div>
                </div>
                <h3 className="mt-5 text-xl font-bold">{previewLabels.welcomeTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-white/85">{previewLabels.welcomeMessage}</p>
              </div>
              <div className="bg-slate-50 p-4">
                <div className="rounded-2xl border bg-white p-3 text-sm text-muted-foreground">{previewLabels.inputPlaceholder}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="button" disabled={isPending} onClick={save} className="h-12 w-full rounded-2xl">
          <Save className="mr-2 h-4 w-4" /> {tAdmin("saveSupportSettings")}
        </Button>
      </aside>
    </div>
  );
}
