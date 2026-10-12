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
import { getUserId } from "@/lib/auth/session";

export const maxDuration = 60;

// Only send the last few messages to the model: keeps cost per message low.
const MAX_HISTORY = 10;

/**
 * Signed-in users get their chat saved. Returns the chat id to save into (or null) and
 * what the assistant should remember from their earlier chats.
 */
async function startSaving(
  id: unknown,
  locale: string,
  messages: UIMessage[]
): Promise<{ conversationId: string | null; earlierChats: string }> {
  const none = { conversationId: null, earlierChats: "" };
  try {
    const userId = await getUserId();
    if (!userId || !isValidConversationId(id)) return none;

    const firstUserMessage = messages.find((message) => message.role === "user");
    const owned = await ensureConversation({ id, userId, locale, firstMessage: firstUserMessage });
    if (!owned) return none;

    // Save the new user message now, so it is kept even if the answer fails.
    const last = messages[messages.length - 1];
    if (last?.role === "user") await saveMessages(id, [last]);

    let earlierChats = "";
    try {
      earlierChats = await getEarlierChatsMemory(userId, id);
    } catch (error) {
      console.error("[assistant] could not load earlier chats", error);
    }
    return { conversationId: id, earlierChats };
  } catch (error) {
    // Saving must never stop the assistant from answering. "relation ai.conversations does
    // not exist" here means migration 0073 has not been applied to this database.
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

  const mcpUrl = process.env.MCP_SERVER_URL;
  const mcpToken = process.env.MCP_INTERNAL_TOKEN;
  if (!process.env.OPENAI_API_KEY || !mcpUrl || !mcpToken) {
    return Response.json({ error: "Assistant is not configured." }, { status: 503 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "No messages." }, { status: 400 });
  }

  const { conversationId, earlierChats } = await startSaving(id, locale, messages);

  // Tools come from our MCP server; it learns the user's language from this header.
  const mcpClient = new MultiServerMCPClient({
    mcpServers: {
      lsevin: {
        transport: "http",
        url: mcpUrl,
        headers: {
          Authorization: `Bearer ${mcpToken}`,
          "x-lsevin-locale": locale,
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
