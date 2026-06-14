import { Suspense } from "react";
import { notFound } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";

import { getEntityConfig } from "../constants";
import { getMarketingLoyaltyFormData, getMarketingLoyaltyList } from "../db/queries";
import type { MarketingLoyaltyEntityKey } from "../types";
import { MarketingLoyaltyRecordForm } from "./record-form";
import { MarketingLoyaltyRecordList } from "./record-list";

export async function MarketingLoyaltyListPage({
  entityKey,
  searchParams,
  locale,
}: {
  entityKey: MarketingLoyaltyEntityKey;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  locale?: string;
}) {
  const config = getEntityConfig(entityKey);
  const params = searchParams ? await searchParams : {};
  const q = typeof params.q === "string" ? params.q : "";
  const page = typeof params.page === "string" ? Number(params.page) : 1;

  return (
    <Suspense fallback={<ListSkeleton />}>
      <MarketingLoyaltyListBoundary entityKey={entityKey} q={q} page={page} locale={locale} />
    </Suspense>
  );
}

async function MarketingLoyaltyListBoundary({
  entityKey,
  q,
  page,
  locale,
}: {
  entityKey: MarketingLoyaltyEntityKey;
  q: string;
  page: number;
  locale?: string;
}) {
  const config = getEntityConfig(entityKey);
  const data = await getMarketingLoyaltyList(entityKey, { q, page, locale });
  return <MarketingLoyaltyRecordList config={config} data={data} q={q} locale={locale} />;
}

export async function MarketingLoyaltyCreatePage({
  entityKey,
  locale,
}: {
  entityKey: MarketingLoyaltyEntityKey;
  locale?: string;
}) {
  const config = getEntityConfig(entityKey);
  if (config.creatable === false) notFound();
  const formData = await getMarketingLoyaltyFormData(entityKey, undefined, locale);
  return <MarketingLoyaltyRecordForm config={config} formData={formData} locale={locale} />;
}

export async function MarketingLoyaltyUpdatePage({
  entityKey,
  id,
  locale,
}: {
  entityKey: MarketingLoyaltyEntityKey;
  id: string;
  locale?: string;
}) {
  const config = getEntityConfig(entityKey);
  if (config.editable === false || config.appendOnly) notFound();
  const formData = await getMarketingLoyaltyFormData(entityKey, id, locale);
  if (!formData.record) notFound();
  return <MarketingLoyaltyRecordForm config={config} formData={formData} locale={locale} />;
}

function ListSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl border p-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
