import { setRequestLocale } from "next-intl/server";

import { AssistantChatPanel } from "@/features/assistant/components/assistant-chat-panel";

export const dynamic = "force-dynamic";

export default async function AssistantPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="h-[calc(100dvh-8rem)]">
      <AssistantChatPanel />
    </div>
  );
}