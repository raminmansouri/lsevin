"use client";

import { useCallback, useEffect, useState } from "react";
import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { v4 as uuidv4 } from "uuid";

export type AssistantConversationSummary = { id: string; title: string | null; updatedAt: string };

function createChat(locale: string, id: string = uuidv4(), messages: UIMessage[] = []) {
  // The chat id doubles as the saved conversation id on the server, so it must be a uuid.
  return new Chat<UIMessage>({
    id,
    messages,
    transport: new DefaultChatTransport({ api: "/api/assistant", body: { locale } }),
  });
}

/**
 * The assistant chat for this visit. Signed-in users get their latest saved chat back and can
 * open any earlier one (guests start empty and have no list); startNewChat begins a fresh one.
 */
export function useAssistantChat(locale: string) {
  const [chat, setChat] = useState(() => createChat(locale));
  const [conversations, setConversations] = useState<AssistantConversationSummary[]>([]);

  const refreshConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/assistant/conversations", { cache: "no-store" });
      if (!response.ok) return;
      const data: { conversations: AssistantConversationSummary[] } = await response.json();
      setConversations(data.conversations ?? []);
    } catch {
      // Keep the list we have.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setChat(createChat(locale));

    fetch("/api/assistant/history", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { conversationId: string | null; messages: UIMessage[] } | null) => {
        if (cancelled || !data?.conversationId || !data.messages.length) return;
        // Don't replace a chat the user already started typing into while history loaded.
        setChat((current) =>
          current.messages.length ? current : createChat(locale, data.conversationId!, data.messages)
        );
      })
      .catch(() => {
        // No history is fine: the user just starts a new chat.
      });
    void refreshConversations();

    return () => {
      cancelled = true;
    };
  }, [locale, refreshConversations]);

  const startNewChat = useCallback(() => {
    setChat(createChat(locale));
    void refreshConversations();
  }, [locale, refreshConversations]);

  const openConversation = useCallback(
    async (conversationId: string) => {
      try {
        const response = await fetch(`/api/assistant/conversations/${conversationId}`, { cache: "no-store" });
        if (!response.ok) return;
        const data: { conversationId: string; messages: UIMessage[] } = await response.json();
        setChat(createChat(locale, data.conversationId, data.messages));
      } catch {
        // Stay on the current chat.
      }
    },
    [locale]
  );

  return { chat, startNewChat, conversations, refreshConversations, openConversation };
}
