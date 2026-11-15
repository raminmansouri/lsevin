import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

import { listCitiesAdmin } from "@/features/stays/server/admin/operations";
import { getPropertyAdmin, propertyHistory, publishRequirements } from "@/features/stays/server/admin/properties";
import { listAmenities } from "@/features/stays/server/catalog";
import { PropertyEditor } from "@/features/stays/ui/admin/property-editor";
import { contentLocaleFor } from "@/features/tours/domain/content";
import { adminPageActor, sp } from "@/features/tours/server/admin/page-actor";
import { ToursError } from "@/features/tours/server/platform/errors";

const TABS = ["details", "rooms", "calendar", "photos", "policy", "history"] as const;

export default async function StaysAdminPropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await adminPageActor();
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const content = contentLocaleFor(await getLocale());
  const tabParam = sp(await searchParams, "tab");
  const tab = (TABS as readonly string[]).includes(tabParam ?? "") ? (tabParam as (typeof TABS)[number]) : "details";
  let data;
  try {
    data = await getPropertyAdmin(id);
  } catch (e) {
    if (e instanceof ToursError && e.kind === "not_found") notFound();
    throw e;
  }
  const [cities, amenities, requirements, history] = await Promise.all([
    listCitiesAdmin(content),
    listAmenities(content),
    publishRequirements(id),
    tab === "history" ? propertyHistory(id) : Promise.resolve([]),
  ]);
  return (
    <PropertyEditor
      data={data}
      cities={cities.map((c) => ({ id: c.id, label: c.label }))}
      amenities={amenities}
      requirements={requirements}
      history={history}
      tab={tab}
    />
  );
}
