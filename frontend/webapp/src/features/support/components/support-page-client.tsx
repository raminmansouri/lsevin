"use client";

import { ArrowLeft, Headphones, Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@/hooks/use-navigate";
import {
  createGuestConversationAction,
  getCustomerConversationDetailAction,
  getOrCreateConversationAction,
  markConversationReadForCustomerAction,
  sendCustomerMessageAction,
} from "../server/actions";
import type { SupportBootstrapData, SupportConversationDetail } from "../types";
import { SupportMessageComposer } from "./support-message-composer";
import { SupportThread } from "./support-thread";
import { getSupportLabels, isRtlLocale } from "./support-ui-utils";

type Props = {
  bootstrap: SupportBootstrapData;
  source?: "floating_widget" | "support_page" | "booking" | "provider_page" | "service_page";
  sourceUrl?: string;
};

export function SupportPageClient({ bootstrap, source = "support_page", sourceUrl }: Props) {
  const locale = useLocale();
  const t = useTranslations("SupportPages.customer");
  const navigate = useNavigate();
  const { data: session } = useSession();
  const user = session?.user;
  const labels = useMemo(() => getSupportLabels(bootstrap.settings, locale), [bootstrap.settings, locale]);
  const isRtl = isRtlLocale(locale);
  const [conversation, setConversation] = useState<SupportConversationDetail | null>(bootstrap.activeConversation || null);
  const [isPending, startTransition] = useTransition();
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhoneCountryCode, setGuestPhoneCountryCode] = useState("98");
  const [guestPhone, setGuestPhone] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const online = bootstrap.onlineAgents.length > 0;

  useEffect(() => {
    if (!conversation?.id) return;
    const interval = window.setInterval(async () => {
      const result = await getCustomerConversationDetailAction(conversation.id);
      if (result.data) setConversation(result.data);
    }, 7000);
    return () => window.clearInterval(interval);
  }, [conversation?.id]);

  useEffect(() => {
    if (!conversation?.id || conversation.unreadForCustomerCount <= 0) return;
    markConversationReadForCustomerAction(conversation.id).catch(() => undefined);
  }, [conversation?.id, conversation?.unreadForCustomerCount]);

  const startLoggedInConversation = () => {
    if (!user?.id) return;
    startTransition(async () => {
      const result = await getOrCreateConversationAction({
        customerUserId: user.id,
        displayName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
        locale,
        source,
        sourceUrl: sourceUrl || (typeof window !== "undefined" ? window.location.href : ""),
      });
      if (result.data) setConversation(result.data);
      if (result.error) toast.error(result.error.detail || result.error.title);
    });
  };

  const startGuestConversation = () => {
    startTransition(async () => {
      const result = await createGuestConversationAction({
        guestName,
        guestEmail,
        guestPhoneCountryCode,
        guestPhone,
        body: firstMessage,
        locale,
        source,
        sourceUrl: sourceUrl || (typeof window !== "undefined" ? window.location.href : ""),
      });
      if (result.data) {
        setConversation(result.data);
        setFirstMessage("");
      }
      if (result.fieldErrors) {
        const first = Object.values(result.fieldErrors)[0]?.[0];
        toast.error(first || t("pleaseCheckForm"));
      }
      if (result.error) toast.error(result.error.detail || result.error.title);
    });
  };

  const sendMessage = async (body: string) => {
    if (!conversation?.id) return;
    const result = await sendCustomerMessageAction({ conversationId: conversation.id, senderUserId: user?.id, body, attachments: [] });
    if (result.data) {
      const refreshed = await getCustomerConversationDetailAction(conversation.id);
      if (refreshed.data) setConversation(refreshed.data);
    }
    if (result.error) toast.error(result.error.detail || result.error.title);
  };

  if (!bootstrap.settings.supportPageEnabled) {
    return (
      <main className="min-h-screen bg-slate-50 p-5">
        <Card className="mx-auto max-w-xl rounded-3xl">
          <CardContent className="p-8 text-center">
            <Headphones className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h1 className="text-xl font-bold">{t("supportUnavailable")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("supportUnavailableDescription")}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-28">
      <div className="sticky top-0 z-10 border-b bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
          <button type="button" onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm">
            <ArrowLeft className={`h-5 w-5 ${isRtl ? "rotate-180" : ""}`} />
          </button>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg" style={{ backgroundColor: bootstrap.settings.primaryColor }}>
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold text-slate-950">{labels.headerTitle}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-slate-400"}`} />
              {online ? labels.onlineLabel : labels.offlineLabel} · {labels.headerSubtitle}
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl space-y-5 px-5 py-6">
        <div className="overflow-hidden rounded-[2rem] border bg-white shadow-sm">
          <div className="p-6 text-white" style={{ background: `linear-gradient(135deg, ${bootstrap.settings.primaryColor}, ${bootstrap.settings.accentColor})` }}>
            <Badge className="mb-4 border-white/30 bg-white/15 text-white hover:bg-white/15">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> {t("secureSupport")}
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight">{labels.welcomeTitle}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">{labels.welcomeMessage}</p>
          </div>

          {!conversation ? (
            <div className="space-y-5 p-5">
              {user?.id ? (
                <Button type="button" disabled={isPending} onClick={startLoggedInConversation} className="h-12 w-full rounded-2xl text-base">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {labels.startConversationLabel}
                </Button>
              ) : bootstrap.settings.allowGuestConversation ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("nameLabel")}</Label>
                      <Input value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder={t("namePlaceholder")} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("emailLabel")}</Label>
                      <Input value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} placeholder={t("emailPlaceholder")} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("countryCodeLabel")}</Label>
                      <Input value={guestPhoneCountryCode} onChange={(event) => setGuestPhoneCountryCode(event.target.value)} placeholder="98" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("phoneLabel")}</Label>
                      <Input value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} placeholder="9120000000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("messageLabel")}</Label>
                    <Textarea value={firstMessage} onChange={(event) => setFirstMessage(event.target.value)} placeholder={labels.inputPlaceholder} className="min-h-[120px]" />
                  </div>
                  <Button type="button" disabled={isPending} onClick={startGuestConversation} className="h-12 w-full rounded-2xl text-base">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {labels.startConversationLabel}
                  </Button>
                </div>
              ) : (
                <div className="rounded-3xl border bg-slate-50 p-5 text-sm text-muted-foreground">{t("loginRequired")}</div>
              )}
            </div>
          ) : (
            <div className="space-y-4 bg-slate-50 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-3xl border bg-white p-3">
                <div>
                  <p className="text-sm font-semibold">{conversation.conversationNumber}</p>
                  <p className="text-xs text-muted-foreground">{t("statusLabel")}: {conversation.status}</p>
                </div>
                <Badge variant="secondary" className="rounded-full">{conversation.priority}</Badge>
              </div>
              <div className="max-h-[56vh] overflow-y-auto rounded-3xl bg-slate-50 p-1">
                <SupportThread messages={conversation.messages} />
              </div>
              <SupportMessageComposer placeholder={labels.inputPlaceholder || t("writeMessageFallback")} sendLabel={labels.sendButton || t("sendFallback")} onSend={sendMessage} />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
