import { getTranslations } from "next-intl/server";

import { getStaySettings } from "@/features/stays/server/settings";
import { StaysSettingsForm } from "@/features/stays/ui/admin/operations-admin";
import { adminPageActor } from "@/features/tours/server/admin/page-actor";

export async function generateMetadata() {
  const t = await getTranslations("StayAdmin.settings");
  return { title: t("title") };
}

export default async function StaysAdminSettingsPage() {
  await adminPageActor();
  return <StaysSettingsForm settings={await getStaySettings({ fresh: true })} />;
}
