import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { getSpecialistPageFromDbCached } from "@/features/service-providers/server/specialist-page.repository.cached";
import { listActiveSpecialistPageIds } from "@/features/service-providers/server/specialist-page.repository";

import { alternatesFor } from "@/lib/seo/alternates";
import SpecialistProfileClient from "./specialist-page";

type Awaitable<T> = T | Promise<T>;

type PageProps = {
  params: Awaitable<{ locale: string; id: string }>;
};

// Static / ISR. No visitor context (default currency, favourite state resolved
// client-side by the interactive view). `generateStaticParams` prewarms active
// specialists; anything else is ISR'd on first hit.
export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const ids = await listActiveSpecialistPageIds(400);
    return ids.map((id) => ({ id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Pick<PageProps, "params">) {
    const { locale, id } = await params;

    const data = await getSpecialistPageFromDbCached({
        specialistId: id,
        locale,
    }).catch(() => null);

    const specialist = data?.specialist;

    if (!specialist) {
        return {
            title: "Specialist",
            alternates: alternatesFor(
                locale,
                `/n/app/mobile/specialist/${id}`
            ),
        };
    }

    // English default
    let title = specialist.title
        ? `${specialist.name} | ${specialist.title} | LSevin`
        : `${specialist.name} | Medical Specialist | LSevin`;

    let description =
        `Find information about ${specialist.name}. ` +
        `View specialty, professional profile and medical services on LSevin.`;

    switch (locale) {
        case "fa":
            title = specialist.title
                ? `${specialist.name} | ${specialist.title} | LSevin`
                : `${specialist.name} | متخصص پزشکی | LSevin`;

            description =
                `اطلاعات ${specialist.name} در LSevin. ` +
                `تخصص، سوابق حرفه‌ای و خدمات پزشکی ارائه‌شده را مشاهده کنید.`;
            break;

        case "ar":
            title = specialist.title
                ? `${specialist.name} | ${specialist.title} | LSevin`
                : `${specialist.name} | أخصائي طبي | LSevin`;

            description =
                `تعرف على ${specialist.name}. ` +
                `شاهد التخصص، الملف المهني والخدمات الطبية عبر LSevin.`;
            break;

        case "tr":
            title = specialist.title
                ? `${specialist.name} | ${specialist.title} | LSevin`
                : `${specialist.name} | Sağlık Uzmanı | LSevin`;

            description =
                `${specialist.name} hakkında bilgi alın. ` +
                `Uzmanlık alanı, profesyonel profil ve sağlık hizmetlerini LSevin üzerinden inceleyin.`;
            break;

        case "ru":
            title = specialist.title
                ? `${specialist.name} | ${specialist.title} | LSevin`
                : `${specialist.name} | Медицинский специалист | LSevin`;

            description =
                `Узнайте больше о ${specialist.name}. ` +
                `Посмотрите специальность, профессиональный профиль и медицинские услуги на LSevin.`;
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
            `/n/app/mobile/specialist/${id}`
        ),
        openGraph: {
            title,
            description,
            type: "profile",
            images: specialist.image
                ? [{ url: specialist.image }]
                : undefined,
        },
    };
}

export default async function SpecialistPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const data = await getSpecialistPageFromDbCached({ specialistId: id, locale }).catch(() => null);

  if (!data) notFound();

  return <SpecialistProfileClient data={data} specialistId={id} locale={locale} />;
}
