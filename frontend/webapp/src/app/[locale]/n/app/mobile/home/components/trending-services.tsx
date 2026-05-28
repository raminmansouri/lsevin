import { TrendingUp, Users } from 'lucide-react';

import { ImageWithFallback } from '@/components/ui/image-with-fallback';

import type { HomeTrendingService } from '@/features/home/api/server/get-home-page';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';
import { Link } from '@/i18n/navigation';

export type HomeTrendingServiceLabels = {
  emptyTitle: string;
  emptyDescription: string;
  bookings: string;
};

const defaultLabels: HomeTrendingServiceLabels = {
  emptyTitle: 'No trending services yet',
  emptyDescription: 'Bookings and trending scores will populate this section.',
  bookings: '{count} bookings',
};

function formatLabel(template: string, replacements: Record<string, string | number>) {
  return Object.entries(replacements).reduce(
    (value, [key, replacement]) => value.replaceAll(`{${key}}`, String(replacement)),
    template
  );
}

export default function HomeTrendingServicesSuspenseBoundary({
  services,
  labels = defaultLabels,
}: {
  services: HomeTrendingService[];
  labels?: HomeTrendingServiceLabels;
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
        <TrendingServiceCard key={service.id} service={service} labels={labels} />
      ))}
    </>
  );
}

function TrendingServiceCard({ service, labels }: { service: HomeTrendingService; labels: HomeTrendingServiceLabels }) {
  const mediaUrl = resolveHomeMediaUrl(service.imageUrl);

  return (
    <Link
      href={`/n/app/mobile/service/${service.id}`}
      className="flex-none w-40 cursor-pointer overflow-hidden rounded-2xl bg-gray-100 shadow-md transition-all hover:shadow-xl active:scale-[0.98]"
    >
      <div className="relative aspect-square">
        {mediaUrl ? (
          <ImageWithFallback fill src={mediaUrl} alt={service.displayName} sizes="160px" className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#083f30] to-[#0f6b56]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {service.growthLabel ? (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-green-500 px-2 py-1">
            <TrendingUp size={12} className="text-white" />
            <span className="text-xs font-bold text-white">{service.growthLabel}</span>
          </div>
        ) : null}

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="mb-1 line-clamp-2 text-sm font-bold text-white">{service.displayName}</h3>
          <div className="flex items-center gap-1 text-white/80">
            <Users size={12} />
            <span className="text-xs font-medium">{formatLabel(labels.bookings, { count: service.bookingLabel })}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
