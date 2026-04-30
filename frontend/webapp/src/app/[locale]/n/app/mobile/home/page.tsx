import { Award, ChevronRight, Gift, Map, Search, Sparkles, Star, TrendingUp } from 'lucide-react';

import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { Skeleton } from '../../design-system/components';
import { Link } from '@/i18n/navigation';
import type { PageProps } from '@/types/next';
import sql from '@/config/database/db';
import { getQuickSearches } from './actions/get-quick-searches';
import LocationPicker from './components/location-picker';
import { ServiceProvidersCategoriesSuspenseBoundary } from './components/service-providers-category';
import HomeFeaturedServicesSuspenseBoundary from './components/service-providers';
import HomeTrendingServicesSuspenseBoundary from './components/trending-services';
import HomeTrustedProvidersSuspenseBoundary from './components/trusted-providers';
import UserInfoSubBar from './components/user-info';
import {
  getFeaturedHomeServices,
  getHomeCategories,
  getHomeHeroOffer,
  getNearbyProviderCount,
  getTrendingHomeServices,
  getTrustedHomeProviders,
  type HomeHeroOffer,
} from '@/features/home/api/server/get-home-page';
import {
  formatHomeSectionText,
  getHomeManagedSections,
  type HomeManagedSection,
} from '@/features/home/api/server/get-home-sections';
import { HomeLexicalDescription } from '@/features/home/components/home-lexical-description';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';
import { SponsoredMediaCarouselSection } from '@/features/home/components/sponsored-media-carousel-section';
import { homeSearchParamsCache } from '@/features/home/types';

const fallbackQuickSearches = [
  'Hair Transplant',
  'Dental Veneers',
  'Spa Day',
  'IVF Treatment',
  'Gym Membership',
];

async function getLocaleFromParams(params: PageProps['params']) {
  const resolved = await params;
  return String((resolved as { locale?: string } | undefined)?.locale || 'en-US');
}

function normalizeLocale(locale?: string | null) {
  const value = (locale || 'en-US').trim();
  if (value.toLowerCase() === 'en') return 'en-US';
  if (value.toLowerCase() === 'fa') return 'fa-IR';
  if (value.toLowerCase() === 'ar') return 'ar-SA';
  if (value.toLowerCase() === 'tr') return 'tr-TR';
  return value;
}

function metadataText(value: unknown, locale: string) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';

  const record = value as Record<string, unknown>;
  const normalizedLocale = normalizeLocale(locale);
  const baseLocale = normalizedLocale.split('-')[0];
  return String(
    record[normalizedLocale] ||
      record[baseLocale] ||
      record['en-US'] ||
      record.en ||
      Object.values(record)[0] ||
      ''
  );
}

async function Home({ params, searchParams }: PageProps) {
  const locale = await getLocaleFromParams(params);
  const searchParamsData = await searchParams;
  const { countryCode, cityCode } = homeSearchParamsCache.parse(searchParamsData);

  const queryInput = { locale, countryCode, cityCode };

  const [
    dbQuickSearches,
    categories,
    featuredServices,
    trendingServices,
    trustedProviders,
    heroOffer,
    nearbyProviderCount,
    homeSections,
  ] = await Promise.all([
    getQuickSearches(sql, 8),
    getHomeCategories(queryInput, 6),
    getFeaturedHomeServices(queryInput, 8),
    getTrendingHomeServices(queryInput, 8),
    getTrustedHomeProviders(queryInput, 8),
    getHomeHeroOffer(queryInput),
    getNearbyProviderCount(queryInput),
    getHomeManagedSections(locale),
  ]);

  const quickSearches = dbQuickSearches.length > 0 ? dbQuickSearches : fallbackQuickSearches;

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 px-5 pb-4 pt-3 backdrop-blur-xl">
        <UserInfoSubBar />
        <LocationPicker />
      </div>

      <section className="bg-gray-50 px-5 py-4">
        <Link
          href="/n/app/mobile/search"
          className="flex h-14 w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 shadow-sm transition-all hover:shadow-md"
        >
          <Search size={22} className="text-[#083f30]" />
          <span className="font-medium text-gray-500">Search treatments, clinics...</span>
        </Link>

        <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {quickSearches.map((search) => (
            <Link
              href={`/n/app/mobile/search-results?q=${encodeURIComponent(search)}`}
              key={search}
              className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#083f30] hover:text-[#083f30]"
            >
              {search}
            </Link>
          ))}
        </div>
      </section>

      <HomeHeroBanner offer={heroOffer} section={homeSections.hero_featured} />

      <section className="px-5 pb-8 lg:px-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Explore Categories</h2>
          <Link
            href="/n/app/mobile/categories"
            className="flex items-center gap-1 text-sm font-semibold text-[#083f30] hover:underline"
          >
            View All
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <ServiceProvidersCategoriesSuspenseBoundary categories={categories} />
        </div>
      </section>

      <section className="pb-8">
        <div className="mb-5 flex items-center justify-between px-5">
          <div>
            <h2 className="mb-1 text-xl font-bold text-gray-900">Featured Services</h2>
            <p className="text-sm text-gray-600">Handpicked by our experts</p>
          </div>
          <Link
            href="/n/app/mobile/featured"
            className="flex items-center gap-1 text-sm font-semibold text-[#083f30] hover:underline"
          >
            See All
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="hide-scrollbar flex gap-4 overflow-x-auto px-5 pb-2">
          <HomeFeaturedServicesSuspenseBoundary
            services={featuredServices}
            locale={locale}
            selectedCountryCode={countryCode}
          />
        </div>
      </section>

      <SponsoredMediaCarouselSection />

      <section className="pb-8">
        <div className="mb-5 px-5">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp size={22} className="text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Trending This Month</h2>
          </div>
          <p className="text-sm text-gray-600">Most booked treatments right now</p>
        </div>

        <div className="hide-scrollbar flex gap-3 overflow-x-auto px-5 pb-2">
          <HomeTrendingServicesSuspenseBoundary services={trendingServices} />
        </div>
      </section>

      <ExploreNearbySection
        section={homeSections.explore_nearby}
        nearbyProviderCount={nearbyProviderCount}
        countryCode={countryCode}
        cityCode={cityCode}
      />

      <section className="pb-8">
        <div className="mb-5 px-5">
          <div className="mb-1 flex items-center gap-2">
            <Award size={22} className="text-[#083f30]" />
            <h2 className="text-xl font-bold text-gray-900">Trusted Providers</h2>
          </div>
          <p className="text-sm text-gray-600">Verified by our quality team</p>
        </div>

        <div className="hide-scrollbar flex gap-4 overflow-x-auto px-5 pb-2">
          <HomeTrustedProvidersSuspenseBoundary providers={trustedProviders} />
        </div>
      </section>

      <PremiumPackagesSection section={homeSections.premium_packages} />
      <LoyaltyClubSection section={homeSections.loyalty_club} locale={locale} />
    </div>
  );
}

function HomeHeroBanner({ offer, section }: { offer: HomeHeroOffer | null; section: HomeManagedSection }) {
  const mediaUrl = resolveHomeMediaUrl(section.imageUrl || offer?.imageUrl);
  const href = section.buttonHref || (offer?.serviceId ? `/n/app/mobile/service/${offer.serviceId}` : '/n/app/mobile/offers');

  return (
    <section className="px-5 py-6">
      <div className="relative h-48 overflow-hidden rounded-3xl shadow-lg">
        {mediaUrl ? (
          <ImageWithFallback
            fill
            src={mediaUrl}
            alt={section.title || offer?.title || 'Featured offer'}
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <img
            src="/unsplash_images/photo-1540555700478-4be289fbecef__w=1200&h=600&fit=crop.jpg"
            alt="Featured wellness offer"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#083f30]/95 via-[#083f30]/85 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-center px-6">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={18} className="text-[#eacb7f]" />
            <span className="text-xs font-bold uppercase tracking-wide text-[#eacb7f]">
              {section.badge || (offer?.discountPercent ? 'Limited Time' : 'Featured')}
            </span>
          </div>
          <h2 className="mb-2 text-2xl font-bold leading-tight text-white">
            {section.title || offer?.title || 'Discover premium health and wellness services'}
          </h2>
          <HomeLexicalDescription
            content={section.description || section.subtitle || offer?.subtitle || 'Compare trusted providers and book services across LSevin destinations.'}
            className="mb-4 text-sm font-medium text-white/90 [&_p]:text-white/90"
            fallback="Compare trusted providers and book services across LSevin destinations."
          />
          <div>
            <Link
              href={href}
              className="inline-flex rounded-xl bg-[#eacb7f] px-6 py-3 text-sm font-bold text-[#083f30] shadow-lg transition-all hover:bg-[#e0b654] hover:shadow-xl active:scale-95"
            >
              {section.buttonLabel || 'Explore Offers'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExploreNearbySection({
  section,
  nearbyProviderCount,
  countryCode,
  cityCode,
}: {
  section: HomeManagedSection;
  nearbyProviderCount: number;
  countryCode?: string | null;
  cityCode?: string | null;
}) {
  const mediaUrl = resolveHomeMediaUrl(section.imageUrl);
  const scope = countryCode || cityCode ? 'in your selected area' : 'ready to discover';
  const subtitle = formatHomeSectionText(section.subtitle, {
    count: nearbyProviderCount.toLocaleString(),
    scope,
  });

  return (
    <section className="px-5 pb-8">
      <Link
        href={section.buttonHref || '/n/app/mobile/map-discovery'}
        className="relative block h-48 w-full overflow-hidden rounded-2xl shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
      >
        {mediaUrl ? (
          <ImageWithFallback fill src={mediaUrl} alt={section.title || 'Map discovery'} sizes="100vw" className="object-cover" />
        ) : (
          <img
            src="/unsplash_images/photo-1524661135-423995f22d0b__w=1200&h=600&fit=crop.jpg"
            alt="Map discovery"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-end p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Map size={20} className="text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white">{section.title || 'Explore Nearby'}</h3>
              <p className="text-sm text-white/90">
                {subtitle || `${nearbyProviderCount.toLocaleString()} providers ${scope}`}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

function PremiumPackagesSection({ section }: { section: HomeManagedSection }) {
  const mediaUrl = resolveHomeMediaUrl(section.imageUrl);

  return (
    <section className="px-5 pb-8">
      <div className="relative min-h-[210px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-6 shadow-lg">
        {mediaUrl ? (
          <ImageWithFallback
            fill
            src={mediaUrl}
            alt={section.title || 'Premium packages'}
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        {mediaUrl ? (
          <div className="absolute inset-0 bg-gradient-to-br from-[#083f30]/90 via-[#083f30]/75 to-[#0a5a44]/45" />
        ) : null}
        <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-[#eacb7f]/10" />
        <div className="absolute bottom-0 right-0 -mb-12 mr-6 h-24 w-24 rounded-full bg-[#eacb7f]/10" />

        <div className="relative z-10">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eacb7f]/20 backdrop-blur-sm">
              <Sparkles size={24} className="text-[#eacb7f]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{section.title || 'Premium Packages'}</h3>
              {section.subtitle ? <p className="text-sm text-white/80">{section.subtitle}</p> : null}
            </div>
          </div>

          <HomeLexicalDescription
            content={section.description}
            className="mb-4 max-w-[85%] text-sm leading-relaxed text-white/90 [&_p]:text-white/90"
            fallback="Bundle services with accommodation, transfers, and aftercare when packages are available for your destination."
          />

          <Link
            href={section.buttonHref || '/n/app/mobile/packages'}
            className="inline-flex rounded-xl bg-[#eacb7f] px-6 py-3 text-sm font-bold text-[#083f30] shadow-lg transition-all hover:bg-[#e0b654]"
          >
            {section.buttonLabel || 'View Packages'}
          </Link>
        </div>
      </div>
    </section>
  );
}

function LoyaltyClubSection({ section, locale }: { section: HomeManagedSection; locale: string }) {
  const mediaUrl = resolveHomeMediaUrl(section.imageUrl);
  const rawBenefits = (section.metadata as { benefits?: unknown }).benefits;
  const benefits = Array.isArray(rawBenefits) ? rawBenefits.slice(0, 3) : [];

  return (
    <section className="px-5 pb-28">
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        {mediaUrl ? (
          <ImageWithFallback fill src={mediaUrl} alt={section.title || 'Loyalty club'} sizes="100vw" className="object-cover" />
        ) : (
          <img
            src="/unsplash_images/photo-1545205597-3d9d02c29597__w=1200&h=400&fit=crop.jpg"
            alt="Loyalty club"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-[#eacb7f]/90 via-[#eacb7f]/75 to-[#e0b654]/60" />

        <div className="relative z-10 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#083f30]/20">
              <Gift size={28} className="text-[#083f30]" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-xl font-bold text-[#083f30]">{section.title || 'Join Loyalty Club'}</h3>
              <HomeLexicalDescription
                content={section.description}
                className="mb-4 text-sm leading-relaxed text-[#083f30]/80 [&_p]:text-[#083f30]/80"
                fallback="Earn points on every booking, unlock rewards, and get priority access to new services."
              />
              <div className="mb-4 flex items-center gap-3">
                {(benefits.length ? benefits : [{ label: 'Cashback', value: '5%' }, { label: 'Rewards', icon: 'Award' }, { label: 'VIP Access', icon: 'Star' }]).map((item, index) => {
                  const benefit = item as Record<string, unknown>;
                  const label = metadataText(benefit.label, locale) || `Benefit ${index + 1}`;
                  const value = typeof benefit.value === 'string' ? benefit.value : '';
                  const icon = String(benefit.icon || '');

                  return (
                    <div key={`${label}-${index}`} className="flex items-center gap-1.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#083f30]/10">
                        {value ? <span className="text-sm font-bold text-[#083f30]">{value}</span> : icon === 'Star' ? <Star size={16} className="text-[#083f30]" /> : <Award size={16} className="text-[#083f30]" />}
                      </div>
                      <span className="text-xs font-semibold text-[#083f30]">{label}</span>
                    </div>
                  );
                })}
              </div>
              <Link
                href={section.buttonHref || '/n/app/mobile/profile/rewards'}
                className="inline-flex rounded-xl bg-[#083f30] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#0a5a44] active:scale-95"
              >
                {section.buttonLabel || "Join Now - It's Free"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex-none w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <Skeleton className="h-40 w-full" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default Home;
