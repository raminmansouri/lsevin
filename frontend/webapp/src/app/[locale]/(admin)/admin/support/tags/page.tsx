import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SupportTagsManager } from "@/features/support/admin/support-tags-manager";
import { listSupportTags } from "@/features/support/server/repository";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SupportPages.admin.tags" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function AdminSupportTagsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SupportPages.admin.tags" });
  const tags = await listSupportTags(true);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("pageDescription")}</p>
      </div>
      <SupportTagsManager tags={tags} />
    </div>
  );
}
