import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { FavoriteButton } from "@/features/favorites/components/favorite-button";
import { formatMoney } from "@/features/finance/lib/money";
import type { HomeFeaturedService } from "@/features/home/api/server/get-home-page";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { SafePriceText } from "@/features/home/components/safe-price-text";
import { Link } from "@/i18n/navigation";

import { Reveal, Tilt } from "../components/motion";
import { DesktopSignatureCollection, type SignatureItem } from "./DesktopSignatureCollection";

const SPOTLIGHT = 8;

/** Featured services: the first five in the cinematic gallery, the rest as compact cards below. */
export async function DesktopFeaturedServices({
  locale,
  services,
  selectedCountryCode,
}: {
  locale: string;
  services: HomeFeaturedService[];
  selectedCountryCode?: string;
}) {
  if (!services.length) return null;
  const t = await getTranslations({ locale, namespace: "Home" });
  const tCarousel = await getTranslations({ locale, namespace: "Home.sponsoredCarousel" });

  const href = (service: HomeFeaturedService) => `/n/app/mobile/service/${service.id}`;
  const originalPrice = (service: HomeFeaturedService) =>
    service.originalAmount && service.originalAmount > service.priceAmount
      ? formatMoney({ amount: service.originalAmount, currencyCode: service.currencyCode }, { locale, compact: false })
      : null;

  const items: SignatureItem[] = services.slice(0, SPOTLIGHT).map((service) => ({
    id: service.id,
    href: href(service),
    title: service.displayName,
    provider: service.providerName,
    location: service.location,
    rating: service.rating,
    reviewCount: service.reviewCount,
    imageSrc: resolveHomeMediaUrl(service.imageUrl) ?? null,
    badge: service.badges[0] ?? null,
    discountLabel: service.discountPercent
      ? t("featured.discountOff", { percent: Math.round(service.discountPercent) })
      : null,
    originalPrice: originalPrice(service),
    price: (
      <SafePriceText
        amount={service.priceAmount}
        sourceCurrencyCode={service.currencyCode}
        selectedCountryCode={selectedCountryCode}
        locale={locale}
        className="block text-3xl font-black text-[#eacb7f]"
        showSourceWhenConverted
      />
    ),
    favorite: (
      <FavoriteButton
        entityId={service.id}
        entityType="service"
        initialIsFavorite={false}
        className="!h-11 !w-11 bg-white/15 text-white backdrop-blur-md hover:bg-white/25"
        iconClassName="h-5 w-5"
      />
    ),
  }));

  const rest = services.slice(SPOTLIGHT);

  return (
    <>
      <DesktopSignatureCollection
        items={items}
        title={t("featured.title")}
        subtitle={t("featured.subtitle")}
        seeAll={t("common.seeAll")}
        seeAllHref="/n/app/mobile/featured"
        labels={{ previous: tCarousel("previousSlideAria"), next: tCarousel("nextSlideAria") }}
      />

      {rest.length ? (
        <section className="lsd-container -mt-10 pb-20">
          <div className="grid grid-cols-3 gap-6">
            {rest.map((service, index) => {
              const image = resolveHomeMediaUrl(service.imageUrl);
              const before = originalPrice(service);
              return (
                <Reveal key={service.id} delay={index * 90}>
                  <Link href={href(service)} className="group block">
                    <Tilt className="flex h-40 items-center gap-5 p-4">
                      <div className="relative h-full w-36 shrink-0 overflow-hidden rounded-2xl bg-[#0f5a45]">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image} alt={service.displayName} className="lsd-zoom h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center">
                            <Image src="/brand/lsevin-mark-reversed.png" alt="" width={44} height={62} className="opacity-50" />
                          </div>
                        )}
                        {service.discountPercent ? (
                          <span className="absolute start-2 top-2 rounded-full bg-[#eacb7f] px-2 py-0.5 text-[11px] font-black text-[#062a20]">
                            {t("featured.discountOff", { percent: Math.round(service.discountPercent) })}
                          </span>
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-bold text-[#0e1a16]">{service.displayName}</p>
                        <p className="mt-1 truncate text-sm text-[#56675f]">{service.providerName}</p>
                        <div className="mt-3">
                          {before ? <span className="block text-xs text-[#8fa79d] line-through">{before}</span> : null}
                          <SafePriceText
                            amount={service.priceAmount}
                            sourceCurrencyCode={service.currencyCode}
                            selectedCountryCode={selectedCountryCode}
                            locale={locale}
                            className="block truncate text-lg font-black text-[#083f30]"
                            showSourceWhenConverted
                          />
                        </div>
                      </div>
                    </Tilt>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}