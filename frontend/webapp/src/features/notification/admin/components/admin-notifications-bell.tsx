"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  notificationType: string;
  createdAt: string;
  readAt: string | null;
};

const POLL_INTERVAL_MS = 30_000;

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AdminNotificationsBell() {
  const t = useTranslations("AdminPages.notificationBell");
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshCount = () => {
    fetch("/api/admin/notifications/count", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setCount(Number(data?.count ?? 0)))
      .catch(() => {});
  };

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/admin/notifications/list", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setItems(data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

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
    refreshCount();
  }

  const badge = count > 99 ? "99+" : count > 0 ? String(count) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="relative" aria-label={t("title")}>
          <Bell className="h-5 w-5" />
          {badge ? (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]" variant="destructive">
              {badge}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-semibold">{t("title")}</span>
          {items.some((item) => !item.readAt) ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => markRead()}>
              {t("markAllRead")}
            </Button>
          ) : null}
        </div>
        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">{t("loading")}</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">{t("empty")}</div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => !item.readAt && markRead(item.id)}
                  className={`w-full px-3 py-3 text-left text-sm transition hover:bg-muted/50 ${!item.readAt ? "bg-muted/30" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{item.title}</span>
                    {!item.readAt ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                  <span className="mt-1 block text-[11px] text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
