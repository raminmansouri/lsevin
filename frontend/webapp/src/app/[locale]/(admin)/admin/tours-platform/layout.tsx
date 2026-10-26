import type { ReactNode } from "react";

import { ToursPlatformNav } from "@/features/tours/ui/admin/section-nav";
import { assertAdmin } from "@/lib/auth/admin-guard";

export default async function ToursPlatformLayout({ children }: { children: ReactNode }) {
  await assertAdmin();
  return (
    <div className="space-y-5">
      <ToursPlatformNav />
      {children}
    </div>
  );
}
