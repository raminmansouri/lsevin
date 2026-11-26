import { getLocale, getTranslations } from "next-intl/server";

import { listAmenities } from "@/features/stays/server/catalog";
import { listCitiesAdmin } from "@/features/stays/server/admin/operations";
import { PropertyCreate } from "@/features/stays/ui/admin/property-create";
import { contentLocaleFor } from "@/features/tours/domain/content";
import { adminPageActor } from "@/features/tours/server/admin/page-actor";

export async function generateMetadata() {
  const t = await getTranslations("StayAdmin.properties");
  return { title: t("new") };
}

/** Add a stay on its own page (was a popup). The owner provider is optional: see createProperty. */
export default async function StaysAdminNewPropertyPage() {
  await adminPageActor();
  const locale = contentLocaleFor(await getLocale());
  const [cities, amenities] = await Promise.all([listCitiesAdmin(locale), listAmenities(locale)]);
  return <PropertyCreate amenities={amenities} cities={cities.map((c) => ({ id: c.id, label: c.label }))} />;
}
