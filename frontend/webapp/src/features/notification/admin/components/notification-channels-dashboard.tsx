"use client";

import { useState, useTransition } from "react";
import { Bell, Edit, MessageCircle, Power, Send, Smartphone, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import useAction from "@/hooks/use-action";
import { Link } from "@/i18n/navigation";
import { toggleNotificationChannelAction } from "@/features/notification/admin/actions";
import type { NotificationChannelConfig, NotificationChannelCode } from "@/features/notification/server/channel.repository";

const ICONS: Record<NotificationChannelCode, typeof Bell> = {
  in_app: Bell,
  email: Mail,
  sms: Smartphone,
  push: Send,
  whatsapp: MessageCircle,
  bale: MessageCircle,
};

export function NotificationChannelsDashboard({ channels }: { channels: NotificationChannelConfig[] }) {
  const t = useTranslations("AdminPages.notificationChannels.dashboard");
  const [items, setItems] = useState(channels);
  const [isPending, startTransition] = useTransition();

  const { execute } = useAction(toggleNotificationChannelAction, {
    startTransition,
    onSuccess: (channel) => {
      if (!channel) return;
      setItems((current) => current.map((item) => (item.code === channel.code ? channel : item)));
      toast.success(t(channel.isEnabled ? "toastEnabled" : "toastDisabled", { name: t(`names.${channel.code}` as never) }));
    },
    onError: (error) => {
      toast.error(error?.detail || error?.title || t("toastError"));
    },
  });

  const enabledCount = items.filter((item) => item.isEnabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Badge variant="secondary" className="w-fit px-3 py-1 text-sm">
          {t("enabledBadge", { count: enabledCount })}
        </Badge>
      </div>

      <div className="grid gap-4">
        {items.map((channel) => {
          const Icon = ICONS[channel.code] ?? Bell;

          return (
            <Card key={channel.code} className="overflow-hidden">
              <CardHeader className="flex flex-col gap-4 border-b md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{t(`names.${channel.code}` as never)}</CardTitle>
                      <Badge variant={channel.isEnabled ? "default" : "secondary"}>
                        {channel.isEnabled ? t("enabledStatus") : t("disabledStatus")}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={channel.isEnabled ? "outline" : "default"}
                    disabled={isPending}
                    onClick={() => execute({ code: channel.code, isEnabled: !channel.isEnabled })}
                  >
                    <Power className="mr-2 h-4 w-4" />
                    {channel.isEnabled ? t("disable") : t("enable")}
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/admin/notification-channels/${channel.code}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      {t("settings")}
                    </Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
