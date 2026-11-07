import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, permanentRedirect } from "next/navigation";

import { listActiveServicePageIds } from "@/features/service-providers/server/service-page.repository";
import { getServicePageByIdCached } from "@/features/service-providers/server/service-page.repository.cached";
import { SponsoredPlacementSlot } from "@/features/sponsered-slider/components/sponsored-placement-slot";
import { isFastBuild } from "@/lib/build-mode";
import { absoluteUrl } from "@/lib/seo/alternates";
import {
  breadcrumbList,
  graph,
  providerUrl,
  serviceSchema,
} from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { getIndexableLocales } from "@/lib/seo/locale-eligibility";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { publicSegmentsForIds, resolvePublicEntity } from "@/lib/seo/public-slugs";

import { DesktopServiceView } from '@/features/web-desktop/service/DesktopServiceView';
import { DesktopSponsoredSection } from '@/features/web-desktop/home/DesktopSponsoredSection';

import ServicePage from "./service-page";
import { PageFaq } from "@/features/site-content/components/faq-section";

type ServiceRouteParams = {
  locale: string;
  slug: string;
};

type ServicePageRouteProps = {
  params: Promise<ServiceRouteParams> | ServiceRouteParams;
};

// Static / ISR. Rendered without a visitor context (default currency, no
// favourite state — the interactive view resolves those on the client).
// `generateStaticParams` prewarms active services; anything else is ISR'd.
export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateStaticParams() {
  if (isFastBuild()) return [];
  try {
    const ids = await listActiveServicePageIds(400);
    return (await publicSegmentsForIds("service", ids)).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: Pick<ServicePageRouteProps, "params">) {
  const { locale, slug: identifier } = await params;
  const ref = await resolvePublicEntity('service', identifier);
  if (!ref) notFound();
  const id = ref.id;
  const data = await getServicePageByIdCached({ serviceId: id, locale });
  const service = data?.service;

  if (!service) {
    notFound();
  }

  return buildPublicMetadata({
    locale,
    path: `/services/${ref.slug ?? id}`,
    title: service.clinic
      ? `${service.name} | ${service.clinic}`
      : service.name,
    descriptions: [
      service.subtitle,
      service.definitionDescription,
      service.providerDescription,
    ],
    image: service.images?.[0],
    type: "website",
    eligibleLocales: await getIndexableLocales("service", id),
  });
}

export default async function TreatmentDetailPage({
  params,
}: ServicePageRouteProps) {
  const { locale, slug: identifier } = await params;
  setRequestLocale(locale);
  const ref = await resolvePublicEntity('service', identifier);
  if (!ref) notFound();
  if (ref.slug && identifier !== ref.slug) permanentRedirect(`/${locale}/services/${ref.slug}`);
  const id = ref.id;
  const canonicalPath = `/services/${ref.slug ?? id}`;
  const canonicalUrl = absoluteUrl(locale, canonicalPath);

  const data = await getServicePageByIdCached({ serviceId: id, locale });

  if (!data) {
    notFound();
  }

  const { service } = data;
  const brand = (await getTranslations({ locale, namespace: "LocaleLayout" }))("title");

  return (
    <>
      <div className="xl:hidden">
        <ServicePage data={data} serviceId={id} locale={locale} />
      </div>
      <DesktopServiceView data={data} serviceId={id} locale={locale} />
      <div className="pb-36 xl:hidden">
      {service ? (
        <JsonLd
          data={graph(
            serviceSchema({
              locale,
              id,
              url: canonicalUrl,
              name: service.name,
              description: service.subtitle || service.definitionDescription,
              category: service.categoryName,
              image: service.images?.[0],
              providerId: service.clinicId,
              providerSlug: service.clinicSlug,
              providerName: service.clinic,
              city: service.city,
              country: service.country,
            }),
            breadcrumbList([
              { name: brand, url: absoluteUrl(locale, "/n/app/mobile/home") },
              ...(service.clinicId && service.clinic
                ? [{ name: service.clinic, url: providerUrl(locale, { id: service.clinicId, slug: service.clinicSlug }) }]
                : []),
              { name: service.name, url: canonicalUrl },
            ])
          )}
        />
      ) : null}
        <SponsoredPlacementSlot locale={locale} placement="service_detail" />
      </div>
      {/* Desktop: the same slides, in the home page's sponsored showcase */}
      <div className="lsd hidden pb-14 pt-4 xl:block">
        <DesktopSponsoredSection locale={locale} placement="service_detail" />
      </div>
      {/* Platform FAQ (admin → Editorial); the provider's own service FAQ renders inside the views. */}
      <PageFaq target={{ scope: "service", entityId: id }} locale={locale} pageUrl={canonicalUrl} />
    </>
  );
}
