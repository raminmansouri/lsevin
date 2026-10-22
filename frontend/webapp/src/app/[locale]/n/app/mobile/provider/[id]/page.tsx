import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { getProviderPageDataFromDbCached } from "@/features/service-providers/server/provider-page.repository.cached";
import { listActiveProviderPageIds } from "@/features/service-providers/server/provider-page.repository";

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
    title: provider.city ? `${provider.name} ? ${provider.city}` : provider.name,
    descriptions: [provider.about, provider.tagline, provider.description],
    image: undefined,
    type: "website",
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

  return (
    <>
      <div className="xl:hidden">
        <ProviderDetailView initialData={result.data} />
      </div>
      <DesktopProviderView initialData={result.data} />
      <div className="pb-36 xl:hidden">
        <SponsoredPlacementSlot locale={locale} placement="provider_detail" />
      </div>
      {/* Desktop: the same slides, in the home page's sponsored showcase */}
      <div className="lsd hidden pb-14 pt-4 xl:block">
        <DesktopSponsoredSection locale={locale} placement="provider_detail" />
      </div>
    </>
  );
}
