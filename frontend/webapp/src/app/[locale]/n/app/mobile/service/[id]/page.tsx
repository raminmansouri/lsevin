import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

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
  serviceUrl,
} from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { getIndexableLocales } from "@/lib/seo/locale-eligibility";
import { buildPublicMetadata } from "@/lib/seo/metadata";

import ServicePage from "./service-page";

type ServiceRouteParams = {
  locale: string;
  id: string;
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
    return ids.map((id) => ({ id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: Pick<ServicePageRouteProps, "params">) {
  const { locale, id } = await params;
  const data = await getServicePageByIdCached({ serviceId: id, locale });
  const service = data?.service;

  if (!service) {
    notFound();
  }

  return buildPublicMetadata({
    locale,
    path: `/n/app/mobile/service/${encodeURIComponent(id)}`,
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
  const { locale, id } = await params;
  setRequestLocale(locale);

  const data = await getServicePageByIdCached({ serviceId: id, locale });

  if (!data) {
    notFound();
  }

  const { service } = data;
  const brand = (await getTranslations({ locale, namespace: "LocaleLayout" }))("title");

  return (
    <>
      {service ? (
        <JsonLd
          data={graph(
            serviceSchema({
              locale,
              id,
              name: service.name,
              description: service.subtitle || service.definitionDescription,
              category: service.categoryName,
              image: service.images?.[0],
              providerId: service.clinicId,
              providerName: service.clinic,
              city: service.city,
              country: service.country,
            }),
            breadcrumbList([
              { name: brand, url: absoluteUrl(locale, "/n/app/mobile/home") },
              ...(service.clinicId && service.clinic
                ? [{ name: service.clinic, url: providerUrl(locale, service.clinicId) }]
                : []),
              { name: service.name, url: serviceUrl(locale, id) },
            ])
          )}
        />
      ) : null}
      <ServicePage data={data} serviceId={id} locale={locale} />
      <div className="pb-36">
        <SponsoredPlacementSlot locale={locale} placement="service_detail" />
      </div>
    </>
  );
}
