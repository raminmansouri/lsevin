import { getTranslations } from 'next-intl/server';
import { ChevronLeft } from 'lucide-react';
import { Suspense } from 'react';

import HomeTrustedProvidersSuspenseBoundary from '../home/components/trusted-providers';
import type { PageProps } from '@/types/next';
import { Link } from '@/i18n/navigation';
import { getTrustedHomeProvidersCached } from '@/features/home/api/server/get-home-page.cached';

// Static / ISR — location-agnostic listing.
export const dynamic = 'force-static';
export const revalidate = 3600;

// Generous cap for the full listing — the horizontal home rail shows only 8.
// Kept as a single constant so it can move to config/pagination later without
// hunting for a magic number (see get-home-page.ts for the offset hook).
const TRUSTED_PROVIDERS_LISTING_LIMIT = 999;

async function getLocaleFromParams(params: PageProps['params']) {
  const resolved = await params;
  return String((resolved as { locale?: string } | undefined)?.locale || 'fa-IR');
}

export default async function TrustedProvidersPage({ params }: PageProps) {
  const locale = await getLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: 'Home' });

  const providers = await getTrustedHomeProvidersCached({ locale }, TRUSTED_PROVIDERS_LISTING_LIMIT).catch(() => []);

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
        {/* Two columns on phones, wider on bigger screens. `auto-rows-fr` gives
            every row the same height so the cards line up; the card's own
            `grid` variant stretches it to fill that height. */}
        <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          <Suspense fallback={<div>{t('common.loading')}</div>}>
            <HomeTrustedProvidersSuspenseBoundary
              providers={providers}
              locale={locale}
              variant="grid"
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
