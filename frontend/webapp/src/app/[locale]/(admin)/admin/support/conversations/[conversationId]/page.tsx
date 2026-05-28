import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SupportAdminInbox } from "@/features/support/admin/support-admin-inbox";
import { getAdminConversationDetail, listAdminConversations, listCannedReplies, listSupportTags } from "@/features/support/server/repository";

type Props = { params: Promise<{ conversationId: string }> };

export const metadata: Metadata = {
  title: "Support Conversation",
  description: "Review and reply to a support conversation.",
};

export default async function AdminSupportConversationPage({ params }: Props) {
  const { conversationId } = await params;
  const [selected, conversations, tags, cannedReplies] = await Promise.all([
    getAdminConversationDetail(conversationId),
    listAdminConversations({ pageNumber: 1, pageSize: 30, status: "all" }),
    listSupportTags(true),
    listCannedReplies(true),
  ]);

  if (!selected) notFound();

  return <SupportAdminInbox initialConversations={conversations} initialSelectedConversation={selected} tags={tags} cannedReplies={cannedReplies} />;
}
