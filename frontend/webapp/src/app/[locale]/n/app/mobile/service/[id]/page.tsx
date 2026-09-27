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

    const data = await getServicePageByIdCached({
        serviceId: id,
        locale,
    }).catch(() => null);

    const service = data?.service;

    if (!service) {
        return {
            title: "Service",
            alternates: alternatesFor(locale, `/n/app/mobile/service/${id}`),
        };
    }

    let title = service.clinic
        ? `${service.name} | ${service.clinic} | LSevin`
        : `${service.name} | Medical Service | LSevin`;

    let description =
        `Find information about ${service.name}. ` +
        `View treatment details, providers, clinics and medical service information on LSevin.`;

    switch (locale) {
        case "fa":
            title = service.clinic
                ? `${service.name} | ${service.clinic} | LSevin`
                : `${service.name} | خدمات پزشکی | LSevin`;

            description =
                `${service.name} در ${service.clinic || "LSevin"}. ` +
                `اطلاعات خدمات، مراکز ارائه‌دهنده، جزئیات درمان و راه‌های ارتباطی را در LSevin مشاهده کنید.`;
            break;

        case "ar":
            title = service.clinic
                ? `${service.name} | ${service.clinic} | LSevin`
                : `${service.name} | خدمة طبية | LSevin`;

            description =
                `تعرف على ${service.name}. ` +
                `شاهد تفاصيل الخدمة الطبية، المراكز والأطباء ومعلومات التواصل عبر LSevin.`;
            break;

        case "tr":
            title = service.clinic
                ? `${service.name} | ${service.clinic} | LSevin`
                : `${service.name} | Sağlık Hizmeti | LSevin`;

            description =
                `${service.name} hakkında bilgi alın. ` +
                `Tedavi detayları, sağlık merkezleri ve hizmet bilgilerini LSevin üzerinden inceleyin.`;
            break;

        case "ru":
            title = service.clinic
                ? `${service.name} | ${service.clinic} | LSevin`
                : `${service.name} | Медицинская услуга | LSevin`;

            description =
                `Узнайте больше о ${service.name}. ` +
                `Просмотрите информацию об услуге, медицинских центрах и специалистах на LSevin.`;
            break;

        case "en":
        default:
            // English
            break;
    }
    description = description.slice(0, 300);

    return {
        title,
        description,
        alternates: alternatesFor(
            locale,
            `/n/app/mobile/service/${id}`
        ),
        openGraph: {
            title,
            description,
            type: "website",
            images: service.images?.[0]
                ? [{ url: service.images[0] }]
                : undefined,
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
