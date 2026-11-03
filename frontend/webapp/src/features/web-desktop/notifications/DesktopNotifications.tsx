"use client";

import { Bell, BellRing, Calendar, CheckCheck, MessageCircle, Shield, Tag } from "lucide-react";
import { useTranslations } from "next-intl";

import type { NotificationItem, NotificationTab, NotificationsPageData } from "@/app/[locale]/n/app/mobile/notifications/notifications.data";

import { Reveal } from "../components/motion";

const TYPE_STYLE: Record<string, { Icon: typeof Bell; className: string }> = {
  booking: { Icon: Calendar, className: "bg-[#e7f4ee] text-[#0f5a45]" },
  offer: { Icon: Tag, className: "bg-[#fbf3de] text-[#8c6b2c]" },
  system: { Icon: MessageCircle, className: "bg-[#eef3f1] text-[#083f30]" },
  security: { Icon: Shield, className: "bg-[#fdf1ef] text-[#b2453a]" },
};
const DEFAULT_STYLE = { Icon: BellRing, className: "bg-[#f6f1e6] text-[#8a8170]" };

/** Desktop notifications (>= 1280px). Tabs, read state and actions come from NotificationsClient. */
export function DesktopNotifications({
  tabs,
  activeTab,
  onTab,
  items,
  unread,
  onMarkAll,
  onOpen,
  pending,
}: {
  tabs: NotificationsPageData["tabs"];
  activeTab: NotificationTab;
  onTab: (tab: NotificationTab) => void;
  items: NotificationItem[];
  unread: number;
  onMarkAll: () => void;
  onOpen: (item: NotificationItem) => void;
  pending: boolean;
}) {
  const t = useTranslations("MobileNotifications");

  return (
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      {/* Header */}
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg flex items-end justify-between gap-10 overflow-hidden rounded-[36px] px-12 py-12 text-white">
          <Reveal className="space-y-3">
            <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">INBOX</span>
            <h1 className="lsd-gold-text text-[40px] font-black leading-tight">{t("title")}</h1>
            {unread > 0 ? <p className="text-base text-white/70">{t("unreadCount", { count: unread })}</p> : null}
          </Reveal>
          {unread > 0 ? (
            <button type="button" onClick={onMarkAll} className="lsd-btn lsd-btn-gold h-12 px-6 text-sm">
              <CheckCheck size={17} />
              {t("markAllRead")}
            </button>
          ) : null}
        </div>
      </section>

      <div className="lsd-container mt-10 grid grid-cols-[260px_1fr] items-start gap-8">
        {/* Tabs */}
        <nav className="sticky top-28 flex flex-col gap-1.5 rounded-[24px] bg-white p-3 ring-1 ring-[#e7dcc4]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTab(tab.id)}
              className={`flex items-center justify-between gap-3 rounded-full px-5 py-2.5 text-start text-sm font-bold transition ${
                activeTab === tab.id ? "bg-[#083f30] text-[#eacb7f]" : "text-[#3d4b45] hover:bg-[#f6f1e6]"
              }`}
            >
              {t(`tabs.${tab.id}` as never)}
              {tab.unreadCount > 0 ? (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${activeTab === tab.id ? "bg-[#eacb7f] text-[#062a20]" : "bg-[#fbf3de] text-[#8c6b2c]"}`}>
                  {tab.unreadCount}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {/* List */}
        <div className={`overflow-hidden rounded-[28px] bg-white ring-1 ring-[#e7dcc4] transition-opacity ${pending ? "opacity-60" : ""}`}>
          {items.length ? (
            <ul className="divide-y divide-[#f1ead9]">
              {items.map((notification) => {
                const { Icon, className } = TYPE_STYLE[notification.type] ?? DEFAULT_STYLE;
                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(notification)}
                      className={`relative flex w-full items-start gap-5 px-8 py-5 text-start transition hover:bg-[#fbf8f1] ${
                        notification.read ? "" : "bg-[#fdfaf2]"
                      }`}
                    >
                      {!notification.read ? <span className="absolute inset-y-4 start-0 w-1 rounded-e-full bg-[#c9a55a]" aria-hidden="true" /> : null}
                      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${className}`}>
                        <Icon size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={`truncate text-[15px] text-[#0e1a16] ${notification.read ? "font-bold" : "font-black"}`}>{notification.title}</span>
                          {!notification.read ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#0f5a45]" /> : null}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-[#56675f]">{notification.message}</span>
                      </span>
                      <span className="shrink-0 pt-1 text-xs text-[#8a8170]">{notification.timeLabel}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-8 py-20 text-center">
              <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-[#f6f1e6] text-[#c9a55a]">
                <Bell size={26} />
              </span>
              <h3 className="text-lg font-black text-[#0e1a16]">{t("emptyTitle")}</h3>
              <p className="mt-2 text-sm text-[#6b6150]">{t("emptyDescription")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}