import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { getAssistantConversationAdmin } from "@/features/assistant/server/admin.repository";

export const dynamic = "force-dynamic";

/** The tool name of a tool part ("tool-search_services" or a dynamic tool), or null. */
function toolName(part: { type: string; toolName?: string }): string | null {
  if (part.type === "dynamic-tool") return part.toolName ?? "tool";
  return part.type.startsWith("tool-") ? part.type.slice(5) : null;
}

export default async function AdminAssistantConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("AdminAssistant");
  const locale = await getLocale();
  const { id } = await params;
  const data = await getAssistantConversationAdmin(id);
  if (!data) notFound();
  const { conversation: c, messages } = data;
  const timeFmt = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{c.title || t("list.untitled")}</h1>
          <p className="text-xs text-gray-500">
            {c.userId ? (c.userEmail ?? t("list.user")) : t("list.guest")} · {c.locale?.toUpperCase() ?? "—"} · {timeFmt.format(new Date(c.updatedAt))}
          </p>
        </div>
        <Link href="/admin/assistant" className="text-sm font-medium text-[#083f30]">{t("detail.back")}</Link>
      </div>

      <div className="mx-auto max-w-3xl space-y-3">
        {messages.map((m) => {
          const mine = m.role === "user";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[85%] space-y-2 rounded-2xl px-4 py-3 text-sm ${mine ? "bg-white ring-1 ring-gray-200" : "bg-[#083f30]/[0.06]"}`}>
                <p className="text-[11px] font-semibold text-gray-500">
                  {mine ? t("detail.user") : t("detail.assistant")} · {timeFmt.format(new Date(m.createdAt))}
                </p>
                {(m.parts ?? []).map((part: any, i: number) => {
                  if (part.type === "text") {
                    return <p key={i} className="whitespace-pre-wrap leading-7 text-gray-900" dir="auto">{part.text}</p>;
                  }
                  const tool = toolName(part);
                  if (!tool) return null;
                  return (
                    <details key={i} className="rounded-lg bg-white/70 px-3 py-2 text-xs ring-1 ring-gray-200">
                      <summary className="cursor-pointer font-mono text-[#083f30]">🔧 {tool}</summary>
                      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[11px] text-gray-600" dir="ltr">
                        {JSON.stringify({ input: part.input, output: part.output }, null, 2).slice(0, 4000)}
                      </pre>
                    </details>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}