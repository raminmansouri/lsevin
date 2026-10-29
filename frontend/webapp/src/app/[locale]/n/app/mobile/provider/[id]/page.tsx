import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getProviderPageDataFromDbCached } from "@/features/service-providers/server/provider-page.repository.cached";
import { listActiveProviderPageIds } from "@/features/service-providers/server/provider-page.repository";

import { absoluteUrl } from "@/lib/seo/alternates";
import { breadcrumbList, graph, providerSchema, providerUrl } from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { getIndexableLocales } from "@/lib/seo/locale-eligibility";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { isFastBuild } from "@/lib/build-mode";
import { SponsoredPlacementSlot } from "@/features/sponsered-slider/components/sponsored-placement-slot";

import { ProviderDetailView } from "./provider-detail-view";
import { DesktopSponsoredSection } from "@/features/web-desktop/home/DesktopSponsoredSection";
import { DesktopProviderView } from "@/features/web-desktop/provider/DesktopProviderView";

type RouteParams = { locale: string; id: string };
type PageProps = {
  params: Promise<RouteParams> | RouteParams;
};

export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateStaticParams() {
  if (isFastBuild()) return [];
  try {
    const ids = await listActiveProviderPageIds(400);
    return ids.map((id) => ({ id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, id } = await params;
  const result = await getProviderPageDataFromDbCached({ providerId: id, locale });
  const provider = result?.data?.provider;

  if (!provider) {
    if (result?.error && result.error.status !== 400 && result.error.status !== 404) {
      throw new Error("Could not load provider page.");
    }
    notFound();
  }

  return buildPublicMetadata({
    locale,
    path: `/n/app/mobile/provider/${encodeURIComponent(id)}`,
    title: provider.city ? `${provider.name} | ${provider.city}` : provider.name,
    descriptions: [provider.about, provider.tagline, provider.description],
    image: undefined,
    type: "website",
    eligibleLocales: await getIndexableLocales("provider", id),
  });
}

export default async function ProviderDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const result = await getProviderPageDataFromDbCached({ providerId: id, locale });
  if (!result?.data) {
    if (!result?.error || result.error.status === 400 || result.error.status === 404) {
      notFound();
    }
    throw new Error("Could not load provider page.");
  }

  const { provider, services, specialists } = result.data;
  const brand = (await getTranslations({ locale, namespace: "LocaleLayout" }))("title");

  return (
    <>
      <div className="xl:hidden">
        <ProviderDetailView initialData={result.data} />
      </div>
      <DesktopProviderView initialData={result.data} />
      <div className="pb-36 xl:hidden">
      <JsonLd
        data={graph(
          providerSchema({
            locale,
            id: provider.id,
            name: provider.name,
            providerType: provider.providerType,
            description: provider.about || provider.tagline || provider.description,
            image: provider.image,
            images: provider.images,
            street: provider.street,
            city: provider.city,
            country: provider.country,
            latitude: provider.latitude,
            longitude: provider.longitude,
            languages: provider.languages,
            services,
            specialists,
          }),
          breadcrumbList([
            { name: brand, url: absoluteUrl(locale, "/n/app/mobile/home") },
            { name: provider.name, url: providerUrl(locale, provider.id) },
          ])
        )}
      />
        <SponsoredPlacementSlot locale={locale} placement="provider_detail" />
      </div>
      {/* Desktop: the same slides, in the home page's sponsored showcase */}
      <div className="lsd hidden pb-14 pt-4 xl:block">
        <DesktopSponsoredSection locale={locale} placement="provider_detail" />
      </div>
    </>
  );
}
