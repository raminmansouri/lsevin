import { setRequestLocale } from "next-intl/server";

import { AssistantChat } from "@/features/assistant/components/assistant-chat";

export const dynamic = "force-dynamic";

export default async function AssistantPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AssistantChat />;
}