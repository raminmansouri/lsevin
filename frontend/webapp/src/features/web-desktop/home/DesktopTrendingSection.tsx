import { getTranslations } from "next-intl/server";

import { FavoriteButton } from "@/features/favorites/components/favorite-button";
import type { HomeTrendingService } from "@/features/home/api/server/get-home-page";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";

import { DesktopTrendingChart, type TrendingItem } from "./DesktopTrendingChart";

export async function DesktopTrendingSection({ locale, services }: { locale: string; services: HomeTrendingService[] }) {
  if (!services.length) return null;
  const t = await getTranslations({ locale, namespace: "Home" });

  const items: TrendingItem[] = services.map((service) => ({
    id: service.id,
    href: `/n/app/mobile/service/${service.id}`,
    title: service.displayName,
    imageSrc: resolveHomeMediaUrl(service.imageUrl) ?? null,
    bookingCount: service.bookingCount,
    bookingsText: t("trending.bookings", { count: service.bookingLabel }),
    growth: service.growthLabel,
  }));

  return (
    <DesktopTrendingChart
      items={items}
      title={t("trending.title")}
      subtitle={t("trending.subtitle")}
      favorite={
        <FavoriteButton
          entityId={services[0].id}
          entityType="service"
          initialIsFavorite={false}
          className="!h-11 !w-11 bg-white/15 text-white backdrop-blur-md hover:bg-white/25"
          iconClassName="h-5 w-5"
        />
      }
    />
  );
}