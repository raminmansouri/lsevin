"use client";

import { useState, useTransition } from "react";
import { Bell, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useAction from "@/hooks/use-action";
import { createBaleLinkCodeAction } from "@/features/notification/admin/actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(Array.from(rawData).map((char) => char.charCodeAt(0)));
}

export function MyNotificationPreferences({
  pushEnabled,
  vapidPublicKey,
  baleEnabled,
  baleBotUsername,
}: {
  pushEnabled: boolean;
  vapidPublicKey: string | null;
  baleEnabled: boolean;
  baleBotUsername: string | null;
}) {
  const t = useTranslations("AdminPages.notificationChannels.preferences");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [baleLink, setBaleLink] = useState<string | null>(null);

  const { execute: createLinkCode } = useAction(createBaleLinkCodeAction, {
    startTransition,
    onSuccess: (data) => {
      if (!data || !baleBotUsername) return;
      setBaleLink(`https://ble.ir/${baleBotUsername}?start=${data.code}`);
    },
    onError: (error) => toast.error(error?.detail || error?.title || t("baleLinkError")),
  });

  async function subscribeToPush() {
    if (!vapidPublicKey) return;
    setPushBusy(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error(t("pushPermissionDenied"));
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      await fetch("/api/notifications/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      setPushSubscribed(true);
      toast.success(t("pushSubscribed"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("pushSubscribeFailed"));
    } finally {
      setPushBusy(false);
    }
  }

  if (!pushEnabled && !baleEnabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {pushEnabled && vapidPublicKey && (
          <Button type="button" variant="outline" disabled={pushBusy || pushSubscribed} onClick={subscribeToPush}>
            <Bell className="mr-2 h-4 w-4" />
            {pushSubscribed ? t("pushSubscribedLabel") : t("enablePush")}
          </Button>
        )}
        {baleEnabled && baleBotUsername && (
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" disabled={isPending} onClick={() => createLinkCode({})}>
              <MessageCircle className="mr-2 h-4 w-4" />
              {t("linkBale")}
            </Button>
            {baleLink && (
              <a href={baleLink} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline">
                {t("openBaleLink")}
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
