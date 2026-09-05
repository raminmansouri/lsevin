import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getServicePageByIdCached } from '@/features/service-providers/server/service-page.repository.cached';
import { listActiveServicePageIds } from '@/features/service-providers/server/service-page.repository';

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
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ServicePage' });

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
  };
}

export default async function TreatmentDetailPage({ params }: ServicePageRouteProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const data = await getServicePageByIdCached({ serviceId: id, locale }).catch(() => null);

  if (!data) {
    notFound();
  }

  return <ServicePage data={data} serviceId={id} locale={locale} />;
}
