import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { getServicePageByIdCached } from '@/features/service-providers/server/service-page.repository.cached';
import { listActiveServicePageIds } from '@/features/service-providers/server/service-page.repository';

import { buildPublicMetadata } from "@/lib/seo/metadata";
import { isFastBuild } from "@/lib/build-mode";
import { SponsoredPlacementSlot } from '@/features/sponsered-slider/components/sponsored-placement-slot';

import ServicePage from './service-page';

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
export const dynamic = 'force-static';
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

export async function generateMetadata({ params }: Pick<ServicePageRouteProps, 'params'>) {
  const { locale, id } = await params;
  const data = await getServicePageByIdCached({ serviceId: id, locale }).catch(() => null);
  const service = data?.service;

  if (!service) {
    return buildPublicMetadata({ locale, path: `/n/app/mobile/service/${encodeURIComponent(id)}` });
  }

  return buildPublicMetadata({
    locale,
    path: `/n/app/mobile/service/${encodeURIComponent(id)}`,
    title: service.clinic ? `${service.name} ? ${service.clinic}` : service.name,
    descriptions: [service.subtitle, service.definitionDescription, service.providerDescription],
    image: service.images?.[0],
    type: "website",
  });
}

export default async function TreatmentDetailPage({ params }: ServicePageRouteProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const data = await getServicePageByIdCached({ serviceId: id, locale }).catch(() => null);

  if (!data) {
    notFound();
  }

  return (
    <>
      <ServicePage data={data} serviceId={id} locale={locale} />
      <div className="pb-36">
        <SponsoredPlacementSlot locale={locale} placement="service_detail" />
      </div>
    </>
  );
}
