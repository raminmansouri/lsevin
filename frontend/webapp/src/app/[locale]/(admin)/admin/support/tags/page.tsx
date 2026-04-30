import type { Metadata } from "next";

import { SupportTagsManager } from "@/features/support/admin/support-tags-manager";
import { listSupportTags } from "@/features/support/server/repository";

export const metadata: Metadata = {
  title: "Support Tags",
  description: "Manage tags for support conversations.",
};

export default async function AdminSupportTagsPage() {
  const tags = await listSupportTags(true);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support tags</h1>
        <p className="text-sm text-muted-foreground">Create color-coded tags for inbox triage.</p>
      </div>
      <SupportTagsManager tags={tags} />
    </div>
  );
}
