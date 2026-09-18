import { setRequestLocale } from "next-intl/server";

import { getProviderPageDataFromDbCached } from "@/features/service-providers/server/provider-page.repository.cached";
import { listActiveProviderPageIds } from "@/features/service-providers/server/provider-page.repository";

import { alternatesFor } from "@/lib/seo/alternates";
import { SponsoredPlacementSlot } from "@/features/sponsered-slider/components/sponsored-placement-slot";

import { ProviderDetailView } from "./provider-detail-view";

type RouteParams = { locale: string; id: string };
type PageProps = {
  params: Promise<RouteParams> | RouteParams;
};

// Static / ISR. The server shell fetches the page data in the default currency
// with no visitor context and hands it to the interactive client view as
// `initialData`; the view owns the favourite toggle and any currency the
// visitor picked. `generateStaticParams` prewarms active providers.
export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const ids = await listActiveProviderPageIds(400);
    return ids.map((id) => ({ id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, id } = await params;
  const result = await getProviderPageDataFromDbCached({ providerId: id, locale }).catch(() => null);
  const provider = result?.data?.provider;

  if (!provider) {
    return { title: "Provider", alternates: alternatesFor(locale, `/n/app/mobile/provider/${id}`) };
  }

  const title = provider.city ? `${provider.name} — ${provider.city}` : provider.name;
  const description = (provider.about || provider.tagline || provider.description || "").slice(0, 300);

  return {
    title,
    description: description || undefined,
    alternates: alternatesFor(locale, `/n/app/mobile/provider/${id}`),
    openGraph: {
      title,
      description: description || undefined,
      type: "website",
    },
  };
}

export default async function ProviderDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const result = await getProviderPageDataFromDbCached({ providerId: id, locale }).catch(
    () => ({ data: undefined, error: undefined }) as Awaited<ReturnType<typeof getProviderPageDataFromDbCached>>,
  );

  return (
    <>
      <ProviderDetailView initialData={result?.data ?? undefined} />
      <SponsoredPlacementSlot locale={locale} placement="provider_detail" />
    </>
  );
}
