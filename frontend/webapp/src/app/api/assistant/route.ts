import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";

import { localeToHeader } from "@/config/locales";
import { createSearchServicesTool } from "@/features/assistant/tools/search-services";
import type { SearchServicesToolOutput } from "@/features/assistant/types";
import type { LocaleTypes } from "@/types/common";

export const maxDuration = 60;

function lastUserText(messages: UIMessage[]): string {
  const last = [...messages].reverse().find((message) => message.role === "user");
  if (!last) return "";
  return last.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim();
}

export async function POST(req: Request) {
  const { messages, locale }: { messages: UIMessage[]; locale?: string } = await req.json();
  const storedLocale = localeToHeader((locale ?? "fa") as LocaleTypes) || "fa-IR";
  const query = lastUserText(messages);

  // TEMPORARY mock mode until the OpenAI key arrives:
  // search with the raw user text and return the results as cards.
  const searchTool = createSearchServicesTool(storedLocale);
  const output = JSON.parse(
    (await searchTool.invoke({ query, limit: 5 })) as string
  ) as SearchServicesToolOutput;

  const stream = createUIMessageStream({
    async execute({ writer }) {
      writer.write({ type: "start" });

      const textId = "mock-text";
      writer.write({ type: "text-start", id: textId });
      writer.write({
        type: "text-delta",
        id: textId,
        delta: output.count
          ? `[mock] ${output.count} results for "${query}":`
          : `[mock] No results for "${query}".`,
      });
      writer.write({ type: "text-end", id: textId });

      if (output.count) {
        writer.write({ type: "data-services", id: "mock-services", data: output.results });
      }

      writer.write({ type: "finish" });
    },
  });

  return createUIMessageStreamResponse({ stream });
}