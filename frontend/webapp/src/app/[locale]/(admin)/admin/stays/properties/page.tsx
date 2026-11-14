import { getLocale, getTranslations } from "next-intl/server";

import { listCitiesAdmin } from "@/features/stays/server/admin/operations";
import { listPropertiesAdmin } from "@/features/stays/server/admin/properties";
import { PropertiesList } from "@/features/stays/ui/admin/properties-list";
import { contentLocaleFor } from "@/features/tours/domain/content";
import { adminPageActor, sp } from "@/features/tours/server/admin/page-actor";

export async function generateMetadata() {
  const t = await getTranslations("StayAdmin.properties");
  return { title: t("title") };
}

export default async function StaysAdminPropertiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await adminPageActor();
  const params = await searchParams;
  const content = contentLocaleFor(await getLocale());
  const filters = { q: sp(params, "q") ?? "", status: sp(params, "status") ?? "", cityId: sp(params, "cityId") ?? "" };
  const [rows, cities] = await Promise.all([
    listPropertiesAdmin(
      {
        q: filters.q || null,
        status: ["draft", "published", "paused", "archived"].includes(filters.status) ? filters.status : null,
        cityId: /^[0-9a-f-]{36}$/i.test(filters.cityId) ? filters.cityId : null,
      },
      content,
    ),
    listCitiesAdmin(content),
  ]);
  return <PropertiesList rows={rows} cities={cities.map((c) => ({ id: c.id, label: c.label }))} filters={filters} />;
}
