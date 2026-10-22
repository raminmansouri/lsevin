"use client";

import Image from "next/image";
import { ArrowLeft, Award, BadgeCheck, Clock, Loader2, Mail, MapPin, Phone, Share2, Shield, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo,useRef, useState, type ReactNode } from "react";

import { MapViewer } from "@/components/map/map-viewer";
import { isProviderConfigured, resolveMapProvider } from "@/components/map/map-provider";
import { VideoGallery } from "@/components/media/video-gallery";
import { ConsultationCtaButton } from "@/features/consultation/components/consultation-cta-button";
import { FavoriteButton } from "@/features/favorites/components/favorite-button";
import { ViewerPrice } from "@/features/finance/components/viewer-price";
import { useFetchProviderPageData } from "@/features/service-providers/api/client/fetch-provider-page-data";
import { BeforeAfterGallery } from "@/features/service-providers/components/before-after-gallery";
import { resolveMediaUrl } from "@/features/service-providers/lib/media-url";
import type { ProviderPageDataResponse, Review } from "@/features/service-providers/types/provider-page-types";
import { ServiceProductsRail } from "@/features/shop/components/ServiceProductsRail";
import { useCurrentSession } from "@/hooks/use-current-session";
import { Link } from "@/i18n/navigation";
import { DigikalaReviewCard } from "@/app/[locale]/n/app/components/DigikalaReviewCard";
import RecommendationsSection from "@/app/[locale]/n/app/components/RecommendationsSection";
import ReviewForm, { type ReviewFormSubmitValue } from "@/app/[locale]/n/app/components/ReviewForm";
import { useReviewEligibility } from "@/app/[locale]/n/app/components/useReviewEligibility";
import { AnimatedWords, CountUp, Magnetic, Reveal, ScrollParallax, Tilt } from "../components/motion";

type ReviewSort = "newest" | "buyers" | "helpful";
const SECTIONS = ["about", "services", "beforeAfter", "specialists", "reviews"] as const;
type SectionId = (typeof SECTIONS)[number];

/** Rich text may be Lexical JSON; render it as plain paragraphs. */
function paragraphs(value?: string | null): string[] {
  const raw = (value ?? "").trim();
  if (!raw) return [];
  if (!raw.startsWith("{")) return raw.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  try {
    const json = JSON.parse(raw);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const walk = (node: any): string => node?.text ?? (Array.isArray(node?.children) ? node.children.map(walk).join("") : "");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (json?.root?.children ?? []).map((block: any) => walk(block).trim()).filter(Boolean);
  } catch {
    return [raw];
  }
}

function RichText({ content, className = "" }: { content?: string | null; className?: string }) {
  const blocks = paragraphs(content);
  if (!blocks.length) return null;
  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((block, index) => (
        <p key={index}>{block}</p>
      ))}
    </div>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="lsd-heading mb-10 text-4xl font-black text-[#0e1a16]">{children}</h2>;
}

export function DesktopProviderView({ initialData }: { initialData?: ProviderPageDataResponse }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("ProviderPage");
  const tConsultation = useTranslations("Consultation");
  const tGallery = useTranslations("SpecialistPage");
  const { user } = useCurrentSession(false);
  const providerId = String(Array.isArray(params.id) ? params.id[0] : params.id ?? "");

  const currencyOptions = useMemo(
    () => ({
      targetCurrencyCode: searchParams.get("currency"),
      selectedCountryCode: searchParams.get("country"),
      browserCountryCode: searchParams.get("browserCountry"),
      userId: user?.id,
    }),
    [searchParams, user?.id]
  );
  

  const { data, refetch } = useFetchProviderPageData(providerId, locale, currencyOptions, initialData);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("about");
  const [visibleReviews, setVisibleReviews] = useState<Review[]>([]);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [reviewSort, setReviewSort] = useState<ReviewSort>("newest");
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const reviewEligibility = useReviewEligibility({ open: showReviewForm, providerId, targetType: "provider", locale });

  useEffect(() => {
    if (!data?.provider) return;
    setVisibleReviews(data.recentReviews || []);
    setHasMoreReviews(Boolean(data.reviewsHasMore));
  }, [data?.provider?.id, data?.recentReviews, data?.reviewsHasMore]);

  // The hero gallery moves on by itself every few seconds, with a crossfade.
  const heroCount = data?.provider?.images?.length || (data?.provider?.image ? 1 : 0);
  useEffect(() => {
    if (heroCount < 2 || heroPaused) return;
    const timer = window.setTimeout(() => setHeroIndex((index) => (index + 1) % heroCount), 5000);
    return () => window.clearTimeout(timer);
  }, [heroIndex, heroCount, heroPaused]);

  // Highlight, in the sticky section nav, the section right under it: we look at the point
  // just below the nav and ask which section is there. Robust for short sections and any scroller.
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const nav = navRef.current;
      if (!nav) return;
      const rect = nav.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + 30, rect.bottom + 70)?.closest<HTMLElement>('[id^="lsd-"]');
      const id = hit?.id.replace("lsd-", "");
      if (id && (SECTIONS as readonly string[]).includes(id)) setActiveSection(id as SectionId);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [data?.provider?.id]);

  if (!data?.provider) return null;
  
  const { provider } = data;

  const images = (provider.images?.length ? provider.images : provider.image ? [provider.image] : []).map((src) => resolveMediaUrl(src));
  const heroImage = images[heroIndex] ?? images[0] ?? "";
  const logo = provider.image ? resolveMediaUrl(provider.image) : null;
  const number = (value: number, digits = 0) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
  const hasMap = provider.latitude != null && provider.longitude != null;

  const sectionLabels: Record<SectionId, string> = {
    about: t("tabs.overview"),
    services: t("tabs.services"),
    beforeAfter: tGallery("gallery.beforeAfterTitle"),
    specialists: t("tabs.specialists"),
    reviews: t("tabs.reviews"),
  };
  const scrollTo = (id: SectionId) => document.getElementById(`lsd-${id}`)?.scrollIntoView({ behavior: "smooth" });

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: provider.name, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      // The visitor cancelled the share sheet.
    }
  };

  const fetchReviewsPage = async (options: { offset: number; sort: ReviewSort }) => {
    const query = new URLSearchParams({ offset: String(options.offset), limit: "3", sort: options.sort });
    const response = await fetch(`/api/service-providers/${provider.id}/reviews?${query.toString()}`);
    if (!response.ok) throw new Error(t("errors.couldNotLoadReviews"));
    return response.json() as Promise<{ reviews: Review[]; hasMore: boolean }>;
  };
  const changeReviewSort = async (sort: ReviewSort) => {
    if (reviewSort === sort || isLoadingReviews) return;
    setReviewSort(sort);
    setIsLoadingReviews(true);
    try {
      const payload = await fetchReviewsPage({ offset: 0, sort });
      setVisibleReviews(payload.reviews || []);
      setHasMoreReviews(Boolean(payload.hasMore));
    } finally {
      setIsLoadingReviews(false);
    }
  };
  const loadMoreReviews = async () => {
    if (isLoadingReviews || !hasMoreReviews) return;
    setIsLoadingReviews(true);
    try {
      const payload = await fetchReviewsPage({ offset: visibleReviews.length, sort: reviewSort });
      setVisibleReviews((current) => {
        const existing = new Set(current.map((item) => item.id));
        return [...current, ...(payload.reviews || []).filter((item) => !existing.has(item.id))];
      });
      setHasMoreReviews(Boolean(payload.hasMore));
    } finally {
      setIsLoadingReviews(false);
    }
  };
  const handleReviewSubmit = async (review: ReviewFormSubmitValue) => {
    if (!user) throw new Error(t("errors.signInToReview"));
    const response = await fetch(`/api/service-providers/${provider.id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: review.rating,
        title: review.title,
        treatment: review.title || t("reviews.providerExperience"),
        comment: review.comment,
        pros: review.pros,
        cons: review.cons,
        imageUrls: [],
        targetType: "provider",
      }),
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => null);
      throw new Error(problem?.title || t("errors.couldNotSubmitReview"));
    }
    const payload = await response.json();
    const requiresModeration = Boolean(payload.requiresModeration);
    if (payload.review) {
      setVisibleReviews((current) => [{ ...payload.review, pending: requiresModeration }, ...current.filter((item) => item.id !== payload.review.id)]);
    }
    if (!requiresModeration) await refetch();
    return { requiresModeration };
  };

  const stats = [
    provider.reviews ? { label: t("tabs.reviews"), value: <CountUp value={provider.reviews} locale={locale} /> } : null,
    provider.established ? { label: t("stats.since"), value: number(provider.established).replace(/[٬,]/g, "") } : null,
    provider.totalPatients ? { label: t("stats.patients"), value: provider.totalPatients } : null,
    provider.successRate ? { label: t("stats.success"), value: provider.successRate } : null,
  ].filter(Boolean) as { label: string; value: ReactNode }[];

  return (
    <div className="lsd hidden pb-24 xl:block">
      {/* Hero */}
      <section className="lsd-container pt-6">
        <div
          onMouseEnter={() => setHeroPaused(true)}
          onMouseLeave={() => setHeroPaused(false)}
          className="relative h-[600px] overflow-hidden rounded-[44px] bg-[#062a20]"
        >
          {images.map((src, index) => (
            <div key={src + index} className={`absolute inset-0 transition-opacity duration-[1200ms] ${index === heroIndex ? "opacity-100" : "opacity-0"}`}>
              <ScrollParallax className="absolute inset-0" strength={50}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={provider.name} className={`h-full w-full object-cover ${index === heroIndex ? "lsd-kenburns" : ""}`} />
              </ScrollParallax>
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[#062a20] via-[#062a20]/40 to-[#062a20]/10" />

          <div className="absolute end-8 top-8 flex gap-2">
            <FavoriteButton
              entityId={provider.id}
              entityType="provider"
              initialIsFavorite={false}
              className="!h-12 !w-12 bg-white/15 text-white backdrop-blur-md hover:bg-white/25"
              iconClassName="h-5 w-5"
            />
            <button
              type="button"
              onClick={share}
              aria-label={t("actions.share")}
              className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25"
            >
              <Share2 size={19} />
            </button>
          </div>

          {/* Gallery thumbnails: a slim glass column on the side of the cover */}
          {images.length > 1 ? (
            <div className="lsd-glass absolute end-8 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2 rounded-2xl p-2">
              {images.slice(0, 5).map((src, index) => (
                <button
                  key={src + index}
                  type="button"
                  onClick={() => setHeroIndex(index)}
                  aria-label={`${index + 1}`}
                  className={`h-12 w-14 overflow-hidden rounded-xl transition duration-300 ${
                    index === heroIndex ? "ring-2 ring-[#eacb7f]" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-10 p-12 pb-24 text-white">
            <div className="flex items-end gap-7">
              <span className="lsd-medal-ring grid h-32 w-32 shrink-0 place-items-center rounded-full p-[3px]">
                <span className="relative grid h-full w-full place-items-center overflow-hidden rounded-full bg-[#062a20]">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Image src="/brand/lsevin-mark-reversed.png" alt="" width={40} height={57} />
                  )}
                </span>
              </span>
              <div className="max-w-2xl space-y-4">
                <div className="flex flex-wrap gap-2">
                  {provider.verified ? (
                    <span className="lsd-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-[#eacb7f]">
                      <BadgeCheck size={14} />
                      {t("badges.verified")}
                    </span>
                  ) : null}
                  {provider.accredited ? (
                    <span className="lsd-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-[#eacb7f]">
                      <Shield size={14} />
                      {t("badges.accredited")}
                    </span>
                  ) : null}
                  {provider.rating >= 4.5 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eacb7f] px-3 py-1 text-xs font-black text-[#062a20]">
                      <Award size={14} />
                      {t("badges.topRated")}
                    </span>
                  ) : null}
                </div>
                <h1 className="text-[52px] font-black leading-[1.2]">
                  <AnimatedWords text={provider.name} />
                </h1>
                {paragraphs(provider.tagline).length ? (
                  <p className="line-clamp-2 max-w-xl text-lg leading-8 text-white/75">{paragraphs(provider.tagline).join(" ")}</p>
                ) : null}
                <p className="flex items-center gap-2 text-[15px] text-white/80">
                  <MapPin size={17} className="text-[#eacb7f]" />
                  {[provider.providerType, provider.location].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>


          </div>
        </div>

        {/* Stats */}
        <Reveal className="relative z-10 mx-12 -mt-14">
          <div className="flex items-center justify-between gap-6 rounded-[28px] bg-white px-10 py-7 shadow-[0_30px_70px_-35px_rgba(6,42,32,0.5)] ring-1 ring-[#dce4e0]">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-[#0e1a16]">{number(provider.rating || 0, 1)}</span>
              <span className="flex">
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star key={star} size={18} className={star < Math.round(provider.rating) ? "fill-[#c9a55a] text-[#c9a55a]" : "text-[#dce4e0]"} />
                ))}
              </span>
            </div>
            {stats.map((stat) => (
              <div key={stat.label} className="border-s border-[#dce4e0] ps-6">
                <p className="text-2xl font-black text-[#083f30]">{stat.value}</p>
                <p className="mt-1 text-sm text-[#56675f]">{stat.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Body */}
      <div className="lsd-container mt-14 grid grid-cols-[1fr_370px] gap-12">
        <div className="min-w-0">
          {/* Sticky section nav */}
          <nav ref={navRef} className="sticky top-24 z-20 mb-12 flex w-fit gap-1 rounded-full bg-white/85 p-1.5 shadow-sm ring-1 ring-[#dce4e0] backdrop-blur-md">
            {SECTIONS.filter((id) => id !== "beforeAfter" || data.beforeAfter?.length).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                  activeSection === id ? "bg-[#083f30] text-[#eacb7f]" : "text-[#56675f] hover:text-[#083f30]"
                }`}
              >
                {sectionLabels[id]}
              </button>
            ))}
          </nav>

          {/* About */}
          <section id="lsd-about" className="lsd-anchor space-y-10">
            <Reveal>
              <Heading>{t("sections.about")}</Heading>
              <RichText content={provider.about || provider.description || provider.tagline} className="text-[17px] leading-9 text-[#3d4b45]" />
            </Reveal>

            {provider.languages.length ? (
              <Reveal>
                <h3 className="mb-4 text-lg font-black text-[#0e1a16]">{t("sections.languages")}</h3>
                <div className="flex flex-wrap gap-2">
                  {provider.languages.map((language) => (
                    <span key={language} className="rounded-full border border-[#c9a55a]/40 bg-[#fbf3de] px-4 py-1.5 text-sm text-[#8c6b2c]">
                      {language}
                    </span>
                  ))}
                </div>
              </Reveal>
            ) : null}

            {provider.attributes.length ? (
              <Reveal>
                <h3 className="mb-4 text-lg font-black text-[#0e1a16]">{t("sections.providerDetails")}</h3>
                <dl className="grid grid-cols-2 gap-3">
                  {provider.attributes.map((attribute) => (
                    <div key={attribute.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 ring-1 ring-[#dce4e0]">
                      <dt className="text-sm text-[#56675f]">{attribute.name}</dt>
                      <dd className="text-sm font-bold text-[#0e1a16]">{attribute.value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            ) : null}

            {provider.certifications.length ? (
              <Reveal>
                <h3 className="mb-4 text-lg font-black text-[#0e1a16]">{t("sections.certifications")}</h3>
                <div className="grid grid-cols-3 gap-4">
                  {provider.certifications.map((certification, index) => (
                    <div key={`${certification.name}-${index}`} className="lsd-certificate relative flex flex-col items-center gap-3 rounded-[24px] px-5 py-6 text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#f3dc9f] to-[#c9a55a] text-[#062a20]">
                        <Award size={22} />
                      </span>
                      <span className="text-sm font-bold text-[#0e1a16]">{certification.name}</span>
                      {certification.verified ? <BadgeCheck size={16} className="text-[#0f5a45]" /> : null}
                    </div>
                  ))}
                </div>
              </Reveal>
            ) : null}
          </section>

          {/* Services */}
          <section id="lsd-services" className="lsd-anchor mt-20">
            <Reveal>
              <Heading>{t("tabs.services")}</Heading>
            </Reveal>
            {data.services.length ? (
              <div className="grid grid-cols-2 gap-6">
                {data.services.map((service, index) => (
                  <Reveal key={service.id} delay={(index % 2) * 90}>
                    <Link href={`/n/app/mobile/service/${service.id}`} className="group block h-full">
                      <Tilt className="flex h-full flex-col">
                        <div className="relative h-52 overflow-hidden bg-[#0f5a45]">
                          {service.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={resolveMediaUrl(service.image)} alt={service.name} className="lsd-zoom h-full w-full object-cover" />
                          ) : null}
                          {service.popular ? (
                            <span className="absolute start-4 top-4 rounded-full bg-[#eacb7f] px-3 py-1 text-xs font-black text-[#062a20]">{t("services.popular")}</span>
                          ) : null}
                          <div className="absolute end-4 top-4">
                            <FavoriteButton
                              entityId={service.id}
                              entityType="service"
                              initialIsFavorite={false}
                              className="!h-10 !w-10 bg-white/90 text-gray-700 shadow-sm"
                              iconClassName="h-[18px] w-[18px]"
                            />
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col gap-3 p-6">
                          <h3 className="text-lg font-black leading-snug text-[#0e1a16]">{service.name}</h3>
                          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#56675f]">
                            {service.duration ? (
                              <span className="flex items-center gap-1.5">
                                <Clock size={15} className="text-[#c9a55a]" />
                                {service.duration}
                              </span>
                            ) : null}
                            {service.recovery ? <span>{t("services.recovery", { value: service.recovery })}</span> : null}
                          </p>
                          <div className="mt-auto flex items-end justify-between gap-4 pt-2">
                            <ViewerPrice
                              amount={service.sourcePrice ?? service.price}
                              sourceCurrencyCode={service.sourceCurrency ?? service.currency}
                              providerId={provider.id}
                              locale={locale}
                              className="text-xl font-black text-[#083f30]"
                            />
                            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#083f30] text-white transition-transform duration-500 group-hover:-translate-x-1">
                              <ArrowLeft size={18} className="ltr:rotate-180" />
                            </span>
                          </div>
                        </div>
                      </Tilt>
                    </Link>
                  </Reveal>
                ))}
              </div>
            ) : (
              <p className="text-[#56675f]">{t("empty.services.text")}</p>
            )}
          </section>

          {data.beforeAfter?.length ? (
            <section id="lsd-beforeAfter" className="lsd-anchor mt-20">
              <Reveal>
                <Heading>{tGallery("gallery.beforeAfterTitle")}</Heading>
                <BeforeAfterGallery items={data.beforeAfter} />
              </Reveal>
            </section>
          ) : null}

          {/* Specialists */}
          <section id="lsd-specialists" className="lsd-anchor mt-20">
            <Reveal>
              <Heading>{t("tabs.specialists")}</Heading>
            </Reveal>
            {data.specialists.length ? (
              <div className="grid grid-cols-3 gap-6">
                {data.specialists.map((doctor, index) => (
                  <Reveal key={doctor.id} delay={index * 80}>
                    <Link href={`/n/app/mobile/specialist/${doctor.id}`} className="group block text-center">
                      <div className="relative mx-auto h-60 w-full overflow-hidden rounded-t-full rounded-b-[28px] bg-[#0f5a45]">
                        {doctor.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resolveMediaUrl(doctor.image)} alt={doctor.name} className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
                        ) : null}
                        {doctor.verified ? (
                          <span className="absolute bottom-3 start-1/2 grid h-10 w-10 place-items-center rounded-full bg-[#eacb7f] text-[#062a20] rtl:translate-x-1/2 ltr:-translate-x-1/2">
                            <BadgeCheck size={20} />
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-4 text-lg font-black text-[#0e1a16]">{doctor.name}</h3>
                      <p className="text-sm text-[#8c6b2c]">{doctor.specialty}</p>
                      <p className="mt-1 text-xs text-[#56675f]">
                        {[doctor.experience, doctor.patients].filter(Boolean).join(" · ")}
                      </p>
                    </Link>
                  </Reveal>
                ))}
              </div>
            ) : (
              <p className="text-[#56675f]">{t("empty.specialists.text")}</p>
            )}
          </section>

          {provider.videos?.length ? (
            <Reveal className="mt-20">
              <VideoGallery videos={provider.videos.map((video) => ({ id: video.id, src: resolveMediaUrl(video.url), title: video.title ?? null }))} />
            </Reveal>
          ) : null}

          {/* Reviews */}
          <section id="lsd-reviews" className="lsd-anchor mt-20">
            <Reveal className="mb-8 flex items-end justify-between gap-6">
              <h2 className="lsd-heading text-4xl font-black text-[#0e1a16]">{t("tabs.reviews")}</h2>
              <div className="flex items-center gap-2">
                {(["newest", "buyers", "helpful"] as ReviewSort[]).map((sort) => (
                  <button
                    key={sort}
                    type="button"
                    onClick={() => changeReviewSort(sort)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      reviewSort === sort ? "bg-[#083f30] text-white" : "bg-white text-[#56675f] ring-1 ring-[#dce4e0] hover:text-[#083f30]"
                    }`}
                  >
                    {t(`reviews.sort.${sort}`)}
                  </button>
                ))}
                <button type="button" onClick={() => setShowReviewForm(true)} className="lsd-btn lsd-btn-gold h-10 px-5 text-sm">
                  {t("reviews.writeReview")}
                </button>
              </div>
            </Reveal>

            {showReviewForm ? (
              <div className="mb-8">
                <ReviewForm
                  providerName={provider.name}
                  onClose={() => setShowReviewForm(false)}
                  onSubmit={handleReviewSubmit}
                  locale={locale}
                  eligibilityState={reviewEligibility.eligibilityState}
                  eligibilityMessage={reviewEligibility.eligibilityMessage}
                />
              </div>
            ) : null}

            {visibleReviews.length ? (
              <div className="columns-2 gap-6 [&>*]:mb-6 [&>*]:break-inside-avoid">
                {visibleReviews.map((review) => (
                  <DigikalaReviewCard key={review.id} review={review} locale={locale} providerId={provider.id} />
                ))}
              </div>
            ) : (
              <p className="text-[#56675f]">{t("empty.reviews.text")}</p>
            )}

            {hasMoreReviews ? (
              <button
                type="button"
                onClick={loadMoreReviews}
                disabled={isLoadingReviews}
                className="mx-auto mt-4 flex h-12 items-center gap-2 rounded-full border border-[#083f30]/20 px-8 text-sm font-bold text-[#083f30] transition hover:bg-[#083f30] hover:text-white disabled:opacity-60"
              >
                {isLoadingReviews ? <Loader2 size={16} className="animate-spin" /> : null}
                {isLoadingReviews ? t("reviews.loading") : t("reviews.showMore")}
              </button>
            ) : null}
          </section>

          {provider.policies.length ? (
            <Reveal className="mt-20">
              <Heading>{t("sections.policies")}</Heading>
              <div className="space-y-3">
                {provider.policies.map((policy) => (
                  <details key={policy.id} className="group rounded-2xl bg-white px-6 py-5 ring-1 ring-[#dce4e0] open:ring-[#c9a55a]/60">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-[#0e1a16]">
                      {policy.type}
                      <span className="text-[#c9a55a] transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <RichText content={policy.description} className="mt-4 text-sm leading-7 text-[#56675f]" />
                  </details>
                ))}
              </div>
            </Reveal>
          ) : null}

          {hasMap ? (
            <Reveal className="mt-20">
              <Heading>{t("locationMap.title")}</Heading>
              {isProviderConfigured(resolveMapProvider({ coordinates: { latitude: provider.latitude!, longitude: provider.longitude! } })) ? (
                <div className="overflow-hidden rounded-[28px] ring-1 ring-[#dce4e0]">
                  <MapViewer coordinates={{ latitude: provider.latitude!, longitude: provider.longitude! }} height="360px" />
                </div>
              ) : null}
              <div className="mt-5 flex items-center justify-between gap-6">
                {provider.street ? (
                  <p className="flex items-start gap-2 text-[15px] text-[#3d4b45]">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-[#c9a55a]" />
                    {provider.street}
                  </p>
                ) : (
                  <span />
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${provider.latitude},${provider.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lsd-btn lsd-btn-green h-12 shrink-0 px-6 text-sm"
                >
                  <MapPin size={16} className="text-[#eacb7f]" />
                  {t("locationMap.getDirections")}
                </a>
              </div>
            </Reveal>
          ) : null}

          <div className="mt-20 space-y-16">
            <RecommendationsSection
              currentProviderId={provider.id}
              currentCountry={provider.country}
              localRecommendations={data.localRecommendations}
              internationalRecommendations={data.internationalRecommendations}
              locale={locale}
            />
            <ServiceProductsRail src={`/api/shop/provider/${providerId}/products`} locale={locale} />
          </div>
        </div>

        {/* Sticky concierge card */}
        <aside>
          <div className="sticky top-28 space-y-5">
            <Reveal direction="left" className="overflow-hidden rounded-[32px] bg-[#062a20] text-white shadow-[0_40px_80px_-40px_rgba(6,42,32,0.8)]">
              <div className="relative p-8">
                <Image src="/brand/lsevin-mark-reversed.png" alt="" aria-hidden="true" width={150} height={212} className="pointer-events-none absolute -bottom-10 -end-6 opacity-10" />
                <p className="relative text-xl font-black leading-snug">{provider.name}</p>
                <div className="relative mt-3 flex items-center gap-2 text-sm text-white/75">
                  <Star size={16} className="fill-[#eacb7f] text-[#eacb7f]" />
                  <span className="font-bold text-white">{number(provider.rating || 0, 1)}</span>
                  {provider.reviews ? <span>({number(provider.reviews)})</span> : null}
                </div>
                {provider.responseTime ? (
                  <p className="relative mt-2 flex items-center gap-2 text-sm text-white/75">
                    <Clock size={16} className="text-[#eacb7f]" />
                    {provider.responseTime}
                  </p>
                ) : null}

                <div className="relative mt-7 space-y-3">
                  <Magnetic>
                    <button type="button" onClick={() => scrollTo("services")} className="lsd-btn lsd-btn-gold h-14 w-full">
                      {t("actions.viewServices")}
                      <ArrowLeft size={18} className="ltr:rotate-180" />
                    </button>
                  </Magnetic>
                  <ConsultationCtaButton
                    categoryName={provider.name}
                    label={tConsultation("cta.beforeBooking")}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-full border border-[#eacb7f]/40 text-sm font-bold text-[#eacb7f] transition hover:bg-[#eacb7f]/10"
                  />
                  <Link
                    href="/n/app/mobile/support"
                    className="flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold text-white/80 transition hover:text-white"
                  >
                    {t("actions.contact")}
                  </Link>
                </div>
              </div>

              {provider.phone || provider.email ? (
                <div className="space-y-3 border-t border-white/10 px-8 py-6 text-sm">
                  {provider.phone ? (
                    <a href={`tel:${provider.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-white/80 transition hover:text-[#eacb7f]">
                      <Phone size={17} className="text-[#eacb7f]" />
                      <span dir="ltr">{provider.phone}</span>
                    </a>
                  ) : null}
                  {provider.email ? (
                    <a href={`mailto:${provider.email}`} className="flex items-center gap-3 text-white/80 transition hover:text-[#eacb7f]">
                      <Mail size={17} className="text-[#eacb7f]" />
                      <span className="truncate">{provider.email}</span>
                    </a>
                  ) : null}
                </div>
              ) : null}
            </Reveal>
          </div>
        </aside>
      </div>
    </div>
  );
}