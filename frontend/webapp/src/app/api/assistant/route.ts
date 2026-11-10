import { randomUUID } from "node:crypto";

import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatOpenAI } from "@langchain/openai";
import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { createAgent } from "langchain";

import { buildSystemPrompt } from "@/features/assistant/agent/system-prompt";
import {
  ensureConversation,
  getEarlierChatsMemory,
  isValidConversationId,
  saveMessages,
} from "@/features/assistant/server/conversations.repository";
import { resolveIsIranianVisitor } from "@/features/finance/lib/server/iranian-visitor";
import { getUserId } from "@/lib/auth/session";
import { cookies } from "next/headers";

import { checkAssistantLimits, limitReply } from "@/features/assistant/server/limits";

/** A guest's anonymous id (to count their messages and save their chats). */
const GUEST_COOKIE = "lsevin_ai_guest";

/** A one-off answer written straight into the chat, without calling the model. */
function textReply(text: string) {
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const id = randomUUID();
      writer.write({ type: "text-start", id });
      writer.write({ type: "text-delta", id, delta: text });
      writer.write({ type: "text-end", id });
    },
  });
  return createUIMessageStreamResponse({ stream });
}

import { classifyMessage, guardReply } from "@/features/assistant/agent/topic-guard";

export const maxDuration = 60;

// Only send the last few messages to the model: keeps cost per message low.
const MAX_HISTORY = 10;

/**
 * Signed-in users get their chat saved, and guests too when the admin allows it (by their
 * cookie id). Returns the chat id to save into (or null) and what the assistant should
 * remember from the user's earlier chats (signed-in users only).
 */
async function startSaving(
  id: unknown,
  locale: string,
  messages: UIMessage[],
  owner: { userId: string | null; guestId: string | null; saveGuests: boolean }
): Promise<{ conversationId: string | null; earlierChats: string }> {
  const none = { conversationId: null, earlierChats: "" };
  try {
    const { userId } = owner;
    const guestId = !userId && owner.saveGuests ? owner.guestId : null;
    if ((!userId && !guestId) || !isValidConversationId(id)) return none;

    const firstUserMessage = messages.find((message) => message.role === "user");
    const owned = await ensureConversation({ id, userId, guestId, locale, firstMessage: firstUserMessage });
    if (!owned) return none;

    // Save the new user message now, so it is kept even if the answer fails.
    const last = messages[messages.length - 1];
    if (last?.role === "user") await saveMessages(id, [last]);

    let earlierChats = "";
    if (userId) {
      try {
        earlierChats = await getEarlierChatsMemory(userId, id);
      } catch (error) {
        console.error("[assistant] could not load earlier chats", error);
      }
    }
    return { conversationId: id, earlierChats };
  } catch (error) {
    // Saving must never stop the assistant from answering. "relation ai.conversations does
    // not exist" here means migration 0073 (or 0090) has not been applied to this database.
    console.error("[assistant] could not save the chat", error);
    return none;
  }
}


export async function POST(req: Request) {
  const {
    id,
    messages,
    locale = "fa",
  }: { id?: string; messages: UIMessage[]; locale?: string } = await req.json();


  // Semantic router: clearly off-topic messages get a polite answer without calling the model.
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
  const lastUserText =
    lastUserMessage?.parts
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join(" ") ?? "";

  // Who is asking: a signed-in user, or a guest known by a cookie id (set on their first message).
  const userId = await getUserId().catch(() => null);
  const cookieStore = await cookies();
  let guestId = cookieStore.get(GUEST_COOKIE)?.value ?? null;
  if (!userId && !isValidConversationId(guestId)) {
    guestId = randomUUID();
    cookieStore.set(GUEST_COOKIE, guestId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;

  // Admin-set limits, checked before anything that costs a model call.
  const { verdict: limit, settings } = await checkAssistantLimits({
    userId,
    guestId: userId ? null : guestId,
    ip: userId ? null : ip,
    userMessagesInChat: Array.isArray(messages) ? messages.filter((message) => message.role === "user").length : 0,
    textLength: lastUserText.length,
  });
  if (limit !== "ok") return textReply(limitReply(limit, locale, !userId, settings));

  // The assistant's reply just before this message, so short follow-ups are judged in context.
  const lastUserIndex = lastUserMessage ? messages.lastIndexOf(lastUserMessage) : -1;
  const previousAssistant = messages
    .slice(0, Math.max(lastUserIndex, 0))
    .reverse()
    .find((message) => message.role === "assistant");
  const previousAssistantText =
    previousAssistant?.parts
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join(" ") ?? "";

  const verdict = lastUserText ? await classifyMessage(lastUserText, previousAssistantText) : "ok";
  if (verdict !== "ok") {
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        const id = randomUUID();
        writer.write({ type: "text-start", id });
        writer.write({ type: "text-delta", id, delta: guardReply(verdict, locale) });
        writer.write({ type: "text-end", id });
      },
    });
    return createUIMessageStreamResponse({ stream });
  }


  const mcpUrl = process.env.MCP_SERVER_URL;
  const mcpToken = process.env.MCP_INTERNAL_TOKEN;
  if (!process.env.OPENAI_API_KEY || !mcpUrl || !mcpToken) {
    return Response.json({ error: "Assistant is not configured." }, { status: 503 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "No messages." }, { status: 400 });
  }

  const [{ conversationId, earlierChats }, isIranianVisitor] = await Promise.all([
    startSaving(id, locale, messages, { userId, guestId, saveGuests: settings.saveGuestChats }),
    // Decided here, from the visitor's own request, so search results show the prices the site shows them.
    resolveIsIranianVisitor().catch(() => false),
  ]);

  // Tools come from our MCP server; it learns the user's language and price currency from these headers.
  const mcpClient = new MultiServerMCPClient({
    mcpServers: {
      lsevin: {
        transport: "http",
        url: mcpUrl,
        headers: {
          Authorization: `Bearer ${mcpToken}`,
          "x-lsevin-locale": locale,
          "x-lsevin-iranian": isIranianVisitor ? "1" : "0",
        },
      },
    },
  });
  const tools = await mcpClient.getTools();

  const agent = createAgent({
    model: new ChatOpenAI({ model: process.env.OPENAI_MODEL ?? "gpt-5.6-luna" }),
    tools,
    systemPrompt: buildSystemPrompt(locale, earlierChats),
  });

  const history = await toBaseMessages(messages.slice(-MAX_HISTORY));
  const agentStream = await agent.stream(
    { messages: history },
    // A small recursion limit stops runaway tool loops (and runaway cost).
    { streamMode: ["values", "messages"], recursionLimit: 8 }
  );

  const stream = createUIMessageStream<UIMessage>({
    // Passing the conversation gives the answer a stable id we can save it under.
    originalMessages: messages,
    generateId: randomUUID,
    execute: ({ writer }) => {
      writer.merge(toUIMessageStream(agentStream));
    },
    onEnd: async ({ responseMessage }) => {
      if (!conversationId || !responseMessage?.parts?.length) return;
      try {
        await saveMessages(conversationId, [responseMessage]);
      } catch (error) {
        console.error("[assistant] could not save the answer", error);
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
