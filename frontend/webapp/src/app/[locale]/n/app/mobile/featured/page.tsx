<<<<<<< HEAD
import { getTranslations } from 'next-intl/server';
import { ChevronLeft } from 'lucide-react';
import { Suspense } from 'react';

import HomeFeaturedServicesSuspenseBoundary from '../home/components/service-providers';
import type { PageProps } from '@/types/next';
import { Link } from '@/i18n/navigation';
import { homeSearchParamsCache } from '@/features/home/types';
import { getFeaturedHomeServices } from '@/features/home/api/server/get-home-page';

async function getLocaleFromParams(params: PageProps['params']) {
  const resolved = await params;
  return String((resolved as { locale?: string } | undefined)?.locale || 'en-US');
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
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white px-5 pb-4 pt-3">
        <div className="flex items-center gap-3">
          <Link
            href="/n/app/mobile/home"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            aria-label={t('featuredPage.backAria')}
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('featuredPage.title')}</h1>
            <p className="text-sm text-gray-600">{t('featuredPage.subtitle')}</p>
=======
import { useFetchCpCategoryGroups } from '@/features/service-providers/api/client/fetch-cp-category-groups';
import { useFetchExplore } from '@/features/service-providers/api/client/fetch-explore';
import { CpCategoryGroup, ExploreCategory } from '@/features/service-providers/types';
import { Link, useRouter } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Suspense,   } from 'react';
import HomeFeaturedServicesSuspenseBoundary from '../home/components/service-providers';
import { PageProps } from "@/types/next";

export default function CategoryBrowser(
  { params, searchParams }: PageProps
) {
  // const router = useRouter();




  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
         <Link
            href="/n/app/mobile/home"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </Link> 
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Featured Services</h1>
            <p className="text-sm text-gray-600">Browse all services</p>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </div>
        </div>
      </div>

<<<<<<< HEAD
      <div className="space-y-8 px-5 py-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Suspense fallback={<div>{t('common.loading')}</div>}>
            <HomeFeaturedServicesSuspenseBoundary
              services={featuredServices}
              locale={locale}
              selectedCountryCode={countryCode}
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

      <div className="px-5 pb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-6">
          <div className="relative z-10">
            <h3 className="mb-2 text-lg font-bold text-white">{t('featuredPage.ctaTitle')}</h3>
            <p className="mb-4 text-sm text-white/90">{t('featuredPage.ctaDescription')}</p>
            <Link
              href="/n/app/mobile/search"
              className="rounded-xl bg-[#eacb7f] px-6 py-3 text-sm font-bold text-[#083f30] shadow-lg transition-all hover:bg-[#e0b654]"
            >
              {t('featuredPage.ctaButton')}
=======
      {/* Category Groups */}
      <div className="px-5 py-6 space-y-8">
        <div className="grid grid-cols-4 gap-3">
        <Suspense fallback={<div>hi</div>} >
                  <HomeFeaturedServicesSuspenseBoundary
                    params={params}
                    searchParams={searchParams}
                  />
                </Suspense> 
      </div>
      </div>

      {/* CTA Banner */}
      <div className="px-5 pb-8">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-6">
          <div className="relative z-10">
            <h3 className="text-white font-bold text-lg mb-2">
              Can't find what you're looking for?
            </h3>
            <p className="text-white/90 text-sm mb-4">
              Use our smart search to find exactly what you need
            </p>
            <Link 
             href='/n/app/mobile/search'
              className="bg-[#eacb7f] text-[#083f30] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#e0b654] transition-all shadow-lg"
            >
              Search Now
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
