"use client";

import { useEffect, useRef, useState } from "react";
import type { ReceivedChatMessage } from "@livekit/components-react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * Text chat inside the call, for when sound or picture drops or a drug name
 * needs spelling out. Messages travel through the call itself and are not
 * stored: they are gone when both sides leave.
 */
export function CallChat({
  messages,
  send,
  isSending,
  peerName,
}: {
  messages: ReceivedChatMessage[];
  send: (message: string) => Promise<unknown>;
  isSending: boolean;
  peerName: string;
}) {
  const t = useTranslations("Consultation.call");
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    try {
      await send(text);
      setDraft("");
    } catch (error) {
      console.error("[consultation] chat send failed", error);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && <p className="pt-8 text-center text-sm text-white/50">{t("chatEmpty")}</p>}
        {messages.map((message) => {
          const mine = message.from?.isLocal ?? false;
          return (
            <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  mine ? "bg-emerald-600 text-white" : "bg-white/10 text-white"
                )}
              >
                <p className="text-[10px] text-white/60">{mine ? t("you") : peerName}</p>
                <p className="whitespace-pre-wrap break-words">{message.message}</p>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-white/10 p-3">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("chatPlaceholder")}
          maxLength={1000}
          className="min-w-0 flex-1 rounded-2xl bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          aria-label={t("send")}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 disabled:opacity-50"
        >
          <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        </button>
      </form>
    </div>
  );
}
