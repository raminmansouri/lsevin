import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getProviderPageDataFromDbCached } from "@/features/service-providers/server/provider-page.repository.cached";
import { listActiveProviderPageIds } from "@/features/service-providers/server/provider-page.repository";

import { absoluteUrl } from "@/lib/seo/alternates";
import { breadcrumbList, graph, providerSchema } from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { getIndexableLocales } from "@/lib/seo/locale-eligibility";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { publicSegmentsForIds, resolvePublicEntity } from "@/lib/seo/public-slugs";
import { isFastBuild } from "@/lib/build-mode";
import { SponsoredPlacementSlot } from "@/features/sponsered-slider/components/sponsored-placement-slot";

import { ProviderDetailView } from "./provider-detail-view";
import { DesktopSponsoredSection } from "@/features/web-desktop/home/DesktopSponsoredSection";
import { DesktopProviderView } from "@/features/web-desktop/provider/DesktopProviderView";
import { PageFaq } from "@/features/site-content/components/faq-section";

type RouteParams = { locale: string; slug: string };
type PageProps = {
  params: Promise<RouteParams> | RouteParams;
};

export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateStaticParams() {
  if (isFastBuild()) return [];
  try {
    const ids = await listActiveProviderPageIds(400);
    return (await publicSegmentsForIds("provider", ids)).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug: identifier } = await params;
  const ref = await resolvePublicEntity('provider', identifier);
  if (!ref) notFound();
  const id = ref.id;
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
    path: `/providers/${ref.slug ?? id}`,
    title: provider.city ? `${provider.name} | ${provider.city}` : provider.name,
    descriptions: [provider.about, provider.tagline, provider.description],
    image: undefined,
    type: "website",
    eligibleLocales: await getIndexableLocales("provider", id),
  });
}

// Same match the favourites tabs use for gyms (profile/favorites/queries.ts).
const GYM_PROVIDER_TYPE = /(gym|fitness|club|sport|باشگاه|ورزش)/iu;

export default async function ProviderDetailPage({ params }: PageProps) {
  const { locale, slug: identifier } = await params;
  setRequestLocale(locale);
  const ref = await resolvePublicEntity('provider', identifier);
  if (!ref) notFound();
  if (ref.slug && identifier !== ref.slug) permanentRedirect(`/${locale}/providers/${ref.slug}`);
  const id = ref.id;
  const canonicalPath = `/providers/${ref.slug ?? id}`;
  const canonicalUrl = absoluteUrl(locale, canonicalPath);

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
            url: canonicalUrl,
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
            { name: brand, url: absoluteUrl(locale) },
            { name: provider.name, url: canonicalUrl },
          ])
        )}
      />
        <SponsoredPlacementSlot locale={locale} placement="provider_detail" />
      </div>
      {/* Desktop: the same slides, in the home page's sponsored showcase */}
      <div className="lsd hidden pb-14 pt-4 xl:block">
        <DesktopSponsoredSection locale={locale} placement="provider_detail" />
      </div>
      <PageFaq
        target={
          // Gyms and fitness clubs: the provider's own FAQ, else the gym FAQ (admin → Editorial).
          GYM_PROVIDER_TYPE.test(String(provider.providerType ?? ""))
            ? [{ scope: "provider", entityId: provider.id, exact: true }, { scope: "app", entityKey: "gym" }, { scope: "provider" }]
            : { scope: "provider", entityId: provider.id }
        }
        locale={locale}
        pageUrl={canonicalUrl}
      />
    </>
  );
}
