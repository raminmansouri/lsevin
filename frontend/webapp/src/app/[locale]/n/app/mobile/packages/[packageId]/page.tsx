import { getTranslations } from 'next-intl/server';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { notFound } from 'next/navigation';

import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { Link } from '@/i18n/navigation';
import type { PageProps } from '@/types/next';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';
import { SafePriceText } from '@/features/home/components/safe-price-text';
import { getSpecialPackageById, listActiveSpecialPackageIds } from '@/features/special-packages/server/repository';

// Static / ISR.
export const dynamic = 'force-static';
export const revalidate = 3600;

export async function generateStaticParams() {
  const ids = await listActiveSpecialPackageIds(300);
  return ids.map((packageId) => ({ packageId }));
}

async function getLocaleFromParams(params: PageProps['params']) {
  const resolved = await params;
  return String((resolved as { locale?: string } | undefined)?.locale || 'fa-IR');
}

export default async function SpecialPackageDetailPage({ params }: PageProps) {
  const locale = await getLocaleFromParams(params);
  const resolvedParams = (await params) as { packageId?: string } | undefined;
  const packageId = String(resolvedParams?.packageId || '');
  const t = await getTranslations({ locale, namespace: 'Home' });

  const pkg = await getSpecialPackageById(locale, packageId).catch(() => null);
  if (!pkg) notFound();

  const mediaUrl = resolveHomeMediaUrl(pkg.imageUrl);

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white px-5 pb-4 pt-3">
        <div className="flex items-center gap-3">
          <Link
            href="/n/app/mobile/packages"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            aria-label={t('packagesPage.backAria')}
          >
            <ChevronLeft size={24} className="text-gray-700 rtl:rotate-180" />
          </Link>
          <h1 className="line-clamp-1 text-xl font-bold text-gray-900">{pkg.title}</h1>
        </div>
      </div>

      <div className="px-5 py-6">
        <div className="relative h-56 w-full overflow-hidden rounded-3xl bg-gray-100 shadow-sm">
          {mediaUrl ? (
            <ImageWithFallback fill src={mediaUrl} alt={pkg.title} sizes="100vw" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#083f30] to-[#0a5a44]">
              <Sparkles size={40} className="text-[#eacb7f]" />
            </div>
          )}
        </div>

        <div className="mt-5 space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">{pkg.title}</h2>
          {pkg.subtitle ? <p className="text-base text-gray-600">{pkg.subtitle}</p> : null}

          {pkg.priceAmount != null && pkg.currencyCode ? (
            <div className="flex items-baseline gap-3 pt-1">
              {pkg.originalPriceAmount != null && pkg.originalPriceAmount > pkg.priceAmount ? (
                <SafePriceText
                  amount={pkg.originalPriceAmount}
                  sourceCurrencyCode={pkg.currencyCode}
                  selectedCountryCode={null}
                  locale={locale}
                  className="text-sm text-gray-400 line-through"
                />
              ) : null}
              <SafePriceText
                amount={pkg.priceAmount}
                sourceCurrencyCode={pkg.currencyCode}
                selectedCountryCode={null}
                locale={locale}
                className="text-2xl font-bold text-[#083f30]"
                showSourceWhenConverted
              />
            </div>
          ) : null}

          {pkg.description ? (
            <p className="whitespace-pre-line pt-2 text-sm leading-relaxed text-gray-700">{pkg.description}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
