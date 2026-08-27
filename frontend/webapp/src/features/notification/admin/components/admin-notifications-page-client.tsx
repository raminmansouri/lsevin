"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  notificationType: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  readAt: string | null;
};

/** Only 'booking' has a real admin detail page today (/admin/bookings/[id]/update). */
function adminLinkFor(item: NotificationItem): string | null {
  if (item.entityType === "booking" && item.entityId) return `/admin/bookings/${item.entityId}/update`;
  return null;
}

function formatDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminNotificationsPageClient() {
  const t = useTranslations("AdminPages.notificationsPage");
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/notifications/list?limit=200", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setItems(data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function markRead(notificationId?: string) {
    await fetch("/api/admin/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: notificationId ?? null }),
    }).catch(() => {});

    if (notificationId) {
      setItems((current) => current.map((item) => (item.id === notificationId ? { ...item, readAt: new Date().toISOString() } : item)));
    } else {
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    }
  }

  const hasUnread = items.some((item) => !item.readAt);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </div>
        {hasUnread ? (
          <Button type="button" variant="outline" size="sm" onClick={() => markRead()}>
            {t("markAllRead")}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("loading")}</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          items.map((item) => {
            const link = adminLinkFor(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!item.readAt) markRead(item.id);
                  if (link) router.push(link);
                }}
                className={`flex w-full flex-col items-start rounded-md border p-3 text-left text-sm transition hover:bg-muted/50 ${!item.readAt ? "border-primary/30 bg-primary/5" : ""}`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="font-medium">{item.title}</span>
                  {!item.readAt ? <span className="h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
                </div>
                <p className="mt-1 whitespace-pre-line text-muted-foreground">{item.body}</p>
                <div className="mt-1 flex w-full items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</span>
                  {link ? <span className="text-xs font-medium text-primary">{t("viewBooking")}</span> : null}
                </div>
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
