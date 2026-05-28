import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getSpecialistPageAction } from "@/features/service-providers/actions/specialist-page";

import SpecialistProfileClient from "./specialist-page";

type Awaitable<T> = T | Promise<T>;

type PageProps = {
  params: Awaitable<{
    locale: string;
    id: string;
  }>;
  searchParams?: Awaitable<Record<string, string | string[] | undefined>>;
};

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function resolveCurrentUserId() {
  try {
    const auth = await import("@/lib/auth/session");
    return typeof (auth as any).getUserId === "function" ? await (auth as any).getUserId() : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Pick<PageProps, "params">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SpecialistPage" });

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}

export default async function SpecialistPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.locale);

  const resolvedSearchParams = searchParams ? await searchParams : {};

  const userId = await resolveCurrentUserId();

  const data = await getSpecialistPageAction({
    specialistId: resolvedParams.id,
    locale: resolvedParams.locale,
    userId,
    explicitCurrencyCode: firstSearchValue(resolvedSearchParams.currency),
    selectedCountryCode: firstSearchValue(resolvedSearchParams.country),
    browserCountryCode: firstSearchValue(resolvedSearchParams.browserCountry),
  });

  if (!data) notFound();

  return (
    <SpecialistProfileClient
      data={data}
      specialistId={resolvedParams.id}
      locale={resolvedParams.locale}
    />
  );
}
