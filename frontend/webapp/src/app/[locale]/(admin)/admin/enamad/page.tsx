import type { Metadata } from "next";

import { EnamadAdmin } from "@/features/trust-seal/components/enamad-admin";
import { listDomainTrustSealsForAdmin } from "@/features/trust-seal/server/repository";

export const metadata: Metadata = {
  title: "Enamad",
  description: "The Enamad trust seal of each domain.",
};

// Always the stored rows: an admin who just saved must see the change.
export const dynamic = "force-dynamic";

export default async function AdminEnamadPage() {
  const rows = await listDomainTrustSealsForAdmin();
  return <EnamadAdmin rows={rows} />;
}
