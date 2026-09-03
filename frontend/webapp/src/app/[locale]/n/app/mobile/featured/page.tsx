import { getTranslations } from 'next-intl/server';
import { ChevronLeft } from 'lucide-react';
import { Suspense } from 'react';

import HomeFeaturedServicesSuspenseBoundary from '../home/components/service-providers';
import type { PageProps } from '@/types/next';
import { Link } from '@/i18n/navigation';
import { homeSearchParamsCache } from '@/features/home/types';
import { getFeaturedHomeServices } from '@/features/home/api/server/get-home-page';

export const dynamic = "force-dynamic";

async function getLocaleFromParams(params: PageProps['params']) {
  const resolved = await params;
  return String((resolved as { locale?: string } | undefined)?.locale || 'fa-IR');
}

export default async function FeaturedServicesPage({ params, searchParams }: PageProps) {
  const locale = await getLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: 'Home' });
  const searchParamsData = await searchParams;
  const { countryCode, cityCode } = homeSearchParamsCache.parse(searchParamsData);

  const queryInput = { locale, countryCode, cityCode };
  const featuredServices = await getFeaturedHomeServices(queryInput, 999);

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* top-[60px], not top-0: MobileAppBar is `sticky top-0 z-50` and 60px tall, so
          a header pinned to 0 scrolls in underneath it and all but its bottom edge
          disappears. */}
      <div className="sticky top-[60px] z-40 border-b border-gray-100 bg-white px-4 pb-3 pt-3 sm:px-5 sm:pb-4">
        <div className="mx-auto flex max-w-7xl items-center gap-2 sm:gap-3">
          <Link
            href="/n/app/mobile/home"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            aria-label={t('featuredPage.backAria')}
          >
            <ChevronLeft size={24} className="text-gray-700 rtl:rotate-180" />
          </Link>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">
              {t('featuredPage.title')}
            </h1>
            <p className="truncate text-xs text-gray-600 sm:text-sm">{t('featuredPage.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-5 sm:py-6">
        {/* Two columns from the smallest phone up. A column is ~165px there, which the
            card handles by rendering its compact container-query variant rather than by
            overflowing. Three from md, four from xl. */}
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
          <Suspense fallback={<div className="col-span-full">{t('common.loading')}</div>}>
            <HomeFeaturedServicesSuspenseBoundary
              services={featuredServices}
              locale={locale}
              selectedCountryCode={countryCode}
              layout="grid"
              labels={{
                emptyTitle: t('featured.emptyTitle'),
                emptyDescription: t('featured.emptyDescription'),
                discountOff: t('featured.discountOff', { percent: '{percent}' }),
                availableDestination: t('featured.availableDestination'),
                noDescription: t('common.noDescription'),
              }}
            />
          </Suspense>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-5">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-5 sm:p-6">
          <div className="relative z-10">
            <h3 className="mb-2 text-base font-bold text-white sm:text-lg">
              {t('featuredPage.ctaTitle')}
            </h3>
            <p className="mb-4 text-sm text-white/90">{t('featuredPage.ctaDescription')}</p>
            {/* inline-flex, not a bare anchor: an inline <a> ignores vertical padding
                for layout, so the button had no real height to tap. Full width on a
                phone, hugging its label from sm up. */}
            <Link
              href="/n/app/mobile/search"
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#eacb7f] px-6 py-3 text-sm font-bold text-[#083f30] shadow-lg transition-all hover:bg-[#e0b654] sm:w-auto"
            >
              {t('featuredPage.ctaButton')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
