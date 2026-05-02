import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getUserId } from '@/lib/auth/session';
import { getServicePageByIdFromDb } from '@/features/service-providers/server/service-page.repository';

import ServicePage from './service-page';

type ServiceRouteParams = {
  locale: string;
  id: string;
};

type ServicePageRouteProps = {
  params: Promise<ServiceRouteParams> | ServiceRouteParams;
  searchParams?: Promise<{ currency?: string; country?: string; browserCountry?: string }> | { currency?: string; country?: string; browserCountry?: string };
};

async function getOptionalUserId() {
  try {
    return (await getUserId()) || null;
  } catch {
    return null;
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

export default async function TreatmentDetailPage({ params, searchParams }: ServicePageRouteProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const userId = await getOptionalUserId();

  const data = await getServicePageByIdFromDb({
    serviceId: id,
    locale,
    userId,
    preferredCurrencyCode: resolvedSearchParams.currency,
    selectedCountryCode: resolvedSearchParams.country,
    browserCountryCode: resolvedSearchParams.browserCountry,
  });

  if (!data) {
    notFound();
  }

  return <ServicePage data={data} serviceId={id} locale={locale} />;
}
