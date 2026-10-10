"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Send, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { AssistantServiceResult } from "../types";
import { AssistantServiceCard } from "./assistant-service-card";

/** Pull results out of a search_services tool output (MCP text content or plain JSON). */
function extractServices(output: unknown): AssistantServiceResult[] {
  try {
    let value: unknown = output;
    if (typeof value === "object" && value !== null && !Array.isArray(value) && "content" in value) {
      value = (value as { content: unknown }).content;
    }
    if (Array.isArray(value)) {
      const textBlock = value.find(
        (block): block is { type: string; text: string } =>
          typeof block === "object" && block !== null && (block as { type?: string }).type === "text"
      );
      value = textBlock?.text;
    }
    if (typeof value === "string") value = JSON.parse(value);
    const results = (value as { results?: AssistantServiceResult[] } | null)?.results;
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  }
}

export function AssistantChat({ chat }: { chat?: Chat<UIMessage> }) {
  const t = useTranslations("Assistant.chat");
  const locale = useLocale();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Use the launcher's shared chat when given; otherwise (the standalone page) create one.
  const ownChat = useMemo(
    () =>
      chat ??
      new Chat<UIMessage>({
        transport: new DefaultChatTransport({ api: "/api/assistant", body: { locale } }),
      }),
    [chat, locale]
  );
  const { messages, sendMessage, status, error } = useChat({ chat: ownChat });
  const busy = status === "submitted" || status === "streaming";

  // Keep the newest message in view.
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    sendMessage({ text: value });
    setInput("");
  };

  const suggestions = [t("suggestions.hair"), t("suggestions.dental"), t("suggestions.nose")];

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="rounded-2xl bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-4 text-white">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={18} className="text-[#eacb7f]" />
              <h1 className="text-base font-bold">{t("title")}</h1>
            </div>
            <p className="text-sm text-white/85">{t("welcome")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "flex ltr:justify-end rtl:justify-start"
                : "flex flex-col gap-2 ltr:items-start rtl:items-end"
            }
          >
            {message.parts.map((part, index) => {
              if (part.type === "text") {
                if (!part.text.trim()) return null;
                return (
                  <div
                    key={index}
                    className={
                      message.role === "user"
                        ? "max-w-[85%] rounded-2xl rounded-br-sm bg-[#083f30] px-3.5 py-2 text-sm text-white"
                        : "max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-sm text-gray-800 shadow-sm"
                    }
                  >
                    {part.text}
                  </div>
                );
              }

              // The MCP adapter prefixes tool names with the server name ("lsevin_search_services").
              const toolName =
                part.type === "dynamic-tool"
                  ? (part as { toolName?: string }).toolName ?? ""
                  : part.type.startsWith("tool-")
                    ? part.type.slice("tool-".length)
                    : "";
              if (toolName.endsWith("search_services")) {
                const toolPart = part as { state?: string; output?: unknown };
                if (toolPart.state !== "output-available") return null;
                const services = extractServices(toolPart.output);
                if (!services.length) return null;
                return (
                  <div key={index} className="w-full space-y-2">
                    {services.map((service, serviceIndex) => (
                      <AssistantServiceCard key={`${service.type}-${service.id}-${serviceIndex}`} service={service} />
                    ))}
                  </div>
                );
              }

              return null;
            })}
          </div>
        ))}

        {busy ? <p className="text-xs text-gray-500">{t("thinking")}</p> : null}
        {error ? <p className="text-xs text-red-600">{t("error")}</p> : null}
      </div>

      <div className="border-t border-gray-100 bg-white px-3 py-2.5">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") send(input);
            }}
            placeholder={t("placeholder")}
            className="h-11 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-[#083f30]"
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={busy || !input.trim()}
            aria-label={t("send")}
            className="grid h-11 w-11 place-items-center rounded-full bg-[#083f30] text-white disabled:opacity-40"
          >
            <Send size={18} className="rtl:-scale-x-100" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-gray-400">{t("disclaimer")}</p>
      </div>
    </div>
  );
}