import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { getTourDetail } from "@/features/tours/server/platform/catalog";
import { CompareView } from "@/features/tours/ui/customer/compare-view";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TourApp.compare" });
  return { title: t("title") };
}

/** Side-by-side comparison of up to three published tours (C-049). */
export default async function ComparePage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ ids?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { ids } = await searchParams;
  const list = String(ids ?? "").split(",").filter((s) => /^[0-9a-f-]{36}$/i.test(s)).slice(0, 3);
  const content = contentLocaleFor(locale);
  const details = (await Promise.all(list.map((id) => getTourDetail(id, content).catch(() => null)))).filter((d): d is NonNullable<typeof d> => Boolean(d));
  return <CompareView tours={details} />;
}
