import { setRequestLocale } from "next-intl/server";

import { getProviderPageDataFromDbCached } from "@/features/service-providers/server/provider-page.repository.cached";
import { listActiveProviderPageIds } from "@/features/service-providers/server/provider-page.repository";

import { alternatesFor } from "@/lib/seo/alternates";
import { SponsoredPlacementSlot } from "@/features/sponsered-slider/components/sponsored-placement-slot";

import { ProviderDetailView } from "./provider-detail-view";

type RouteParams = { locale: string; id: string };
type PageProps = {
  params: Promise<RouteParams> | RouteParams;
};

// Static / ISR. The server shell fetches the page data in the default currency
// with no visitor context and hands it to the interactive client view as
// `initialData`; the view owns the favourite toggle and any currency the
// visitor picked. `generateStaticParams` prewarms active providers.
export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const ids = await listActiveProviderPageIds(400);
    return ids.map((id) => ({ id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps) {
    const { locale, id } = await params;

    const result = await getProviderPageDataFromDbCached({
        providerId: id,
        locale,
    }).catch(() => null);

    const provider = result?.data?.provider;

    if (!provider) {
        return {
            title: "Provider",
            alternates: alternatesFor(locale, `/n/app/mobile/provider/${id}`),
        };
    }

    // English default / fallback
    let title = provider.city
        ? `${provider.name} | ${provider.city} | LSevin`
        : `${provider.name} | Medical Provider | LSevin`;

    let description =
        `Find information about ${provider.name}. ` +
        `View medical services, specialists, location and contact information on LSevin.`;


    switch (locale) {
        case "fa":
            title = provider.city
                ? `${provider.name} | ${provider.city} | LSevin`
                : `${provider.name} | خدمات پزشکی | LSevin`;

            description =
                `${provider.name} در ${provider.city || "LSevin"}. ` +
                `اطلاعات خدمات، پزشکان، موقعیت مکانی و راه‌های ارتباطی را در LSevin مشاهده کنید.`;
            break;


        case "ar":
            title = provider.city
                ? `${provider.name} | ${provider.city} | LSevin`
                : `${provider.name} | خدمات طبية | LSevin`;

            description =
                `تعرف على ${provider.name} في ${provider.city || ""}. ` +
                `شاهد الخدمات الطبية، الأطباء، الموقع ومعلومات التواصل عبر LSevin.`;
            break;


        case "tr":
            title = provider.city
                ? `${provider.name} | ${provider.city} | LSevin`
                : `${provider.name} | Sağlık Hizmetleri | LSevin`;

            description =
                `${provider.name} hakkında bilgi alın. ` +
                `Sağlık hizmetleri, uzmanlar, konum ve iletişim bilgilerini LSevin üzerinden keşfedin.`;
            break;


        case "ru":
            title = provider.city
                ? `${provider.name} | ${provider.city} | LSevin`
                : `${provider.name} | Медицинские услуги | LSevin`;

            description =
                `Узнайте больше о ${provider.name}. ` +
                `Просмотрите медицинские услуги, специалистов, расположение и контакты на LSevin.`;
            break;


        case "en":
        default:
            // English fallback is already set above
            break;
    }

    description = description.slice(0, 300);

    return {
        title,
        description,

        alternates: alternatesFor(
            locale,
            `/n/app/mobile/provider/${id}`
        ),

        openGraph: {
            title,
            description,
            type: "website",
        },
    };
}

export default async function ProviderDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const result = await getProviderPageDataFromDbCached({ providerId: id, locale }).catch(
    () => ({ data: undefined, error: undefined }) as Awaited<ReturnType<typeof getProviderPageDataFromDbCached>>,
  );

  return (
    <>
      <ProviderDetailView initialData={result?.data ?? undefined} />
      <SponsoredPlacementSlot locale={locale} placement="provider_detail" />
    </>
  );
}
