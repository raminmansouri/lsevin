import { Award, ChevronRight, Gift, Map, Sparkles, Star, TrendingUp } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from "next";

import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { Skeleton } from '../../design-system/components';
import { Link } from '@/i18n/navigation';
import type { PageProps } from '@/types/next';
import LocationPicker from './components/location-picker';
import { ServiceProvidersCategoriesSuspenseBoundary } from './components/service-providers-category';
import HomeFeaturedServicesSuspenseBoundary from './components/service-providers';
import HomeTrendingServicesSuspenseBoundary from './components/trending-services';
import HomeTrustedProvidersSuspenseBoundary from './components/trusted-providers';
import UserInfoSubBar from './components/user-info';
import { type HomeHeroOffer } from '@/features/home/api/server/get-home-page';
import {
  getFeaturedHomeServicesCached,
  getHomeCategoriesCached,
  getHomeHeroOfferCached,
  getNearbyProviderCountCached,
  getTrendingHomeServicesCached,
  getTrustedHomeProvidersCached,
} from '@/features/home/api/server/get-home-page.cached';
import {
  formatHomeSectionText,
  type HomeManagedSection,
} from '@/features/home/api/server/get-home-sections';
import { getHomeManagedSectionsCached } from '@/features/home/api/server/get-home-managed-sections-cached';
import { HomeHero } from './components/home-hero';
import { HomeLexicalDescription } from '@/features/home/components/home-lexical-description';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';
import { SiteFooter } from './components/site-footer';
import { SponsoredMediaCarouselSection } from '@/features/home/components/sponsored-media-carousel-section';
import { countActiveSpecialPackages } from '@/features/special-packages/server/repository';

// Static / ISR — the landing page shell no longer reads the visitor's location
// or profile on the server; see `Home` below.
//
// WHY THE FIRST VISIT AFTER A DEPLOY CAN SHOW AN EMPTY PAGE, end to end:
//
//   1. `next build` cannot reach the database. DATABASE_URL *is* mounted (a
//      BuildKit secret, see frontend/webapp/Dockerfile), but it points at the
//      `pgbouncer` compose service and a BuildKit build does not join the
//      compose network. Every rail query fails and withRailRetry returns its
//      empty fallback.
//   2. This route is prerendered for all 11 locales, so that empty render is
//      baked into the image and shipped.
//   3. `revalidate` below bounds how long the server serves it — but the first
//      visitor per locale still gets the empty copy while ISR regenerates.
//   4. experimental.staleTimes.static in next.config.ts (180s) then keeps that
//      empty RSC payload in the visitor's router cache, so even after the
//      server heals, in-app navigation keeps showing it until it expires. That
//      is why a hard refresh "fixes" it.
//
// Only step 1 is the actual defect, and it cannot be fixed from here: shortening
// revalidate (3600 -> 120) narrowed the window, it did not close it. The fix is
// to let the build reach the database, or to warm/invalidate the route after the
// deploy — both in deployments/, not in this file.
//
// Note `generateStaticParams` cannot opt this route out: its only dynamic
// segment, [locale], belongs to app/[locale]/layout.tsx, so a page-level
// override is inert here. `connection()` would work but needs PPR, which
// next.config.ts turns off on purpose.
export const dynamic = 'force-static';
export const revalidate = 120;

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

export const metadata: Metadata = {
  title: 'Home',
  description: 'Discover services, providers, and offers on LSevin.',
};

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
  search: {
    placeholder: string;
  };
  categories: {
    title: string;
    emptyTitle: string;
    emptyDescription: string;
    providerCount: string;
    subcategoryCount: string;
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

// `force-static` bakes whatever this render produces into the page for the
// full `revalidate` window (1 hour) — a single transient DB/connection-pool
// hiccup during that one render (most often right after a deploy restart,
// where the DB/pool can take several seconds to accept connections again)
// used to fall straight through to `.catch(() => [])` and get served to
// every visitor as "No categories found" until the next regeneration. This
// only runs at (re)generation time, never on a per-visitor request, so it
// can afford to keep retrying for several seconds; a genuinely down database
// still falls back to the empty rail after this.
//
// The exception is `next build` itself: the DB is deliberately off the build
// network, so every attempt is a guaranteed miss and the backoff just drags
// the build toward the prerender-worker timeout. Take the fallback on the
// first failure there — ISR fills the rail on the first real request.
const IS_BUILD = process.env.NEXT_PHASE === 'phase-production-build';
async function withRailRetry<T>(fn: () => Promise<T>, fallback: T, retries = 5, delayMs = 500): Promise<T> {
  const maxAttempts = IS_BUILD ? 0 : retries;
  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error('[home] rail fetch failed after retries', error);
        return fallback;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  return fallback;
}

function formatLabel(template: string, replacements: Record<string, string | number | null | undefined>) {
  return Object.entries(replacements).reduce(
    (value, [key, replacement]) => value.replaceAll(`{${key}}`, String(replacement ?? '')),
    template || ''
  );
}

async function Home({ params }: PageProps) {
  const locale = await getLocaleFromParams(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Home' });
  const labels: HomePageLabels = {
    common: {
      noDescription: t('common.noDescription'),
      viewAll: t('common.viewAll'),
      seeAll: t('common.seeAll'),
    },
    search: {
      placeholder: t('search.placeholder'),
    },
    categories: {
      title: t('categories.title'),
      emptyTitle: t('categories.emptyTitle'),
      emptyDescription: t('categories.emptyDescription'),
      providerCount: t('categories.providerCount', { count: '{count}' }),
      subcategoryCount: t('categories.subcategoryCount', { count: '{count}' }),
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

  // Statically rendered: the rails are location-agnostic (the `LocationPicker`
  // below still lets the visitor scope the app, and a location cookie is applied
  // by the pages they navigate to). The greeting row resolves the signed-in
  // user on the client.
  const queryInput: {
    locale: string;
    countryCode?: string;
    cityCode?: string;
  } = { locale: normalizeLocale(locale) };
  const nearbyLat: number | null = null;
  const nearbyLng: number | null = null;
  const profile = null;

  const [
    categories,
    featuredServices,
    trendingServices,
    trustedProviders,
    heroOffer,
    nearbyProviderCount,
    homeSections,
    specialPackagesCount,
  ] = await Promise.all([
    // Each read is guarded so a sustained DB failure produces an empty rail
    // (ISR fills it on the next request) instead of aborting export — but a
    // transient blip is retried first so it doesn't get baked into this hour's
    // static page. See withRailRetry above.
    withRailRetry(() => getHomeCategoriesCached(queryInput, 6), []),
    withRailRetry(() => getFeaturedHomeServicesCached(queryInput, 8), []),
    withRailRetry(() => getTrendingHomeServicesCached(queryInput, 8), []),
    withRailRetry(() => getTrustedHomeProvidersCached(queryInput, 8), []),
    withRailRetry(() => getHomeHeroOfferCached(queryInput), null),
    withRailRetry(() => getNearbyProviderCountCached(queryInput), 0),
    getHomeManagedSectionsCached(locale),
    countActiveSpecialPackages(),
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* Brand hero: one solid green surface. The greeting row and the location
          picker are passed in as children so they sit at the top of that same
          surface, directly under the app bar. The search field lives in the hero. */}
      <HomeHero>
        <UserInfoSubBar profile={profile} />
        <LocationPicker locale={locale} />
      </HomeHero>

      {/* Content column: capped at 1200px so nothing stretches on desktop.
          A <div>, not <main> — the app layout already provides the page landmark. */}
      <div className="mx-auto w-full max-w-[1200px]">
        <SponsoredMediaCarouselSection locale={locale} placement="home_top" />

        <HomeHeroBanner offer={heroOffer} section={homeSections.hero_featured} labels={labels.hero} noDescription={labels.common.noDescription} />

        <section className="px-5 pb-8 lg:px-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{labels.categories.title}</h2>
            <Link
              href="/n/app/mobile/categories"
              className="flex items-center gap-1 text-sm font-semibold text-[#0C3B2E] hover:underline"
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
                providerCount: labels.categories.providerCount,
                subcategoryCount: labels.categories.subcategoryCount,
              }}
            />
          </div>
        </section>

        <section className="pb-8">
          <div className="mb-5 flex items-center justify-between px-5 lg:px-8">
            <div>
              <h2 className="mb-1 text-xl font-bold text-gray-900">{labels.featured.title}</h2>
              <p className="text-sm text-gray-600">{labels.featured.subtitle}</p>
            </div>
            <Link
              href="/n/app/mobile/featured"
              className="flex items-center gap-1 text-sm font-semibold text-[#0C3B2E] hover:underline"
            >
              {labels.common.seeAll}
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="hide-scrollbar flex gap-4 overflow-x-auto px-5 pb-2 lg:px-8">
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

        <SponsoredMediaCarouselSection locale={locale} placement="home_native_ad" />

        <section className="pb-8">
          <div className="mb-5 px-5 lg:px-8">
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp size={22} className="text-[#0C3B2E]" />
              <h2 className="text-xl font-bold text-gray-900">{labels.trending.title}</h2>
            </div>
            <p className="text-sm text-gray-600">{labels.trending.subtitle}</p>
          </div>

          <div className="hide-scrollbar flex gap-3 overflow-x-auto px-5 pb-2 lg:px-8">
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
          <div className="mb-5 flex items-center justify-between px-5 lg:px-8">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Award size={22} className="text-[#0C3B2E]" />
                <h2 className="text-xl font-bold text-gray-900">{labels.trusted.title}</h2>
              </div>
              <p className="text-sm text-gray-600">{labels.trusted.subtitle}</p>
            </div>
            <Link
              href={`/n/app/mobile/providers?${new URLSearchParams({
                ...(queryInput.countryCode ? { countryCode: queryInput.countryCode } : {}),
                ...(queryInput.cityCode ? { cityCode: queryInput.cityCode } : {}),
              }).toString()}`}
              className="flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-[#0C3B2E] hover:underline"
            >
              {labels.common.seeAll}
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="hide-scrollbar flex gap-4 overflow-x-auto px-5 pb-2 lg:px-8">
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

        <SponsoredMediaCarouselSection locale={locale} placement="home_bottom" />
      </div>

      {/* Footer also carries the Enamad trust seal (moved out of this file). */}
      <SiteFooter />
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
    <section className="px-5 py-6 lg:px-8">
      <div className="relative h-48 overflow-hidden rounded-3xl lg:h-64">
        {mediaUrl ? (
          <ImageWithFallback
            fill
            src={mediaUrl}
            alt={section.title || offer?.title || labels.imageAlt}
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="object-cover"
          />
        ) : (
          <img
            src="/unsplash_images/photo-1540555700478-4be289fbecef__w=1200&h=600&fit=crop.jpg"
            alt={labels.fallbackImageAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {/* Flat scrim (no gradient) so the text stays readable over any photo. */}
        <div className="absolute inset-0 bg-[#0C3B2E]/75" />

        <div className="relative z-10 flex h-full flex-col justify-center px-6 lg:max-w-xl lg:px-12">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={18} className="text-white" />
            <span className="text-xs font-semibold text-white/80">
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
              className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0C3B2E] transition-colors hover:bg-[#E8F1EC] active:scale-95"
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
    <section className="px-5 pb-8 lg:px-8">
      <Link
        href={href}
        className="relative block h-48 w-full overflow-hidden rounded-2xl transition-transform active:scale-[0.99] lg:h-56"
      >
        {mediaUrl ? (
          <ImageWithFallback fill src={mediaUrl} alt={section.title || labels.imageAlt} sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
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
    <section className="px-5 pb-8 lg:px-8">
      <div className="relative min-h-[210px] overflow-hidden rounded-2xl bg-[#0C3B2E] p-6 lg:p-10">
        {mediaUrl ? (
          <ImageWithFallback
            fill
            src={mediaUrl}
            alt={section.title || labels.imageAlt}
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="object-cover"
          />
        ) : null}
        {mediaUrl ? <div className="absolute inset-0 bg-[#0C3B2E]/85" /> : null}

        <div className="relative z-10 lg:max-w-xl">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <Sparkles size={24} className="text-white" />
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
            className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0C3B2E] transition-colors hover:bg-[#E8F1EC]"
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
    <section className="px-5 pb-8 lg:px-8">
      {/* Solid black card: the one high-contrast moment on the page. The managed
          image (if any) now shows through a dark scrim instead of being covered. */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0A0A0A]">
        {mediaUrl ? (
          <>
            <ImageWithFallback fill src={mediaUrl} alt={section.title || labels.imageAlt} sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-black/70" />
          </>
        ) : null}

        <div className="relative z-10 p-6 lg:p-10">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <Gift size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">{section.title || labels.title}</h3>
          </div>

          <HomeLexicalDescription
            content={section.description}
            className="mb-5 text-sm leading-relaxed text-white/75 lg:max-w-xl [&_p]:text-white/75"
            fallback={labels.description}
          />

          {/* Benefits — equal-width cards so labels never crowd or wrap awkwardly */}
          <div className="mb-6 grid grid-cols-3 gap-2.5 lg:max-w-xl">
            {(benefits.length ? benefits : fallbackBenefits).map((item, index) => {
              const benefit = item as Record<string, unknown>;
              const label = metadataText(benefit.label, locale) || formatLabel(labels.benefit, { index: index + 1 });
              const value = typeof benefit.value === 'string' ? benefit.value : '';
              const icon = String(benefit.icon || '');

              return (
                <div
                  key={`${label}-${index}`}
                  className="flex flex-col items-center gap-2 rounded-xl bg-white/10 px-2 py-3 text-center ring-1 ring-white/15"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    {value ? (
                      <span className="text-base font-extrabold text-white">{value}</span>
                    ) : icon === 'Star' ? (
                      <Star size={18} className="text-white" />
                    ) : (
                      <Award size={18} className="text-white" />
                    )}
                  </div>
                  <span className="text-[11px] font-semibold leading-tight text-white/90">{label}</span>
                </div>
              );
            })}
          </div>

          <Link
            href={section.buttonHref || '/n/app/mobile/profile/rewards'}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#0C3B2E] transition-colors hover:bg-[#E8F1EC] active:scale-[0.98] sm:w-auto"
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
