"use client";

import { Loader2, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import SingleMediaPickerInput from "@/features/media-picker-addon/components/SingleMediaPickerInput";
import type { MediaItem } from "@/features/media-picker-addon/types";
import {
  getCustomerConversationDetailAction,
  getOrCreateContextConversationAction,
  markConversationReadForCustomerAction,
  sendCustomerMessageAction,
} from "../server/actions";
import type { SupportAttachment, SupportConversationDetail } from "../types";
import { SupportMessageComposer } from "./support-message-composer";
import { SupportThread } from "./support-thread";

type Props = {
  contextType: "booking" | "consultation";
  bookingId?: string;
  consultationRequestId?: string;
  locale: string;
};

function mediaItemToAttachment(item: MediaItem): SupportAttachment {
  return {
    id: item.id,
    url: item.fileUrl,
    name: item.originalName,
    mimeType: item.mimeType,
    sizeBytes: item.fileSize,
    mediaType: item.mediaType,
  };
}

/**
 * Customer-facing conversation attached to a specific booking or مشاوره
 * request -- composes the existing SupportThread + SupportMessageComposer,
 * driven by getOrCreateContextConversationAction + the same 7s poll the
 * generic support page already uses. Every attachment sent here is
 * automatically archived into the patient's medical documents server-side
 * (see repository.ts's archiveMessageAttachments) -- nothing extra to wire
 * on this component's side for that.
 */
export function ContextConversationPanel({ contextType, bookingId, consultationRequestId, locale }: Props) {
  const t = useTranslations("SupportPages.customer");
  const { data: session } = useSession();
  const user = session?.user;
  const [conversation, setConversation] = useState<SupportConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAttachment, setPendingAttachment] = useState<SupportAttachment | null>(null);
  // Bumped after every send to force SingleMediaPickerInput (uncontrolled by
  // default) to remount and drop its own internal selection/preview state.
  const [pickerResetKey, setPickerResetKey] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getOrCreateContextConversationAction({
      contextType,
      bookingId,
      consultationRequestId,
      customerUserId: user.id,
      displayName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      locale,
    }).then((result) => {
      if (cancelled) return;
      if (result.data) setConversation(result.data);
      if (result.error) toast.error(result.error.detail || result.error.title);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // Only re-resolve if the anchor itself changes -- not on every user object identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextType, bookingId, consultationRequestId, user?.id]);

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

  const sendMessage = async (body: string) => {
    if (!conversation?.id) return;
    const attachments = pendingAttachment ? [pendingAttachment] : [];
    const result = await sendCustomerMessageAction({ conversationId: conversation.id, senderUserId: user?.id, body, attachments });
    if (result.data) {
      setPendingAttachment(null);
      setPickerResetKey((n) => n + 1);
      const refreshed = await getCustomerConversationDetailAction(conversation.id);
      if (refreshed.data) setConversation(refreshed.data);
    }
    if (result.error) toast.error(result.error.detail || result.error.title);
  };

  if (!user?.id) return null;

  return (
    <div className="rounded-3xl border bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#083f30]/10 text-[#083f30]">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-950">{t("conversationTitle")}</h3>
          <p className="text-xs text-muted-foreground">{t("conversationSubtitle")}</p>
        </div>
      </div>

      <div className="space-y-3 bg-slate-50 p-4">
        {loading || !conversation ? (
          <div className="flex min-h-[160px] items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("startingConversation")}
          </div>
        ) : (
          <>
            <div className="max-h-[50vh] overflow-y-auto rounded-3xl bg-slate-50 p-1">
              <SupportThread messages={conversation.messages} />
            </div>

            <SingleMediaPickerInput
              key={pickerResetKey}
              name="conversation-attachment"
              mediaType="all"
              placeholder={t("attachFile")}
              className="w-fit"
              onItemsChange={(items) => setPendingAttachment(items[0] ? mediaItemToAttachment(items[0]) : null)}
            />

            <SupportMessageComposer
              placeholder={t("writeMessageFallback")}
              sendLabel={t("sendFallback")}
              onSend={sendMessage}
            />
          </>
        )}
      </div>
    </div>
  );
}
