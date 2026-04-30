import type { Metadata } from "next";

import { SupportCannedRepliesManager } from "@/features/support/admin/support-canned-replies-manager";
import { listCannedReplies } from "@/features/support/server/repository";

export const metadata: Metadata = {
  title: "Support Canned Replies",
  description: "Manage multilingual saved replies for support agents.",
};

export default async function AdminSupportCannedRepliesPage() {
  const replies = await listCannedReplies(true);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Canned replies</h1>
        <p className="text-sm text-muted-foreground">Prepare reusable English and Persian support responses.</p>
      </div>
      <SupportCannedRepliesManager replies={replies} />
    </div>
  );
}
