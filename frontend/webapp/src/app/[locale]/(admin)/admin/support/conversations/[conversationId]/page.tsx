import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { SupportAdminInbox } from "@/features/support/admin/support-admin-inbox";
import { getAdminConversationDetail, listAdminConversations, listCannedReplies, listSupportTags } from "@/features/support/server/repository";

type Props = { params: Promise<{ locale: string; conversationId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SupportPages.admin.conversation" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

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
