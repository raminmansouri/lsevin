import { getTranslations } from 'next-intl/server';
import { ChevronLeft } from 'lucide-react';
import { Suspense } from 'react';

import HomeTrustedProvidersSuspenseBoundary from '../home/components/trusted-providers';
import type { PageProps } from '@/types/next';
import { Link } from '@/i18n/navigation';
import { homeSearchParamsCache } from '@/features/home/types';
import { getTrustedHomeProviders } from '@/features/home/api/server/get-home-page';

export const dynamic = "force-dynamic";

// Generous cap for the full listing — the horizontal home rail shows only 8.
// Kept as a single constant so it can move to config/pagination later without
// hunting for a magic number (see get-home-page.ts for the offset hook).
const TRUSTED_PROVIDERS_LISTING_LIMIT = 999;

async function getLocaleFromParams(params: PageProps['params']) {
  const resolved = await params;
  return String((resolved as { locale?: string } | undefined)?.locale || 'fa-IR');
}

export default async function TrustedProvidersPage({ params, searchParams }: PageProps) {
  const locale = await getLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: 'Home' });
  const searchParamsData = await searchParams;
  const { countryCode, cityCode } = homeSearchParamsCache.parse(searchParamsData);

  const queryInput = { locale, countryCode, cityCode };
  const providers = await getTrustedHomeProviders(queryInput, TRUSTED_PROVIDERS_LISTING_LIMIT);

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white px-5 pb-4 pt-3">
        <div className="flex items-center gap-3">
          <Link
            href="/n/app/mobile/home"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            aria-label={t('trustedPage.backAria')}
          >
            <ChevronLeft size={24} className="text-gray-700 rtl:rotate-180" />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('trustedPage.title')}</h1>
            <p className="text-sm text-gray-600">{t('trustedPage.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Wrapping flex (not a rigid grid) keeps the fixed-width w-44 cards from
            stretching, preserving the exact home-rail card design. */}
        <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
          <Suspense fallback={<div>{t('common.loading')}</div>}>
            <HomeTrustedProvidersSuspenseBoundary
              providers={providers}
              locale={locale}
              labels={{
                emptyTitle: t('trusted.emptyTitle'),
                emptyDescription: t('trusted.emptyDescription'),
                noDescription: t('common.noDescription'),
              }}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
