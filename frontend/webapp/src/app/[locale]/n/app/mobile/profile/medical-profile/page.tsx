import sql from "@/config/database/db";

import { requireAuthenticatedUserId } from "./auth";
import MedicalProfilePageClient from "./MedicalProfilePageClient";
import { getMedicalProfilePageData } from "./queries";

export default async function MedicalProfilePage() {
  const identityUserId = await requireAuthenticatedUserId();
  const data = await getMedicalProfilePageData(sql, identityUserId);

  return <MedicalProfilePageClient initialData={data} />;
}
