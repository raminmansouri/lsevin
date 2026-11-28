import { getTranslations } from 'next-intl/server';
import { ChevronLeft } from 'lucide-react';
import { Suspense } from 'react';

import HomeTrustedProvidersSuspenseBoundary from '../home/components/trusted-providers';
import type { PageProps } from '@/types/next';
import { Link } from '@/i18n/navigation';
import { getTrustedHomeProvidersCached } from '@/features/home/api/server/get-home-page.cached';
import { buildPublicMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/alternates';
import { breadcrumbList, collectionPage, graph, providerUrl } from '@/lib/seo/entity-schema';
import { JsonLd } from '@/lib/seo/json-ld';
import { ShopPagination } from '@/features/shop/components/ShopPagination';

// Static / ISR — location-agnostic listing.
export const dynamic = 'force-dynamic';

// Generous cap for the full listing — the horizontal home rail shows only 8.
const TRUSTED_PROVIDERS_LISTING_LIMIT = 999;
// Shown per page. All ~130 providers on one page made a 1.5 MB document (each
// card is also serialised into the page data): ~2.8 s of parsing on a phone
// before anything was interactive (2026-11-28). Page 1 is the indexed page;
// ?page=N is "noindex, follow" (src/lib/seo/facet-headers.ts) and every
// provider is in the sitemap.
const PROVIDERS_PER_PAGE = 24;

function pageFrom(value: string | string[] | undefined, totalPages: number) {
  const parsed = Number.parseInt(Array.isArray(value) ? value[0] ?? "" : value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, Math.max(totalPages, 1)) : 1;
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const locale = await getLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: 'Home' });
  const query = ((await searchParams) ?? {}) as Record<string, string | string[] | undefined>;
  // Later pages name themselves as canonical (and carry "noindex, follow").
  const page = pageFrom(query.page, Number.MAX_SAFE_INTEGER);
  return buildPublicMetadata({
    locale,
    path: page > 1 ? `/providers?page=${page}` : '/providers',
    title: t('trustedPage.title'),
    descriptions: [t('trustedPage.subtitle')],
  });
}

async function getLocaleFromParams(params: PageProps['params']) {
  const resolved = await params;
  return String((resolved as { locale?: string } | undefined)?.locale || 'fa-IR');
}

export default async function TrustedProvidersPage({ params, searchParams }: PageProps) {
  const locale = await getLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: 'Home' });

  const allProviders = await getTrustedHomeProvidersCached({ locale }, TRUSTED_PROVIDERS_LISTING_LIMIT).catch(() => []);
  const totalPages = Math.ceil(allProviders.length / PROVIDERS_PER_PAGE);
  const query = ((await searchParams) ?? {}) as Record<string, string | string[] | undefined>;
  const page = pageFrom(query.page, totalPages);
  const providers = allProviders.slice((page - 1) * PROVIDERS_PER_PAGE, page * PROVIDERS_PER_PAGE);

  const pageUrl = absoluteUrl(locale, '/providers');
  const brand = (await getTranslations({ locale, namespace: 'LocaleLayout' }))('title');

  return (
    <div className="min-h-screen bg-white pb-24">
      <JsonLd
        data={graph(
          collectionPage({
            url: pageUrl,
            name: t('trustedPage.title'),
            description: t('trustedPage.subtitle'),
            locale,
            items: providers.map((p) => ({ url: providerUrl(locale, p), name: p.name, image: p.imageUrl })),
          }),
          breadcrumbList([
            { name: brand, url: absoluteUrl(locale) },
            { name: t('trustedPage.title'), url: pageUrl },
          ])
        )}
      />
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white px-5 pb-4 pt-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
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
              priorityCount={2}
              labels={{
                emptyTitle: t('trusted.emptyTitle'),
                emptyDescription: t('trusted.emptyDescription'),
                noDescription: t('common.noDescription'),
              }}
            />
          </Suspense>
        </div>
        <div className="mt-8">
          <ShopPagination
            page={page}
            totalPages={totalPages}
            locale={locale}
            hrefFor={(target) => (target === 1 ? '/providers' : `/providers?page=${target}`)}
          />
        </div>
      </div>
    </div>
  );
}
