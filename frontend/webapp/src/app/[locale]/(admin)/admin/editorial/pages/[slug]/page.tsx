import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page/page-header";
import { SitePageForm } from "@/features/site-content/components/admin/site-page-form";
import { getAdminSitePage } from "@/features/site-content/server/repository";
import { isSitePageSlug } from "@/features/site-content/types";

export const metadata: Metadata = { title: "Edit site page" };

export default async function AdminEditSitePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  if (!isSitePageSlug(slug)) notFound();
  const page = await getAdminSitePage(slug);
  return (
    <div className="space-y-6">
      <PageHeader title={slug} />
      <SitePageForm page={page} />
    </div>
  );
}
