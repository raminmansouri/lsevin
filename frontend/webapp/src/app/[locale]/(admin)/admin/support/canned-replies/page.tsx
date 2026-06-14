import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SupportCannedRepliesManager } from "@/features/support/admin/support-canned-replies-manager";
import { listCannedReplies } from "@/features/support/server/repository";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SupportPages.admin.cannedReplies" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function AdminSupportCannedRepliesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SupportPages.admin.cannedReplies" });
  const replies = await listCannedReplies(true);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("pageDescription")}</p>
      </div>
      <SupportCannedRepliesManager replies={replies} />
    </div>
  );
}
