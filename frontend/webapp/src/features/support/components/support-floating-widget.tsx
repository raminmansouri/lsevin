"use client";

import { Headphones, Loader2, MessageCircle, Minus, SendHorizonal, X } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createGuestConversationAction,
  getCustomerConversationDetailAction,
  getFloatingWidgetBootstrapDataAction,
  getOrCreateConversationAction,
  markConversationReadForCustomerAction,
  sendCustomerMessageAction,
} from "../server/actions";
import type { SupportBootstrapData, SupportConversationDetail } from "../types";
import { SupportThread } from "./support-thread";
import { getSupportLabels, isRtlLocale } from "./support-ui-utils";

type Props = {
  bootstrap: SupportBootstrapData;
  disabledOnCurrentRoute?: boolean;
};

export function SupportFloatingWidget({ bootstrap, disabledOnCurrentRoute }: Props) {
  const locale = useLocale();
  const t = useTranslations("SupportPages.customer");
  const { data: session } = useSession();
  const user = session?.user;
  const [data, setData] = useState(bootstrap);
  const [conversation, setConversation] = useState<SupportConversationDetail | null>(bootstrap.activeConversation || null);
  const [isOpen, setIsOpen] = useState(false);
  const [body, setBody] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const labels = useMemo(() => getSupportLabels(data.settings, locale), [data.settings, locale]);
  const isRtl = isRtlLocale(locale);
  const online = data.onlineAgents.length > 0;

  useEffect(() => {
    const stored = window.localStorage.getItem("lsevin-support-widget-open");
    if (stored === "true") setIsOpen(true);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("lsevin-support-widget-open", String(isOpen));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = window.setInterval(async () => {
      if (conversation?.id) {
        const result = await getCustomerConversationDetailAction(conversation.id);
        if (result.data) setConversation(result.data);
      } else if (user?.id) {
        const result = await getFloatingWidgetBootstrapDataAction({ customerUserId: user.id, locale });
        if (result.data) {
          setData(result.data);
          setConversation(result.data.activeConversation || null);
        }
      }
    }, 8000);
    return () => window.clearInterval(interval);
  }, [conversation?.id, isOpen, locale, user?.id]);

  useEffect(() => {
    if (!conversation?.id || !isOpen || conversation.unreadForCustomerCount <= 0) return;
    markConversationReadForCustomerAction(conversation.id).catch(() => undefined);
  }, [conversation?.id, conversation?.unreadForCustomerCount, isOpen]);

  if (disabledOnCurrentRoute || !data.settings.floatingChatEnabled) return null;

  const position = data.settings.launcherPosition === "bottom-left" ? "left-4" : "right-4";
  const unread = conversation?.unreadForCustomerCount || 0;

  const startConversation = () => {
    startTransition(async () => {
      if (user?.id) {
        const result = await getOrCreateConversationAction({
          customerUserId: user.id,
          displayName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          locale,
          source: "floating_widget",
          sourceUrl: typeof window !== "undefined" ? window.location.href : "",
        });
        if (result.data) setConversation(result.data);
        if (result.error) toast.error(result.error.detail || result.error.title);
        return;
      }

      const result = await createGuestConversationAction({
        guestName,
        guestEmail,
        guestPhoneCountryCode: "",
        guestPhone: "",
        body: firstMessage,
        locale,
        source: "floating_widget",
        sourceUrl: typeof window !== "undefined" ? window.location.href : "",
      });
      if (result.data) {
        setConversation(result.data);
        setFirstMessage("");
      }
      if (result.fieldErrors) toast.error(Object.values(result.fieldErrors)[0]?.[0] || t("pleaseCheckForm"));
      if (result.error) toast.error(result.error.detail || result.error.title);
    });
  };

  const sendMessage = () => {
    if (!body.trim() || !conversation?.id) return;
    const text = body.trim();
    setBody("");
    startTransition(async () => {
      const result = await sendCustomerMessageAction({ conversationId: conversation.id, senderUserId: user?.id, body: text, attachments: [] });
      if (result.data) {
        const refreshed = await getCustomerConversationDetailAction(conversation.id);
        if (refreshed.data) setConversation(refreshed.data);
      }
      if (result.error) toast.error(result.error.detail || result.error.title);
    });
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className={`hidden lg:block fixed bottom-45 z-50 ${position}`}>
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-2rem)] max-w-[390px] overflow-hidden rounded-[28px] border bg-white shadow-2xl">
          <div className="p-4 text-white" style={{ background: `linear-gradient(135deg, ${data.settings.primaryColor}, ${data.settings.accentColor})` }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold leading-tight">{labels.headerTitle}</p>
                  <p className="text-xs text-white/80">{online ? labels.onlineLabel : labels.offlineLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-2 text-white/80 hover:bg-white/15 hover:text-white">
                  <Minus className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-2 text-white/80 hover:bg-white/15 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/85">{labels.welcomeMessage}</p>
          </div>

          <div className="max-h-[460px] overflow-y-auto bg-slate-50 p-4">
            {!conversation ? (
              <div className="space-y-3">
                {user?.id ? (
                  <Button disabled={isPending} onClick={startConversation} className="h-11 w-full rounded-2xl">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {labels.startConversationLabel}
                  </Button>
                ) : data.settings.allowGuestConversation ? (
                  <>
                    <Input value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder={t("namePlaceholder")} className="rounded-2xl bg-white" />
                    <Input value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} placeholder={t("emailPlaceholder")} className="rounded-2xl bg-white" />
                    <Textarea value={firstMessage} onChange={(event) => setFirstMessage(event.target.value)} placeholder={labels.inputPlaceholder} className="min-h-[92px] rounded-2xl bg-white" />
                    <Button disabled={isPending} onClick={startConversation} className="h-11 w-full rounded-2xl">
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {labels.startConversationLabel}
                    </Button>
                  </>
                ) : (
                  <div className="rounded-2xl border bg-white p-4 text-sm text-muted-foreground">{t("loginRequired")}</div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border bg-white p-3">
                  <div>
                    <p className="text-xs font-semibold">{conversation.conversationNumber}</p>
                    <p className="text-[11px] text-muted-foreground">{conversation.status}</p>
                  </div>
                  <Link href="/n/app/mobile/support" className="text-xs font-semibold underline-offset-4 hover:underline">{t("openFullPage")}</Link>
                </div>
                <SupportThread messages={conversation.messages.slice(-8)} />
              </div>
            )}
          </div>

          {conversation && (
            <div className="border-t bg-white p-3">
              <div className="flex items-end gap-2 rounded-2xl border bg-slate-50 p-2">
                <Textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder={labels.inputPlaceholder}
                  className="min-h-[44px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                <Button size="icon" type="button" disabled={!body.trim() || isPending} onClick={sendMessage} className="h-10 w-10 shrink-0 rounded-xl">
                  <SendHorizonal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="group flex items-center rounded-full px-4 py-3 text-sm font-semibold text-white shadow-2xl transition-transform hover:scale-[1.02] active:scale-95"
        style={{ backgroundColor: data.settings.primaryColor, color: data.settings.textColor, borderRadius: data.settings.borderRadius }}
      >
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
          <MessageCircle className="h-5 w-5" />
          {unread > 0 && <Badge className="absolute -right-2 -top-2 h-5 min-w-5 rounded-full bg-red-600 px-1 text-[10px] text-white">{unread}</Badge>}
        </span>
        {!data.settings.compactMode && <span>
          {/* {labels.launcherLabel} */}
          </span>}
      </button>
    </div>
  );
}
