import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { getServicePageByIdCached } from '@/features/service-providers/server/service-page.repository.cached';
import { listActiveServicePageIds } from '@/features/service-providers/server/service-page.repository';

import { alternatesFor } from '@/lib/seo/alternates';
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
    return { title: 'Service', alternates: alternatesFor(locale, `/n/app/mobile/service/${id}`) };
  }

  const title = service.clinic ? `${service.name} — ${service.clinic}` : service.name;
  const description = (service.subtitle || service.definitionDescription || service.providerDescription || '').slice(0, 300);

  return {
    title,
    description: description || undefined,
    alternates: alternatesFor(locale, `/n/app/mobile/service/${id}`),
    openGraph: {
      title,
      description: description || undefined,
      type: 'website',
      images: service.images?.[0] ? [{ url: service.images[0] }] : undefined,
    },
  };
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
      <SponsoredPlacementSlot locale={locale} placement="service_detail" />
    </>
  );
}
