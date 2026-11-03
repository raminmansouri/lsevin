"use client";

import { useLocale } from "next-intl";

import { useAssistantChat } from "../hooks/use-assistant-chat";
import { AssistantChat } from "./assistant-chat";

/** The standalone assistant page's chat (the launcher keeps its own). */
export function AssistantChatPanel() {
  const locale = useLocale();
  const { chat, startNewChat, conversations, refreshConversations, openConversation } = useAssistantChat(locale);
  return (
    <AssistantChat
      key={chat.id}
      chat={chat}
      onNewChat={startNewChat}
      history={{ conversations, onOpen: openConversation, onShow: refreshConversations }}
    />
  );
}
