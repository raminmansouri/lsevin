import { getTranslations } from 'next-intl/server';
import { ChevronLeft, Sparkles } from 'lucide-react';

import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { Link } from '@/i18n/navigation';
import type { PageProps } from '@/types/next';
import { homeSearchParamsCache } from '@/features/home/types';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';
import { SafePriceText } from '@/features/home/components/safe-price-text';
import {
  getActiveSpecialPackages,
  type SpecialPackagePublicItem,
} from '@/features/special-packages/server/repository';

export const dynamic = "force-dynamic";

async function getLocaleFromParams(params: PageProps['params']) {
  const resolved = await params;
  return String((resolved as { locale?: string } | undefined)?.locale || 'fa-IR');
}

export default async function SpecialPackagesPage({ params, searchParams }: PageProps) {
  const locale = await getLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: 'Home' });
  const searchParamsData = await searchParams;
  const { countryCode } = homeSearchParamsCache.parse(searchParamsData);

  const packages = await getActiveSpecialPackages(locale);

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white px-5 pb-4 pt-3">
        <div className="flex items-center gap-3">
          <Link
            href="/n/app/mobile/home"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            aria-label={t('packagesPage.backAria')}
          >
            <ChevronLeft size={24} className="text-gray-700 rtl:rotate-180" />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('packagesPage.title')}</h1>
            <p className="text-sm text-gray-600">{t('packagesPage.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#083f30]/10">
              <Sparkles size={28} className="text-[#083f30]" />
            </div>
            <h2 className="mb-1 text-lg font-bold text-gray-900">{t('packagesPage.emptyTitle')}</h2>
            <p className="max-w-sm text-sm text-gray-600">{t('packagesPage.emptyDescription')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {packages.map((pkg) => (
              <SpecialPackageCard
                key={pkg.id}
                pkg={pkg}
                locale={locale}
                selectedCountryCode={countryCode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SpecialPackageCard({
  pkg,
  locale,
  selectedCountryCode,
}: {
  pkg: SpecialPackagePublicItem;
  locale: string;
  selectedCountryCode?: string | null;
}) {
  const mediaUrl = resolveHomeMediaUrl(pkg.imageUrl);

  return (
    <Link
      href={`/n/app/mobile/packages/${pkg.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
    >
      <div className="relative h-40 w-full overflow-hidden bg-gray-100">
        {mediaUrl ? (
          <ImageWithFallback
            fill
            src={mediaUrl}
            alt={pkg.title}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#083f30] to-[#0a5a44]">
            <Sparkles size={32} className="text-[#eacb7f]" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-1 text-base font-bold text-gray-900">{pkg.title}</h3>
        {pkg.subtitle ? (
          <p className="line-clamp-2 text-sm text-gray-600">{pkg.subtitle}</p>
        ) : null}

        {pkg.priceAmount != null && pkg.currencyCode ? (
          <div className="mt-auto flex items-baseline gap-2 pt-2">
            {pkg.originalPriceAmount != null && pkg.originalPriceAmount > pkg.priceAmount ? (
              <SafePriceText
                amount={pkg.originalPriceAmount}
                sourceCurrencyCode={pkg.currencyCode}
                selectedCountryCode={selectedCountryCode}
                locale={locale}
                className="text-xs text-gray-400 line-through"
              />
            ) : null}
            <SafePriceText
              amount={pkg.priceAmount}
              sourceCurrencyCode={pkg.currencyCode}
              selectedCountryCode={selectedCountryCode}
              locale={locale}
              className="text-lg font-bold text-[#083f30]"
              showSourceWhenConverted
            />
          </div>
        ) : null}
      </div>
    </Link>
  );
}
