import type { Metadata } from "next";

import { SupportAdminInbox } from "@/features/support/admin/support-admin-inbox";
import { getAdminConversationDetail, listAdminConversations, listCannedReplies, listSupportTags } from "@/features/support/server/repository";

type Props = {
  searchParams: Promise<{ q?: string; status?: string; priority?: string; tagId?: string }>;
};

export const metadata: Metadata = {
  title: "Support Inbox",
  description: "Crisp-like online support inbox.",
};

export default async function AdminSupportPage({ searchParams }: Props) {
  const query = await searchParams;
  const [conversations, tags, cannedReplies] = await Promise.all([
    listAdminConversations({
      search: query.q || "",
      status: (query.status as any) || "open",
      priority: (query.priority as any) || "all",
      tagId: query.tagId || undefined,
      pageNumber: 1,
      pageSize: 30,
    }),
    listSupportTags(true),
    listCannedReplies(true),
  ]);

  const selected = conversations.items[0]?.id ? await getAdminConversationDetail(conversations.items[0].id) : null;

  return (
    <div className="space-y-5">
      <SupportAdminInbox initialConversations={conversations} initialSelectedConversation={selected} tags={tags} cannedReplies={cannedReplies} />
    </div>
  );
}
