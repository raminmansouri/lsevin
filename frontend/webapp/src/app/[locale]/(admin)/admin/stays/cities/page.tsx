import { getLocale, getTranslations } from "next-intl/server";

import { listCitiesAdmin } from "@/features/stays/server/admin/operations";
import { CitiesManager } from "@/features/stays/ui/admin/operations-admin";
import { contentLocaleFor } from "@/features/tours/domain/content";
import { adminPageActor } from "@/features/tours/server/admin/page-actor";

export async function generateMetadata() {
  const t = await getTranslations("StayAdmin.cities");
  return { title: t("title") };
}

export default async function StaysAdminCitiesPage() {
  await adminPageActor();
  const locale = await getLocale();
  return <CitiesManager cities={await listCitiesAdmin(contentLocaleFor(locale))} />;
}
