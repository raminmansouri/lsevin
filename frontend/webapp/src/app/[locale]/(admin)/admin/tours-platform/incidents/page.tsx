import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { adminPageActor, sp } from "@/features/tours/server/admin/page-actor";
import { listIncidents } from "@/features/tours/server/ops/incidents";
import { IncidentsPanel } from "@/features/tours/ui/admin/ops-panels";
import { Link } from "@/i18n/navigation";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.incidents");
  return { title: t("title") };
}

export default async function IncidentsPage({ searchParams }: Props) {
  const actor = await adminPageActor();
  const q = await searchParams;
  const t = await getTranslations("TourAdmin.incidents");
  const status = ["open", "escalated", "resolved"].includes(sp(q, "status") ?? "") ? sp(q, "status")! : null;
  const incidents = await listIncidents(actor, { status });
  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />
      <div className="flex gap-3 text-sm">
        <Link href="/admin/tours-platform/incidents" className="underline">{t("filter.all")}</Link>
        {["open", "escalated", "resolved"].map((s) => <Link key={s} href={`/admin/tours-platform/incidents?status=${s}`} className="underline">{t(`status.${s}`)}</Link>)}
      </div>
      <IncidentsPanel incidents={incidents} />
    </div>
  );
}
