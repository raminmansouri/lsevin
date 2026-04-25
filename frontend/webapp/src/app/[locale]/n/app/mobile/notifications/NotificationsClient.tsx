"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Calendar,
  Tag,
  MessageCircle,
  Bell,
  Shield,
  BellRing,
} from "lucide-react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "./notifications.actions";
import type {
  NotificationTab,
  NotificationsFiltersInput,
  NotificationItem,
  NotificationsPageData,
} from "./notifications.data";

function buildQuery(next: NotificationsFiltersInput) {
  const params = new URLSearchParams();
  if (next.tab && next.tab !== "all") params.set("tab", next.tab);
  const query = params.toString();
  return query ? `/n/app/notifications?${query}` : "/n/app/notifications";
}

function navigateSmooth(
  startTransition: React.TransitionStartFunction,
  router: ReturnType<typeof useRouter>,
  href: string,
) {
  startTransition(() => {
    router.replace(href, { scroll: false });
  });
}

function iconForType(type: string) {
  switch (type) {
    case "booking":
      return { Icon: Calendar, iconBg: "bg-blue-50", iconColor: "text-blue-600" };
    case "offer":
      return { Icon: Tag, iconBg: "bg-amber-50", iconColor: "text-amber-600" };
    case "system":
      return { Icon: MessageCircle, iconBg: "bg-green-50", iconColor: "text-green-600" };
    case "security":
      return { Icon: Shield, iconBg: "bg-red-50", iconColor: "text-red-600" };
    default:
      return { Icon: BellRing, iconBg: "bg-gray-100", iconColor: "text-gray-600" };
  }
}

function PendingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 bg-white/55 backdrop-blur-[1px]">
      <div className="p-6 space-y-3 animate-pulse">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-200" />
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NotificationsClient({
  customerId,
  tabs,
  notifications,
  unreadCount,
  filters,
}: NotificationsPageData & { filters: NotificationsFiltersInput }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<NotificationTab>(filters.tab);
  const [items, setItems] = useState<NotificationItem[]>(notifications);
  const [optimisticUnread, setOptimisticUnread] = useState(unreadCount);

  useEffect(() => {
    setActiveTab(filters.tab);
    setItems(notifications);
    setOptimisticUnread(unreadCount);
  }, [filters.tab, notifications, unreadCount]);

  const visibleItems = useMemo(
    () => (activeTab === "all" ? items : items.filter((item) => item.type === activeTab)),
    [activeTab, items],
  );

  const applyTab = (tab: NotificationTab) => {
    setActiveTab(tab);
    navigateSmooth(startTransition, router, buildQuery({ ...filters, tab }));
  };

  const markOneRead = async (notificationId: string) => {
    const current = items.find((item) => item.id === notificationId);
    if (!current || current.read || !customerId) return;

    setItems((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
    );
    setOptimisticUnread((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationReadAction(notificationId);
    } catch {
      setItems((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, read: false } : item)),
      );
      setOptimisticUnread((prev) => prev + 1);
    }
  };

  const markAllRead = async () => {
    if (!customerId || optimisticUnread === 0) return;
    const previous = items;

    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    setOptimisticUnread(0);

    try {
      await markAllNotificationsReadAction();
    } catch {
      setItems(previous);
      setOptimisticUnread(previous.filter((item) => !item.read).length);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      {isPending && <PendingOverlay />}

      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/n/app/mobile/profile")}
              className="w-10 h-10 -ml-2 flex items-center justify-center text-gray-600"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
              {optimisticUnread > 0 && (
                <p className="text-sm text-gray-600">{optimisticUnread} unread</p>
              )}
            </div>
          </div>
          {optimisticUnread > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm font-medium text-[#083f30]"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="px-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => applyTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? "bg-[#083f30] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
                {tab.unreadCount > 0 ? ` (${tab.unreadCount})` : ""}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {visibleItems.length > 0 ? (
          <div className="space-y-3">
            {visibleItems.map((notification) => {
              const { Icon, iconBg, iconColor } = iconForType(notification.type);

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => markOneRead(notification.id)}
                  className={`w-full text-left bg-white rounded-xl border p-4 ${
                    notification.read
                      ? "border-gray-200"
                      : "border-[#083f30] bg-[#083f30]/5"
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon size={24} className={iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-gray-900">{notification.title}</h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-[#083f30] rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">{notification.timeLabel}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Bell size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Notifications</h3>
            <p className="text-gray-600">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
