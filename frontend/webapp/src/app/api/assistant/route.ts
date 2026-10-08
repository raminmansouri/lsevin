import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatOpenAI } from "@langchain/openai";
import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { createAgent } from "langchain";

import { buildSystemPrompt } from "@/features/assistant/agent/system-prompt";

export const maxDuration = 60;

// Only send the last few messages to the model: keeps cost per message low.
const MAX_HISTORY = 10;

export async function POST(req: Request) {
  const { messages, locale = "fa" }: { messages: UIMessage[]; locale?: string } = await req.json();

  const mcpUrl = process.env.MCP_SERVER_URL;
  const mcpToken = process.env.MCP_INTERNAL_TOKEN;
  if (!process.env.OPENAI_API_KEY || !mcpUrl || !mcpToken) {
    return Response.json({ error: "Assistant is not configured." }, { status: 503 });
  }

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
    systemPrompt: buildSystemPrompt(locale),
  });

  const history = await toBaseMessages(messages.slice(-MAX_HISTORY));
  const stream = await agent.stream(
    { messages: history },
    // A small recursion limit stops runaway tool loops (and runaway cost).
    { streamMode: ["values", "messages"], recursionLimit: 8 }
  );

  return createUIMessageStreamResponse({ stream: toUIMessageStream(stream) });
}