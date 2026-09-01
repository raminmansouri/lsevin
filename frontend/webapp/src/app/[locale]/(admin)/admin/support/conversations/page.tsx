import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SupportAdminInbox } from "@/features/support/admin/support-admin-inbox";
import { listAdminConversations, listCannedReplies, listSupportTags } from "@/features/support/server/repository";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string; priority?: string; tagId?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SupportPages.admin.conversation" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

/**
 * Conversations is its own page, not an alias. It used to be a bare
 * redirect("/admin/support"), so opening it always landed on the inbox and the
 * two sections behaved as one.
 *
 * The difference from the inbox: this lists every status rather than defaulting
 * to open, and it selects nothing up front, so it reads as a list. Picking a
 * conversation is handled inside the component and does not navigate away.
 */
export default async function AdminSupportConversationsPage({ searchParams }: Props) {
  const query = await searchParams;
  const [conversations, tags, cannedReplies] = await Promise.all([
    listAdminConversations({
      search: query.q || "",
      status: (query.status as any) || "all",
      priority: (query.priority as any) || "all",
      tagId: query.tagId || undefined,
      pageNumber: 1,
      pageSize: 30,
    }),
    listSupportTags(true),
    listCannedReplies(true),
  ]);

  return (
    <div className="space-y-5">
      <SupportAdminInbox
        initialConversations={conversations}
        initialSelectedConversation={null}
        tags={tags}
        cannedReplies={cannedReplies}
      />
    </div>
  );
}
