import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { Link } from '@/i18n/navigation';
import type { HomeCategory } from '@/features/home/api/server/get-home-page';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';
import { Grid2X2 } from 'lucide-react';

export type HomeCategoryLabels = {
  emptyTitle: string;
  emptyDescription: string;
  serviceCount: string;
};

const defaultLabels: HomeCategoryLabels = {
  emptyTitle: 'No service categories found',
  emptyDescription: 'Add active categories, services, and providers to show them here.',
  serviceCount: '{count} services',
};

function formatLabel(template: string, replacements: Record<string, string | number>) {
  return Object.entries(replacements).reduce(
    (value, [key, replacement]) => value.replaceAll(`{${key}}`, String(replacement)),
    template
  );
}

export function HomeServiceProvidersCategories({
  categories,
  locale = 'en-US',
  labels = defaultLabels,
}: {
  categories: HomeCategory[];
  locale?: string;
  labels?: HomeCategoryLabels;
}) {
  if (!categories.length) {
    return (
      <div className="col-span-2 rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center lg:col-span-4">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#083f30] shadow-sm">
          <Grid2X2 size={20} />
        </div>
        <p className="text-sm font-semibold text-gray-900">{labels.emptyTitle}</p>
        <p className="mt-1 text-xs text-gray-500">{labels.emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      {categories.map((category) => (
        <ServiceProviderCategoryCard key={category.id} category={category} locale={locale} labels={labels} />
      ))}
    </>
  );
}

function ServiceProviderCategoryCard({
  category,
  locale,
  labels,
}: {
  category: HomeCategory;
  locale: string;
  labels: HomeCategoryLabels;
}) {
  const mediaUrl = resolveHomeMediaUrl(category.imageUrl);

  return (
    <Link
      href={`/n/app/mobile/map-discovery?categoryId=${category.id}`}
      className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 shadow-sm transition-all hover:shadow-xl active:scale-95"
    >
      {mediaUrl ? (
        <ImageWithFallback
          fill
          src={mediaUrl}
          alt={category.label}
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#083f30] to-[#0f6b56]" />
      )}

      <div className={`absolute inset-0 bg-gradient-to-t ${category.gradient || 'from-[#083f30]/90 to-[#083f30]/40'}`} />

      <div className="relative z-10 flex h-full flex-col justify-end p-4">
        <h3 className="line-clamp-2 text-lg font-bold leading-tight text-white lg:text-base xl:text-lg">{category.label}</h3>
        {category.serviceCount > 0 ? (
          <p className="mt-1 text-xs font-semibold text-white/80">
            {formatLabel(labels.serviceCount, { count: category.serviceCount.toLocaleString(locale) })}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
