import { Award, ChevronRight, Gift, Map, Search, Sparkles, Star, TrendingUp } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

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
import { getActiveLocationQueryScope } from '@/features/locations/server/active-location';
import { getProfileForEdit } from '@/features/profile/actions/profile.actions';
import { countActiveSpecialPackages } from '@/features/special-packages/server/repository';

async function getLocaleFromParams(params: PageProps['params']) {
  const resolved = await params;
  return String((resolved as { locale?: string } | undefined)?.locale || 'fa-IR');
}

function parseCoordParam(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function normalizeLocale(locale?: string | null) {
  const value = (locale || 'fa-IR').trim();
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

type HomePageLabels = {
  common: {
    noDescription: string;
    viewAll: string;
    seeAll: string;
  };
  quickSearches: string[];
  search: {
    placeholder: string;
  };
  categories: {
    title: string;
    emptyTitle: string;
    emptyDescription: string;
    serviceCount: string;
  };
  featured: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyDescription: string;
    discountOff: string;
    availableDestination: string;
  };
  trending: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyDescription: string;
    bookings: string;
  };
  trusted: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  hero: {
    imageAlt: string;
    fallbackImageAlt: string;
    limitedTime: string;
    featured: string;
    title: string;
    description: string;
    button: string;
  };
  exploreNearby: {
    imageAlt: string;
    title: string;
    selectedAreaScope: string;
    readyScope: string;
    subtitle: string;
  };
  premiumPackages: {
    imageAlt: string;
    title: string;
    subtitle: string;
    description: string;
    button: string;
  };
  loyaltyClub: {
    imageAlt: string;
    title: string;
    description: string;
    button: string;
    cashback: string;
    rewards: string;
    vipAccess: string;
    benefit: string;
  };
};

function formatLabel(template: string, replacements: Record<string, string | number | null | undefined>) {
  return Object.entries(replacements).reduce(
    (value, [key, replacement]) => value.replaceAll(`{${key}}`, String(replacement ?? '')),
    template || ''
  );
}

async function Home({ params, searchParams }: PageProps) {
  const locale = await getLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: 'Home' });
  const labels: HomePageLabels = {
    common: {
      noDescription: t('common.noDescription'),
      viewAll: t('common.viewAll'),
      seeAll: t('common.seeAll'),
    },
    quickSearches: [
      t('quickSearches.hairTransplant'),
      t('quickSearches.dentalVeneers'),
      t('quickSearches.spaDay'),
      t('quickSearches.ivfTreatment'),
      t('quickSearches.gymMembership'),
    ],
    search: {
      placeholder: t('search.placeholder'),
    },
    categories: {
      title: t('categories.title'),
      emptyTitle: t('categories.emptyTitle'),
      emptyDescription: t('categories.emptyDescription'),
      serviceCount: t('categories.serviceCount', { count: '{count}' }),
    },
    featured: {
      title: t('featured.title'),
      subtitle: t('featured.subtitle'),
      emptyTitle: t('featured.emptyTitle'),
      emptyDescription: t('featured.emptyDescription'),
      discountOff: t('featured.discountOff', { percent: '{percent}' }),
      availableDestination: t('featured.availableDestination'),
    },
    trending: {
      title: t('trending.title'),
      subtitle: t('trending.subtitle'),
      emptyTitle: t('trending.emptyTitle'),
      emptyDescription: t('trending.emptyDescription'),
      bookings: t('trending.bookings', { count: '{count}' }),
    },
    trusted: {
      title: t('trusted.title'),
      subtitle: t('trusted.subtitle'),
      emptyTitle: t('trusted.emptyTitle'),
      emptyDescription: t('trusted.emptyDescription'),
    },
    hero: {
      imageAlt: t('hero.imageAlt'),
      fallbackImageAlt: t('hero.fallbackImageAlt'),
      limitedTime: t('hero.limitedTime'),
      featured: t('hero.featured'),
      title: t('hero.title'),
      description: t('hero.description'),
      button: t('hero.button'),
    },
    exploreNearby: {
      imageAlt: t('exploreNearby.imageAlt'),
      title: t('exploreNearby.title'),
      selectedAreaScope: t('exploreNearby.selectedAreaScope'),
      readyScope: t('exploreNearby.readyScope'),
      subtitle: t('exploreNearby.subtitle', { count: '{count}', scope: '{scope}' }),
    },
    premiumPackages: {
      imageAlt: t('premiumPackages.imageAlt'),
      title: t('premiumPackages.title'),
      subtitle: t('premiumPackages.subtitle'),
      description: t('premiumPackages.description'),
      button: t('premiumPackages.button'),
    },
    loyaltyClub: {
      imageAlt: t('loyaltyClub.imageAlt'),
      title: t('loyaltyClub.title'),
      description: t('loyaltyClub.description'),
      button: t('loyaltyClub.button'),
      cashback: t('loyaltyClub.cashback'),
      rewards: t('loyaltyClub.rewards'),
      vipAccess: t('loyaltyClub.vipAccess'),
      benefit: t('loyaltyClub.benefit', { index: '{index}' }),
    },
  };

  const searchParamsData = await searchParams;
  const { countryCode, cityCode } = homeSearchParamsCache.parse(searchParamsData);
  const userLat = parseCoordParam(searchParamsData.lat);
  const userLng = parseCoordParam(searchParamsData.lng);

  const queryScope = await getActiveLocationQueryScope({
    locale,
    countryCode,
    cityCode,
    latitude: userLat,
    longitude: userLng,
    includeProfile: true,
    includeIp: true,
  });

  // Prefer the visitor's real coordinates (from the URL) over the matched city
  // centroid so provider lists sort by what's truly closest to them.
  const nearbyLat = userLat ?? queryScope.latitude;
  const nearbyLng = userLng ?? queryScope.longitude;
  const queryInput = { ...queryScope, latitude: nearbyLat, longitude: nearbyLng };

  const [
    dbQuickSearches,
    categories,
    featuredServices,
    trendingServices,
    trustedProviders,
    heroOffer,
    nearbyProviderCount,
    homeSections,
    profile,
    specialPackagesCount,
  ] = await Promise.all([
    getQuickSearches(sql, 8),
    getHomeCategories(queryInput, 6),
    getFeaturedHomeServices(queryInput, 8),
    getTrendingHomeServices(queryInput, 8),
    getTrustedHomeProviders(queryInput, 8),
    getHomeHeroOffer(queryInput),
    getNearbyProviderCount(queryInput),
    getHomeManagedSections(locale),
    // Guests can browse the home page; their profile lookup is optional.
    getProfileForEdit('en-US').catch(() => null),
    countActiveSpecialPackages(),
  ]);

  const quickSearches = dbQuickSearches.length > 0 ? dbQuickSearches : labels.quickSearches;

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 px-5 pb-4 pt-3 backdrop-blur-xl">
        <UserInfoSubBar profile={profile} />
        <LocationPicker locale={locale} />
      </div>

      <section className="bg-gray-50 px-5 py-4">
        <Link
          href="/n/app/mobile/search"
          className="flex h-14 w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 shadow-sm transition-all hover:shadow-md"
        >
          <Search size={22} className="text-[#083f30]" />
          <span className="font-medium text-gray-500">{labels.search.placeholder}</span>
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

      <HomeHeroBanner offer={heroOffer} section={homeSections.hero_featured} labels={labels.hero} noDescription={labels.common.noDescription} />

      <section className="px-5 pb-8 lg:px-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{labels.categories.title}</h2>
          <Link
            href="/n/app/mobile/categories"
            className="flex items-center gap-1 text-sm font-semibold text-[#083f30] hover:underline"
          >
            {labels.common.viewAll}
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <ServiceProvidersCategoriesSuspenseBoundary
            categories={categories}
            locale={locale}
            labels={{
              emptyTitle: labels.categories.emptyTitle,
              emptyDescription: labels.categories.emptyDescription,
              serviceCount: labels.categories.serviceCount,
            }}
          />
        </div>
      </section>

      <section className="pb-8">
        <div className="mb-5 flex items-center justify-between px-5">
          <div>
            <h2 className="mb-1 text-xl font-bold text-gray-900">{labels.featured.title}</h2>
            <p className="text-sm text-gray-600">{labels.featured.subtitle}</p>
          </div>
          <Link
            href="/n/app/mobile/featured"
            className="flex items-center gap-1 text-sm font-semibold text-[#083f30] hover:underline"
          >
            {labels.common.seeAll}
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="hide-scrollbar flex gap-4 overflow-x-auto px-5 pb-2">
          <HomeFeaturedServicesSuspenseBoundary
            services={featuredServices}
            locale={locale}
            selectedCountryCode={queryInput.countryCode}
            labels={{
              emptyTitle: labels.featured.emptyTitle,
              emptyDescription: labels.featured.emptyDescription,
              discountOff: labels.featured.discountOff,
              availableDestination: labels.featured.availableDestination,
              noDescription: labels.common.noDescription,
            }}
          />
        </div>
      </section>

      <SponsoredMediaCarouselSection locale={locale} />

      <section className="pb-8">
        <div className="mb-5 px-5">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp size={22} className="text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">{labels.trending.title}</h2>
          </div>
          <p className="text-sm text-gray-600">{labels.trending.subtitle}</p>
        </div>

        <div className="hide-scrollbar flex gap-3 overflow-x-auto px-5 pb-2">
          <HomeTrendingServicesSuspenseBoundary
            services={trendingServices}
            labels={{
              emptyTitle: labels.trending.emptyTitle,
              emptyDescription: labels.trending.emptyDescription,
              bookings: labels.trending.bookings,
            }}
          />
        </div>
      </section>

      <ExploreNearbySection
        section={homeSections.explore_nearby}
        nearbyProviderCount={nearbyProviderCount}
        countryCode={queryInput.countryCode}
        cityCode={queryInput.cityCode}
        latitude={nearbyLat}
        longitude={nearbyLng}
        locale={locale}
        labels={labels.exploreNearby}
      />

      <section className="pb-8">
        <div className="mb-5 flex items-center justify-between px-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Award size={22} className="text-[#083f30]" />
              <h2 className="text-xl font-bold text-gray-900">{labels.trusted.title}</h2>
            </div>
            <p className="text-sm text-gray-600">{labels.trusted.subtitle}</p>
          </div>
          <Link
            href={`/n/app/mobile/providers?${new URLSearchParams({
              ...(queryInput.countryCode ? { countryCode: queryInput.countryCode } : {}),
              ...(queryInput.cityCode ? { cityCode: queryInput.cityCode } : {}),
            }).toString()}`}
            className="flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-[#083f30] hover:underline"
          >
            {labels.common.seeAll}
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="hide-scrollbar flex gap-4 overflow-x-auto px-5 pb-2">
          <HomeTrustedProvidersSuspenseBoundary
            providers={trustedProviders}
            locale={locale}
            labels={{
              emptyTitle: labels.trusted.emptyTitle,
              emptyDescription: labels.trusted.emptyDescription,
              noDescription: labels.common.noDescription,
            }}
          />
        </div>
      </section>

      <PremiumPackagesSection
        section={homeSections.premium_packages}
        labels={labels.premiumPackages}
        activePackagesCount={specialPackagesCount}
      />
      <LoyaltyClubSection section={homeSections.loyalty_club} locale={locale} labels={labels.loyaltyClub} />


<div className="container" style={{  
  display:'flex',
  justifyContent:'center',
  alignItems:'center',
  marginBottom:'37px'}}>
    
      <a referrerpolicy='origin' target='_blank' 
      href='https://trustseal.enamad.ir/?id=760932&Code=Q4tmSTcTQFTGWWFLYCxWTvO5hIsgD7Hr'>
        <img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=760932&Code=Q4tmSTcTQFTGWWFLYCxWTvO5hIsgD7Hr' 
        alt='' style={{"cursor":"pointer"}} code='Q4tmSTcTQFTGWWFLYCxWTvO5hIsgD7Hr' />
      </a>
   </div>
    </div>
  );
}

function HomeHeroBanner({
  offer,
  section,
  labels,
  noDescription,
}: {
  offer: HomeHeroOffer | null;
  section: HomeManagedSection;
  labels: HomePageLabels['hero'];
  noDescription: string;
}) {
  const mediaUrl = resolveHomeMediaUrl(section.imageUrl || offer?.imageUrl);
  const href = section.buttonHref || (offer?.serviceId ? `/n/app/mobile/service/${offer.serviceId}` : '/n/app/mobile/offers');

  return (
    <section className="px-5 py-6">
      <div className="relative h-48 overflow-hidden rounded-3xl shadow-lg">
        {mediaUrl ? (
          <ImageWithFallback
            fill
            src={mediaUrl}
            alt={section.title || offer?.title || labels.imageAlt}
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <img
            src="/unsplash_images/photo-1540555700478-4be289fbecef__w=1200&h=600&fit=crop.jpg"
            alt={labels.fallbackImageAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#083f30]/95 via-[#083f30]/85 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-center px-6">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={18} className="text-[#eacb7f]" />
            <span className="text-xs font-bold uppercase tracking-wide text-[#eacb7f]">
              {section.badge || (offer?.discountPercent ? labels.limitedTime : labels.featured)}
            </span>
          </div>
          <h2 className="mb-2 text-2xl font-bold leading-tight text-white">
            {section.title || offer?.title || labels.title}
          </h2>
          <HomeLexicalDescription
            content={section.description || offer?.subtitle}
            className="mb-4 text-sm font-medium text-white/90 [&_p]:text-white/90"
            fallback={labels.description || noDescription}
          />
          <div>
            <Link
              href={href}
              className="inline-flex rounded-xl bg-[#eacb7f] px-6 py-3 text-sm font-bold text-[#083f30] shadow-lg transition-all hover:bg-[#e0b654] hover:shadow-xl active:scale-95"
            >
              {section.buttonLabel || labels.button}
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
  latitude,
  longitude,
  locale,
  labels,
}: {
  section: HomeManagedSection;
  nearbyProviderCount: number;
  countryCode?: string | null;
  cityCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locale: string;
  labels: HomePageLabels['exploreNearby'];
}) {
  const mediaUrl = resolveHomeMediaUrl(section.imageUrl);
  const scope = countryCode || cityCode ? labels.selectedAreaScope : labels.readyScope;
  const count = nearbyProviderCount.toLocaleString(locale);
  const subtitle = formatHomeSectionText(section.subtitle, { count, scope }) || formatLabel(labels.subtitle, { count, scope });

  // Carry the visitor's coordinates into the map so it opens centered on them
  // with nearby providers already loaded (50 km radius).
  const baseHref = section.buttonHref || '/n/app/mobile/map-discovery';
  const href =
    latitude != null && longitude != null && !baseHref.includes('?')
      ? `${baseHref}?lat=${latitude}&lng=${longitude}&distanceKm=50`
      : baseHref;

  return (
    <section className="px-5 pb-8">
      <Link
        href={href}
        className="relative block h-48 w-full overflow-hidden rounded-2xl shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
      >
        {mediaUrl ? (
          <ImageWithFallback fill src={mediaUrl} alt={section.title || labels.imageAlt} sizes="100vw" className="object-cover" />
        ) : (
          <img
            src="/unsplash_images/photo-1524661135-423995f22d0b__w=1200&h=600&fit=crop.jpg"
            alt={labels.imageAlt}
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
              <h3 className="text-lg font-bold text-white">{section.title || labels.title}</h3>
              <p className="text-sm text-white/90">{subtitle}</p>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

function PremiumPackagesSection({
  section,
  labels,
  activePackagesCount,
}: {
  section: HomeManagedSection;
  labels: HomePageLabels['premiumPackages'];
  activePackagesCount: number;
}) {
  const mediaUrl = resolveHomeMediaUrl(section.imageUrl);

  // Avoid a dead link: when the CTA still points at the default packages route
  // and there are no active special packages, hide the whole section. If an
  // admin set a custom buttonHref, keep rendering (they own that destination).
  const usesDefaultHref = !section.buttonHref || section.buttonHref === '/n/app/mobile/packages';
  if (activePackagesCount <= 0 && usesDefaultHref) {
    return null;
  }

  return (
    <section className="px-5 pb-8">
      <div className="relative min-h-[210px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-6 shadow-lg">
        {mediaUrl ? (
          <ImageWithFallback
            fill
            src={mediaUrl}
            alt={section.title || labels.imageAlt}
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
              <h3 className="text-lg font-bold text-white">{section.title || labels.title}</h3>
              <p className="text-sm text-white/80">{section.subtitle || labels.subtitle}</p>
            </div>
          </div>

          <HomeLexicalDescription
            content={section.description}
            className="mb-4 max-w-[85%] text-sm leading-relaxed text-white/90 [&_p]:text-white/90"
            fallback={labels.description}
          />

          <Link
            href={section.buttonHref || '/n/app/mobile/packages'}
            className="inline-flex rounded-xl bg-[#eacb7f] px-6 py-3 text-sm font-bold text-[#083f30] shadow-lg transition-all hover:bg-[#e0b654]"
          >
            {section.buttonLabel || labels.button}
          </Link>
        </div>
      </div>
    </section>
  );
}

function LoyaltyClubSection({
  section,
  locale,
  labels,
}: {
  section: HomeManagedSection;
  locale: string;
  labels: HomePageLabels['loyaltyClub'];
}) {
  const mediaUrl = resolveHomeMediaUrl(section.imageUrl);
  const rawBenefits = (section.metadata as { benefits?: unknown }).benefits;
  const benefits = Array.isArray(rawBenefits) ? rawBenefits.slice(0, 3) : [];
  const fallbackBenefits = [
    { label: labels.cashback, value: '5%' },
    { label: labels.rewards, icon: 'Award' },
    { label: labels.vipAccess, icon: 'Star' },
  ];

  return (
    <section className="px-5 pb-28">
      <div className="relative overflow-hidden rounded-3xl shadow-xl">
        {/* Optional managed image (shown on real server); brand gradient is the fallback */}
        {mediaUrl ? (
          <>
            <ImageWithFallback fill src={mediaUrl} alt={section.title || labels.imageAlt} sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-[#062a22]/60" />
          </>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a5a44] via-[#083f30] to-[#062a22]" />
        {/* Soft gold glow for depth */}
        <div className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full bg-[#eacb7f]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-[#e0b654]/15 blur-3xl" />

        <div className="relative z-10 p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#eacb7f]/20 ring-1 ring-[#eacb7f]/40">
              <Gift size={24} className="text-[#eacb7f]" />
            </div>
            <h3 className="text-xl font-bold text-white">{section.title || labels.title}</h3>
          </div>

          <HomeLexicalDescription
            content={section.description}
            className="mb-5 text-sm leading-relaxed text-white/75 [&_p]:text-white/75"
            fallback={labels.description}
          />

          {/* Benefits — equal-width cards so labels never crowd or wrap awkwardly */}
          <div className="mb-6 grid grid-cols-3 gap-2.5">
            {(benefits.length ? benefits : fallbackBenefits).map((item, index) => {
              const benefit = item as Record<string, unknown>;
              const label = metadataText(benefit.label, locale) || formatLabel(labels.benefit, { index: index + 1 });
              const value = typeof benefit.value === 'string' ? benefit.value : '';
              const icon = String(benefit.icon || '');

              return (
                <div
                  key={`${label}-${index}`}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 px-2 py-3 text-center ring-1 ring-white/15 backdrop-blur-sm"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eacb7f]/15">
                    {value ? (
                      <span className="text-base font-extrabold text-[#eacb7f]">{value}</span>
                    ) : icon === 'Star' ? (
                      <Star size={18} className="text-[#eacb7f]" />
                    ) : (
                      <Award size={18} className="text-[#eacb7f]" />
                    )}
                  </div>
                  <span className="text-[11px] font-semibold leading-tight text-white/90">{label}</span>
                </div>
              );
            })}
          </div>

          <Link
            href={section.buttonHref || '/n/app/mobile/profile/rewards'}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#eacb7f] px-6 py-3.5 text-sm font-bold text-[#083f30] shadow-lg transition-all hover:bg-[#f0d18f] active:scale-[0.98]"
          >
            {section.buttonLabel || labels.button}
            <ChevronRight size={18} />
          </Link>
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
