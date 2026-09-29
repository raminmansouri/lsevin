"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SupportThread } from "@/features/support/components/support-thread";
import {
  getAdminConversationDetailAction,
  getOrCreateContextConversationAction,
  markConversationReadForAdminAction,
  sendAgentMessageAction,
} from "@/features/support/server/actions";
import type { SupportConversationDetail } from "@/features/support/types";
import { CONSULTATION_TRANSLATION_KEY } from "../../types";

type Props = {
  consultationRequestId: string;
  customerUserId: string | null;
  displayName: string;
  locale: string | null;
};

/**
 * Admin-side "Conversation" section inside the مشاوره detail dialog --
 * same support.* thread the customer sees on their side (contextType:
 * "consultation"), not a parallel mechanism. Only offered for requests
 * raised by a logged-in customer: consultation_requests.user_id is
 * nullable for guest leads, and every downstream write this thread could
 * trigger (clinical-record/requirement actions) needs a real patient, so a
 * guest request has nothing to attach a conversation's case-actions to --
 * deferred to Phase 2 per the approved plan, not silently broken here.
 */
export function ConsultationConversationPanel({ consultationRequestId, customerUserId, displayName, locale }: Props) {
  const t = useTranslations(CONSULTATION_TRANSLATION_KEY);
  const { data: session } = useSession();
  const user = session?.user;
  const [conversation, setConversation] = useState<SupportConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!customerUserId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getOrCreateContextConversationAction({
      contextType: "consultation",
      consultationRequestId,
      customerUserId,
      displayName,
      locale: locale || "fa-IR",
    }).then((result) => {
      if (cancelled) return;
      if (result.data) setConversation(result.data);
      if (result.error) toast.error(result.error.detail || result.error.title);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [consultationRequestId, customerUserId, displayName, locale]);

  useEffect(() => {
    if (!conversation?.id) return;
    const interval = window.setInterval(async () => {
      const result = await getAdminConversationDetailAction(conversation.id);
      if (result.data) setConversation(result.data);
    }, 8000);
    return () => window.clearInterval(interval);
  }, [conversation?.id]);

  useEffect(() => {
    if (!conversation?.id || conversation.unreadForAdminCount <= 0) return;
    markConversationReadForAdminAction(conversation.id).catch(() => undefined);
  }, [conversation?.id, conversation?.unreadForAdminCount]);

  const send = async () => {
    if (!conversation?.id || !body.trim() || sending) return;
    setSending(true);
    const result = await sendAgentMessageAction({ conversationId: conversation.id, agentUserId: user?.id, body: body.trim(), attachments: [] });
    if (result.data) {
      setBody("");
      const refreshed = await getAdminConversationDetailAction(conversation.id);
      if (refreshed.data) setConversation(refreshed.data);
    }
    if (result.error) toast.error(result.error.detail || result.error.title);
    setSending(false);
  };

  if (!customerUserId) {
    return (
      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <MessageCircle className="size-4" />
          {t("admin.detail.conversation")}
        </h3>
        <p className="text-muted-foreground text-sm">{t("admin.detail.conversationGuestNotice")}</p>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <MessageCircle className="size-4" />
        {t("admin.detail.conversation")}
        {loading && <Loader2 className="size-3.5 animate-spin" />}
      </h3>

      {!loading && conversation && (
        <div className="space-y-2">
          <div className="max-h-64 overflow-y-auto rounded-md bg-muted/30 p-2">
            <SupportThread messages={conversation.messages} />
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={t("admin.detail.conversationPlaceholder")}
              className="min-h-16"
            />
            <Button type="button" onClick={send} disabled={sending || !body.trim()}>
              {t("admin.detail.conversationSend")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
