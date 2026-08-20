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

/**
 * Where the card is being rendered, which is the only thing that decides its width.
 *
 * `rail` — the home page's horizontal scroller. The card must not shrink and must
 * be narrower than the viewport so the next one peeks in and the row reads as
 * swipeable. On a 375px phone the old flat `w-80` left a 15px sliver, which looks
 * like a layout mistake rather than an invitation to swipe.
 *
 * `grid` — the /featured page. The card fills its column, so the column count (not
 * the card) decides the width and the layout actually responds. The old `w-80` here
 * pinned every card to 320px: it overflowed phones under 360px, left dead space in
 * every column above that, and made the responsive `grid-cols-*` purely decorative.
 *
 * Density is NOT decided here. The card is a `@container` and sizes its own type,
 * padding and controls off its own width via `@min-[220px]:` — because the two
 * layouts are different widths at the same viewport (on a 375px phone the rail card
 * is ~293px but a two-up grid column is ~165px), and a viewport media query cannot
 * tell those apart. Below 220px the card renders compact; at or above it, full size.
 */
type FeaturedServiceLayout = 'rail' | 'grid';

const layoutStyles: Record<FeaturedServiceLayout, { card: string; sizes: string }> = {
  rail: {
    card: 'w-[78vw] max-w-[20rem] flex-none',
    sizes: '(max-width: 420px) 78vw, 320px',
  },
  grid: {
    card: 'w-full',
    // Two-up on phones, so a card is roughly half the viewport there.
    sizes: '(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 320px',
  },
};

const defaultLabels: HomeFeaturedServiceLabels = {
  emptyTitle: 'No featured services yet',
  emptyDescription: 'Tick “Featured” on a provider service in the admin panel to show it here.',
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
  layout = 'rail',
}: {
  services: HomeFeaturedService[];
  locale: string;
  selectedCountryCode?: string | null;
  labels?: HomeFeaturedServiceLabels;
  layout?: FeaturedServiceLayout;
}) {
  if (!services.length) {
    return (
      // col-span-full so the empty state spans the whole grid instead of sitting in
      // the first column with three empty ones beside it. It is inert in the rail,
      // which is a flex row and has no columns to span.
      <div className="col-span-full w-full rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
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
          layout={layout}
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
  layout,
}: {
  service: HomeFeaturedService;
  locale: string;
  selectedCountryCode?: string | null;
  labels: HomeFeaturedServiceLabels;
  layout: FeaturedServiceLayout;
}) {
  const mediaUrl = resolveHomeMediaUrl(service.imageUrl);
  const styles = layoutStyles[layout];

  return (
    <Link
      href={`/n/app/mobile/service/${service.id}`}
      className={`@container flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md transition-all hover:shadow-xl active:scale-[0.99] @min-[220px]:rounded-2xl ${styles.card}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-50">
        {mediaUrl ? (
          <ImageWithFallback
            fill
            src={mediaUrl}
            alt={service.displayName}
            sizes={styles.sizes}
            className="object-contain transition duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#083f30] to-[#0f6b56] text-sm font-semibold text-white/80">
            LSevin
          </div>
        )}

        {/* start/end, not left/right: fa, ar and ku render this card in RTL, where a
            hard-coded left badge lands under the heart button. */}
        {service.discountPercent ? (
          <div className="absolute start-1.5 top-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-lg @min-[220px]:start-3 @min-[220px]:top-3 @min-[220px]:px-3 @min-[220px]:py-1 @min-[220px]:text-xs">
            {formatLabel(labels.discountOff, { percent: Math.round(service.discountPercent) })}
          </div>
        ) : null}

        <span className="absolute end-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm backdrop-blur-sm @min-[220px]:end-3 @min-[220px]:top-3 @min-[220px]:h-9 @min-[220px]:w-9">
          <Heart className="h-3.5 w-3.5 @min-[220px]:h-[18px] @min-[220px]:w-[18px]" />
        </span>

        {/* Only the first badge survives a 165px column — three of them stacked in a
            two-up grid buried the image. The rest come back at full width. */}
        {service.badges.length ? (
          <div className="absolute bottom-1.5 start-1.5 flex max-w-[92%] flex-wrap gap-1 overflow-hidden @min-[220px]:bottom-3 @min-[220px]:start-3 @min-[220px]:gap-1.5">
            {service.badges.map((badge, index) => (
              <span
                key={badge}
                className={`rounded-md bg-white/95 px-1.5 py-0.5 text-[9px] font-semibold text-gray-900 shadow-sm backdrop-blur-sm @min-[220px]:rounded-lg @min-[220px]:px-2 @min-[220px]:py-1 @min-[220px]:text-xs ${
                  index === 0 ? '' : 'hidden @min-[220px]:inline-block'
                }`}
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* flex-1 + mt-auto on the price row: in the grid the cards in a row are the
          same height, so the prices line up instead of floating at whatever height
          each description happened to end. */}
      <div className="flex flex-1 flex-col p-2.5 @min-[220px]:p-4">
        <h3 className="mb-1 line-clamp-2 text-xs font-bold text-gray-900 @min-[220px]:line-clamp-1 @min-[220px]:text-base">
          {service.displayName}
        </h3>
        <HomeLexicalDescription
          content={service.description}
          className="mb-2 line-clamp-1 text-[10px] text-gray-600 [&_p]:line-clamp-1 @min-[220px]:mb-3 @min-[220px]:text-sm"
          fallback={labels.noDescription}
        />

        <div className="mb-2 flex items-center gap-1.5 border-b border-gray-100 pb-2 @min-[220px]:mb-3 @min-[220px]:gap-2 @min-[220px]:pb-3">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 @min-[220px]:h-8 @min-[220px]:w-8">
            <BadgeCheck className="h-3 w-3 text-[#083f30] @min-[220px]:h-4 @min-[220px]:w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="line-clamp-1 text-[10px] font-semibold text-gray-900 @min-[220px]:text-sm">
              {service.providerName}
            </div>
            <div className="line-clamp-1 text-[9px] text-gray-500 @min-[220px]:text-xs">
              {service.location || labels.availableDestination}
            </div>
          </div>
        </div>

        {/* Feature chips are the first thing to go in a narrow column: three of them
            wrap to three lines at 165px and push the price off the card. */}
        {service.features.length ? (
          <div className="mb-3 hidden flex-wrap gap-1.5 @min-[220px]:flex">
            {service.features.map((feature) => (
              <span key={feature} className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                {feature}
              </span>
            ))}
          </div>
        ) : null}

        {/* Wraps rather than truncates: a rial price runs to ten digits, and squeezing
            it onto one line with the rating turned the amount into an ellipsis on
            narrow phones. */}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-1 @min-[220px]:gap-x-3 @min-[220px]:gap-y-1.5">
          <div className="flex min-w-0 items-center gap-1 @min-[220px]:gap-1.5">
            <Star className="h-3 w-3 shrink-0 fill-yellow-400 text-yellow-400 @min-[220px]:h-4 @min-[220px]:w-4" />
            <span className="text-[11px] font-bold text-gray-900 @min-[220px]:text-base">
              {service.rating.toFixed(1)}
            </span>
            <span className="truncate text-[10px] text-gray-500 @min-[220px]:text-sm">
              ({service.reviewCount.toLocaleString(locale)})
            </span>
          </div>

          <div className="min-w-0 text-end">
            {service.originalAmount && service.originalAmount > service.priceAmount ? (
              <div className="truncate text-[9px] text-gray-400 line-through @min-[220px]:text-xs">
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
              className="block truncate text-[11px] font-bold text-[#083f30] @min-[220px]:text-lg"
              showSourceWhenConverted
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
