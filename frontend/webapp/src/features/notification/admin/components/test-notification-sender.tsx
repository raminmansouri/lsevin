"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { AsyncSearchableSingleSelect, type AsyncSelectResult } from "@/components/admin/forms/extensions/async-searchable-single-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import useAction from "@/hooks/use-action";
import { sendTestNotificationAction } from "@/features/notification/admin/actions";
import type { NotificationChannelCode } from "@/features/notification/server/channel.repository";

async function loadUserOptions({ search, page, pageSize }: { search: string; page: number; pageSize: number }): Promise<AsyncSelectResult> {
  const params = new URLSearchParams({ search, page: String(page), pageSize: String(pageSize) });
  const response = await fetch(`/api/admin/users/search?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) return { items: [], hasMore: false };
  return response.json();
}

const CHANNELS: NotificationChannelCode[] = ["in_app", "email", "sms", "whatsapp", "push", "bale"];

export function TestNotificationSender() {
  const t = useTranslations("AdminPages.notificationChannels.test");
  const [isPending, startTransition] = useTransition();
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [channel, setChannel] = useState<NotificationChannelCode>("in_app");
  const [title, setTitle] = useState("Test notification");
  const [body, setBody] = useState("This is a test notification from the LSevin admin panel.");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const { execute } = useAction(sendTestNotificationAction, {
    startTransition,
    onSuccess: (data) => {
      if (!data) return;
      if (data.status === "sent") {
        setResult({ ok: true, message: t("resultSent", { response: data.providerResponse || "" }) });
        toast.success(t("toastSent"));
      } else if (data.status === "cancelled") {
        setResult({ ok: false, message: data.errorMessage || t("resultCancelled") });
        toast.error(t("toastFailed"));
      } else {
        setResult({ ok: false, message: data.errorMessage || t("resultFailed") });
        toast.error(t("toastFailed"));
      }
    },
    onError: (error) => {
      setResult({ ok: false, message: error?.detail || error?.title || t("toastFailed") });
      toast.error(error?.detail || error?.title || t("toastFailed"));
    },
  });

  const canSend = Boolean(targetUserId) && title.trim().length > 0 && body.trim().length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AsyncSearchableSingleSelect
          label={t("userLabel")}
          value={targetUserId}
          onChange={(value) => setTargetUserId(value)}
          loadOptions={loadUserOptions}
          placeholder={t("userPlaceholder")}
          searchPlaceholder={t("userSearchPlaceholder")}
          emptyText={t("userEmpty")}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("channelLabel")}</label>
          <Select value={channel} onValueChange={(value) => setChannel(value as NotificationChannelCode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANNELS.map((code) => (
                <SelectItem key={code} value={code}>
                  {t(`channelNames.${code}` as never)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("titleLabel")}</label>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} disabled={isPending} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("bodyLabel")}</label>
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={3} disabled={isPending} />
        </div>

        <Button
          type="button"
          disabled={!canSend || isPending}
          onClick={() => targetUserId && execute({ targetUserId, channel, title, body })}
        >
          <Send className="mr-2 h-4 w-4" />
          {isPending ? t("sending") : t("send")}
        </Button>

        {result ? (
          <div className={`rounded-md border p-3 text-sm ${result.ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            {result.message}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
