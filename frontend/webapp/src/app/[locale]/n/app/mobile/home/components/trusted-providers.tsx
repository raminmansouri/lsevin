import { BadgeCheck, Star } from 'lucide-react';

import { ImageWithFallback } from '@/components/ui/image-with-fallback';

import type { HomeTrustedProvider } from '@/features/home/api/server/get-home-page';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';
import { HomeLexicalDescription } from '@/features/home/components/home-lexical-description';
import { Link } from '@/i18n/navigation';

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
  locale = 'en-US',
  labels = defaultLabels,
}: {
  providers: HomeTrustedProvider[];
  locale?: string;
  labels?: HomeTrustedProviderLabels;
}) {
  if (!providers.length) {
    return (
      <div className="w-full rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-gray-900">{labels.emptyTitle}</p>
        <p className="mt-1 text-xs text-gray-500">{labels.emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      {providers.map((provider) => (
        <TrustedProviderCard key={provider.id} provider={provider} locale={locale} labels={labels} />
      ))}
    </>
  );
}

function TrustedProviderCard({
  provider,
  locale,
  labels,
}: {
  provider: HomeTrustedProvider;
  locale: string;
  labels: HomeTrustedProviderLabels;
}) {
  const mediaUrl = resolveHomeMediaUrl(provider.imageUrl);

  return (
    <Link
      href={`/n/app/mobile/provider/${provider.id}`}
      className="flex-none w-44 cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-md transition-all hover:shadow-xl active:scale-[0.98]"
    >
      <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-gray-100">
        {mediaUrl ? (
          <ImageWithFallback fill src={mediaUrl} alt={provider.name} sizes="176px" className="object-cover" />
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

      <h3 className="mb-1 line-clamp-2 text-sm font-bold leading-tight text-gray-900">{provider.name}</h3>
      <HomeLexicalDescription
        content={provider.description}
        className="mb-1 line-clamp-2 text-xs text-gray-500 [&_p]:line-clamp-2"
        fallback={labels.noDescription}
      />
      <p className="mb-2 line-clamp-1 text-xs text-gray-500">{provider.location}</p>

      {provider.specialties.length ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {provider.specialties.map((specialty) => (
            <span key={specialty} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              {specialty}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-1">
        <Star size={14} className="fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-bold text-gray-900">{provider.rating.toFixed(1)}</span>
        <span className="ml-0.5 text-xs text-gray-500">({provider.reviewCount.toLocaleString(locale)})</span>
      </div>
    </Link>
  );
}
