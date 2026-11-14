import type { ReactNode } from "react";

import { StaysAdminNav } from "@/features/stays/ui/admin/shared";
import { assertAdmin } from "@/lib/auth/admin-guard";

export default async function StaysAdminLayout({ children }: { children: ReactNode }) {
  await assertAdmin();
  return (
    <div className="space-y-5">
      <StaysAdminNav />
      {children}
    </div>
  );
}
