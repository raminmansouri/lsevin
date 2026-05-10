import { BadgeCheck, Heart, Star } from 'lucide-react';

import { ImageWithFallback } from '@/components/ui/image-with-fallback';

import type { HomeFeaturedService } from '@/features/home/api/server/get-home-page';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';
import { SafePriceText } from '@/features/home/components/safe-price-text';
import { HomeLexicalDescription } from '@/features/home/components/home-lexical-description';
import { formatMoney } from '@/features/finance/lib/money';
import { Link } from '@/i18n/navigation';

export type HomeFeaturedServiceLabels = {
  emptyTitle: string;
  emptyDescription: string;
  discountOff: string;
  availableDestination: string;
  noDescription: string;
};

const defaultLabels: HomeFeaturedServiceLabels = {
  emptyTitle: 'No featured services yet',
  emptyDescription: 'Mark provider services as popular or add offers to feature them here.',
  discountOff: '{percent}% OFF',
  availableDestination: 'Available destination',
  noDescription: 'No description available.',
};

function formatLabel(template: string, replacements: Record<string, string | number>) {
  return Object.entries(replacements).reduce(
    (value, [key, replacement]) => value.replaceAll(`{${key}}`, String(replacement)),
    template
  );
}

export default function HomeFeaturedServicesSuspenseBoundary({
  services,
  locale,
  selectedCountryCode,
  labels = defaultLabels,
}: {
  services: HomeFeaturedService[];
  locale: string;
  selectedCountryCode?: string | null;
  labels?: HomeFeaturedServiceLabels;
}) {
  if (!services.length) {
    return (
      <div className="w-full rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-gray-900">{labels.emptyTitle}</p>
        <p className="mt-1 text-xs text-gray-500">{labels.emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      {services.map((service) => (
        <FeaturedServiceCard
          key={service.id}
          service={service}
          locale={locale}
          selectedCountryCode={selectedCountryCode}
          labels={labels}
        />
      ))}
    </>
  );
}

function FeaturedServiceCard({
  service,
  locale,
  selectedCountryCode,
  labels,
}: {
  service: HomeFeaturedService;
  locale: string;
  selectedCountryCode?: string | null;
  labels: HomeFeaturedServiceLabels;
}) {
  const mediaUrl = resolveHomeMediaUrl(service.imageUrl);

  return (
    <Link
      href={`/n/app/mobile/service/${service.id}`}
      className="flex-none w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-all hover:shadow-xl active:scale-[0.99]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        {mediaUrl ? (
          <ImageWithFallback
            fill
            src={mediaUrl}
            alt={service.displayName}
            sizes="320px"
            className="object-cover transition duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#083f30] to-[#0f6b56] text-sm font-semibold text-white/80">
            LSevin
          </div>
        )}

        {service.discountPercent ? (
          <div className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            {formatLabel(labels.discountOff, { percent: Math.round(service.discountPercent) })}
          </div>
        ) : null}

        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm backdrop-blur-sm">
          <Heart size={18} />
        </span>

        {service.badges.length ? (
          <div className="absolute bottom-3 left-3 flex max-w-[90%] gap-1.5 overflow-hidden">
            {service.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-lg bg-white/95 px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm backdrop-blur-sm"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <h3 className="mb-1 line-clamp-1 text-base font-bold text-gray-900">{service.displayName}</h3>
        <HomeLexicalDescription
          content={service.description}
          className="mb-3 line-clamp-1 text-sm text-gray-600 [&_p]:line-clamp-1"
          fallback={labels.noDescription}
        />

        <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <BadgeCheck size={16} className="text-[#083f30]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="line-clamp-1 text-sm font-semibold text-gray-900">{service.providerName}</div>
            <div className="line-clamp-1 text-xs text-gray-500">{service.location || labels.availableDestination}</div>
          </div>
        </div>

        {service.features.length ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {service.features.map((feature) => (
              <span key={feature} className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                {feature}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <Star size={16} className="fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-gray-900">{service.rating.toFixed(1)}</span>
            <span className="truncate text-sm text-gray-500">({service.reviewCount.toLocaleString(locale)})</span>
          </div>

          <div className="text-right">
            {service.originalAmount && service.originalAmount > service.priceAmount ? (
              <div className="text-xs text-gray-400 line-through">
                {formatMoney(
                  { amount: service.originalAmount, currencyCode: service.currencyCode },
                  { locale, compact: false }
                )}
              </div>
            ) : null}
            <SafePriceText
              amount={service.priceAmount}
              sourceCurrencyCode={service.currencyCode}
              selectedCountryCode={selectedCountryCode}
              locale={locale}
              className="text-lg font-bold text-[#083f30]"
              showSourceWhenConverted
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
