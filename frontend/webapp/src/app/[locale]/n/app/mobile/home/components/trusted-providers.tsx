import { BadgeCheck, Star } from 'lucide-react';

import { ImageWithFallback } from '@/components/ui/image-with-fallback';

import type { HomeTrustedProvider } from '@/features/home/api/server/get-home-page';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';
import { HomeLexicalDescription } from '@/features/home/components/home-lexical-description';
import { Link } from '@/i18n/navigation';

// 'rail' is the horizontal home carousel (fixed-width cards); 'grid' is the
// full listing page, where cards stretch to the column and share one height.
export type HomeTrustedProviderVariant = 'rail' | 'grid';

export type HomeTrustedProviderLabels = {
  emptyTitle: string;
  emptyDescription: string;
  noDescription: string;
};

const defaultLabels: HomeTrustedProviderLabels = {
  emptyTitle: 'No trusted providers yet',
  emptyDescription: 'Verified and highly rated providers will appear here.',
  noDescription: 'No description available.',
};

export default function HomeTrustedProvidersSuspenseBoundary({
  providers,
  locale = 'fa-IR',
  labels = defaultLabels,
  variant = 'rail',
}: {
  providers: HomeTrustedProvider[];
  locale?: string;
  labels?: HomeTrustedProviderLabels;
  variant?: HomeTrustedProviderVariant;
}) {
  if (!providers.length) {
    return (
      <div className="col-span-full w-full rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-gray-900">{labels.emptyTitle}</p>
        <p className="mt-1 text-xs text-gray-500">{labels.emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      {providers.map((provider) => (
        <TrustedProviderCard key={provider.id} provider={provider} locale={locale} labels={labels} variant={variant} />
      ))}
    </>
  );
}

function TrustedProviderCard({
  provider,
  locale,
  labels,
  variant = 'rail',
}: {
  provider: HomeTrustedProvider;
  locale: string;
  labels: HomeTrustedProviderLabels;
  variant?: HomeTrustedProviderVariant;
}) {
  const mediaUrl = resolveHomeMediaUrl(provider.imageUrl);
  const isGrid = variant === 'grid';
  // In the grid the cards share a row height, so the tag row has to be bounded
  // or one chatty provider stretches every card on the page.
  const specialties = isGrid ? provider.specialties.slice(0, 2) : provider.specialties;

  return (
    <Link
      href={`/n/app/mobile/provider/${provider.id}`}
      className={`cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-md transition-all hover:shadow-xl active:scale-[0.98] ${
        isGrid ? 'flex h-full w-full flex-col' : 'w-44 flex-none'
      }`}
    >
      <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-gray-100">
        {mediaUrl ? (
          <ImageWithFallback
            fill
            src={mediaUrl}
            alt={provider.name}
            sizes={isGrid ? '(min-width: 640px) 240px, 45vw' : '176px'}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#083f30] to-[#0f6b56] text-xs font-semibold text-white/80">
            LSevin
          </div>
        )}

        {provider.verified ? (
          <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#083f30] shadow-lg">
            <BadgeCheck size={18} className="text-[#eacb7f]" />
          </div>
        ) : null}
      </div>

      <h3
        className={`mb-1 line-clamp-2 text-sm font-bold leading-tight text-gray-900 ${isGrid ? 'min-h-[2.2rem]' : ''}`}
      >
        {provider.name}
      </h3>
      {/* The lexical renderer emits one block per paragraph, so a wrapper
          `line-clamp-2` alone does not hold a multi-paragraph description. In the
          grid the box is pinned to exactly two `text-xs` lines (h-8) and only the
          first block is shown, so every card reserves the same space. */}
      <HomeLexicalDescription
        content={provider.description}
        className={
          isGrid
            ? 'mb-1 h-8 overflow-hidden text-xs text-gray-500 [&>*:first-child]:line-clamp-2 [&>*:not(:first-child)]:hidden [&_p]:line-clamp-2'
            : 'mb-1 line-clamp-2 text-xs text-gray-500 [&_p]:line-clamp-2'
        }
        fallback={labels.noDescription}
      />
      <p className="mb-2 line-clamp-1 text-xs text-gray-500">{provider.location}</p>

      {specialties.length ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {specialties.map((specialty) => (
            <span key={specialty} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              {specialty}
            </span>
          ))}
        </div>
      ) : null}

      <div className={`flex items-center gap-1 ${isGrid ? 'mt-auto' : ''}`}>
        <Star size={14} className="fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-bold text-gray-900">{provider.rating.toFixed(1)}</span>
        <span className="ml-0.5 text-xs text-gray-500">({provider.reviewCount.toLocaleString(locale)})</span>
      </div>
    </Link>
  );
}
