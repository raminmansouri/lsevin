"use client";

import {
  ArrowLeft,
  Share2,
  Heart,
  MapPin,
  Star,
  BadgeCheck,
  Award,
  Clock,
  Phone,
  Mail,
  Shield,
  Users,
  CheckCircle2,
  TrendingUp,
  Image as ImageIcon,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";

import ReviewForm, { type ReviewFormSubmitValue } from "../../../components/ReviewForm";
import { DigikalaReviewCard } from "../../../components/DigikalaReviewCard";
import { useReviewEligibility } from "../../../components/useReviewEligibility";
import RecommendationsSection from "../../../components/RecommendationsSection";
import { PriceTextClient } from "@/features/finance/components/price-text-client";
import { useFetchProviderPageData } from "@/features/service-providers/api/client/fetch-provider-page-data";
import type { Review } from "@/features/service-providers/types/provider-page-types";
import { hasLexicalContent, LexicalRenderer } from "@/components/editor/lexical-renderer";
import { env } from "@/config/env/client";
import { useNavigate } from "@/hooks/use-navigate";
import { useCurrentSession } from "@/hooks/use-current-session";
import { CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { VideoGallery } from "@/components/media/video-gallery";
import { ServiceProductsRail } from "@/features/shop/components/ServiceProductsRail";

const FALLBACK_IMAGE = "/placeholder-provider.svg";

type ReviewSort = "newest" | "buyers" | "helpful";

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function mediaUrl(value?: string | null): string {
  const raw = String(value || "").trim();
  if (!raw) return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:")) return raw;

  // Local app assets must stay local. Database/media-library values, even when
  // they start with "/", are file-server paths and should use NEXT_PUBLIC_FILES_URL.
  if (raw.startsWith("/placeholder-") || raw.startsWith("/_next/") || raw.startsWith("/favicon")) return raw;

  const base = env.NEXT_PUBLIC_FILES_URL?.replace(/\/+$/, "");
  // Stored media paths use Windows-style backslashes (e.g. "Categories/services\\file.png").
  // Normalize them to URL separators, otherwise the file-server URL 404s.
  const path = raw.replace(/\\/g, "/").replace(/^\/+/, "");
  return base ? `${base}/${path}` : `/${path}`;
}

function LexicalDescription({ content, className }: { content?: string | null; className?: string }) {
  if (content && hasLexicalContent(content)) {
    return <LexicalRenderer content={content} className={className} />;
  }
  // Some descriptions are stored as plain text (or empty Lexical). Render the plain
  // text when present; render nothing when truly empty — never a bare "-" placeholder.
  const plain = typeof content === "string" ? content.trim() : "";
  const looksLikeJson = plain.startsWith("{") || plain.startsWith("[");
  if (plain && !looksLikeJson) {
    return <p className={className}>{plain}</p>;
  }
  return null;
}

export default function ProviderDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("ProviderPage");
  const { user } = useCurrentSession(false);
  const providerId = firstParam(params.id as string | string[] | undefined);

  const [selectedTab, setSelectedTab] = useState<"overview" | "services" | "specialists" | "reviews">("overview");
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteSaving, setIsFavoriteSaving] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [visibleReviews, setVisibleReviews] = useState<Review[]>([]);
  const [reviewSort, setReviewSort] = useState<ReviewSort>("newest");
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false);

  const currencyOptions = useMemo(
    () => ({
      targetCurrencyCode: searchParams.get("currency"),
      selectedCountryCode: searchParams.get("country"),
      browserCountryCode: searchParams.get("browserCountry"),
      userId: user?.id,
    }),
    [searchParams, user?.id]
  );

  const { data, error, isFetching, refetch } = useFetchProviderPageData(providerId, locale, currencyOptions);
  const reviewEligibility = useReviewEligibility({ open: showReviewForm, providerId, targetType: "provider", locale });
  const sortText: Record<ReviewSort | "more" | "loading", string> = {
    newest: t("reviews.sort.newest"),
    buyers: t("reviews.sort.buyers"),
    helpful: t("reviews.sort.helpful"),
    more: t("reviews.showMore"),
    loading: t("reviews.loading"),
  };

  useEffect(() => {
    if (!data?.provider) return;

    const guestFavoriteKey = `lsevin:favorites:provider:${data.provider.id}`;
    const guestFavorite = typeof window !== "undefined" && window.localStorage.getItem(guestFavoriteKey) === "1";

    setIsFavorited(Boolean(data.provider.isFavorite || (!user?.id && guestFavorite)));
    setVisibleReviews(data.recentReviews || []);
    setHasMoreReviews(Boolean(data.reviewsHasMore));
    setCurrentImageIndex(0);
  }, [data?.provider?.id, data?.provider?.isFavorite, data?.recentReviews, data?.reviewsHasMore, user?.id]);

  if (!data && isFetching) return <ProviderPageSkeleton />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white px-5 py-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          type="button"
          aria-label={t("actions.back")}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="rounded-3xl border border-red-100 bg-red-50 p-6">
          <h1 className="mb-2 text-xl font-bold text-red-900">{t("errors.providerCouldNotBeLoaded")}</h1>
          <p className="text-sm leading-6 text-red-700">
            {error instanceof Error ? error.message : t("errors.tryAgainLater")}
          </p>
        </div>
      </div>
    );
  }

  const provider = data.provider;
  const services = data.services || [];
  const specialists = data.specialists || [];
  const images = provider.images.length ? provider.images : provider.image ? [provider.image] : [FALLBACK_IMAGE];
  const heroImage = mediaUrl(images[Math.min(currentImageIndex, images.length - 1)]);

  const handleShare = async () => {
    const shareData = {
      title: provider.name,
      text: t("share.text", { name: provider.name }),
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share sheet.
      }
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
  };

  const handleFavorite = async () => {
    if (isFavoriteSaving) return;

    const nextValue = !isFavorited;
    setIsFavorited(nextValue);

    if (!user?.id) {
      window.localStorage.setItem(`lsevin:favorites:provider:${provider.id}`, nextValue ? "1" : "0");
      return;
    }

    setIsFavoriteSaving(true);
    try {
      const response = await fetch(`/api/service-providers/${provider.id}/favorite`, {
        method: nextValue ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        throw new Error(problem?.title || t("errors.couldNotUpdateFavorite"));
      }

      const payload = await response.json();
      setIsFavorited(Boolean(payload.isFavorite));
    } catch {
      setIsFavorited(!nextValue);
    } finally {
      setIsFavoriteSaving(false);
    }
  };

  const handleReviewSubmit = async (review: ReviewFormSubmitValue) => {
    if (!user?.id) {
      throw new Error(t("errors.signInToReview"));
    }

    const response = await fetch(`/api/service-providers/${provider.id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
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
    if (payload.review && !payload.requiresModeration) {
      setVisibleReviews((current) => [payload.review, ...current.filter((item) => item.id !== payload.review.id)]);
    }
    await refetch();
  };

  const fetchReviewsPage = async (options: { offset: number; sort: ReviewSort }) => {
    const params = new URLSearchParams({ offset: String(options.offset), limit: "3", sort: options.sort });
    const response = await fetch(`/api/service-providers/${provider.id}/reviews?${params.toString()}`);
    if (!response.ok) throw new Error(t("errors.couldNotLoadReviews"));
    return response.json() as Promise<{ reviews: Review[]; hasMore: boolean }>;
  };

  const changeReviewSort = async (sort: ReviewSort) => {
    if (reviewSort === sort || isLoadingMoreReviews) return;
    setReviewSort(sort);
    setIsLoadingMoreReviews(true);
    try {
      const payload = await fetchReviewsPage({ offset: 0, sort });
      setVisibleReviews(payload.reviews || []);
      setHasMoreReviews(Boolean(payload.hasMore));
    } finally {
      setIsLoadingMoreReviews(false);
    }
  };

  const loadMoreReviews = async () => {
    if (isLoadingMoreReviews || !hasMoreReviews) return;

    setIsLoadingMoreReviews(true);
    try {
      const payload = await fetchReviewsPage({ offset: visibleReviews.length, sort: reviewSort });
      setVisibleReviews((current) => {
        const existing = new Set(current.map((item) => item.id));
        return [...current, ...(payload.reviews || []).filter((item: Review) => !existing.has(item.id))];
      });
      setHasMoreReviews(Boolean(payload.hasMore));
    } finally {
      setIsLoadingMoreReviews(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="relative lg:px-6 lg:pt-6">
        <div className="relative h-80 overflow-hidden bg-gray-100 lg:h-[460px] lg:rounded-[2rem] lg:shadow-xl">
          <ImageWithFallback fill src={heroImage} alt={provider.name} sizes="(min-width: 1024px) 960px, 100vw" priority className="object-cover" fallbackClassName="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

          <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-transform active:scale-95"
              type="button"
              aria-label={t("actions.back")}
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-transform active:scale-95"
                type="button"
                aria-label={t("actions.share")}
              >
                <Share2 size={20} className="text-gray-900" />
              </button>
              <button
                onClick={handleFavorite}
                disabled={isFavoriteSaving}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-transform active:scale-95 disabled:opacity-60"
                type="button"
                aria-label={isFavorited ? t("actions.removeFavorite") : t("actions.addFavorite")}
              >
                <Heart size={20} className={isFavorited ? "fill-[#083f30] text-[#083f30]" : "text-gray-900"} />
              </button>
            </div>
          </div>

          {images.length > 1 ? (
            <>
              <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-black/70 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                <ImageIcon size={16} />
                {currentImageIndex + 1} / {images.length}
              </div>

              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 rounded-full transition-all ${index === currentImageIndex ? "w-6 bg-white" : "w-2 bg-white/50"}`}
                    aria-label={t("gallery.goToImage", { number: index + 1 })}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="px-5 py-6 lg:px-8">
        <div className="mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {provider.verified ? (
              <span className="flex items-center gap-1 rounded-full bg-[#083f30] px-3 py-1 text-xs font-bold text-white">
                <BadgeCheck size={14} /> {t("badges.verified")}
              </span>
            ) : null}
            {provider.accredited ? (
              <span className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                <Award size={14} /> {t("badges.accredited")}
              </span>
            ) : null}
            {provider.providerType ? (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">{provider.providerType}</span>
            ) : null}
            <span className="flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
              <TrendingUp size={14} /> {t("badges.topRated")}
            </span>
          </div>

          <h1 className="mb-2 text-2xl font-bold leading-tight text-gray-900">{provider.name}</h1>
          <LexicalDescription content={provider.description || provider.tagline} className="mb-3 text-base leading-6 text-gray-600" />

          <div className="mb-4 flex items-center gap-2 text-sm text-gray-700">
            <MapPin size={16} className="text-[#083f30]" />
            <span className="font-medium">{provider.location}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star size={20} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-bold text-gray-900">{provider.rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-gray-600">{t("stats.reviews", { count: provider.reviews.toLocaleString(locale) })}</span>
            </div>

            <div className="h-4 w-px bg-gray-300" />

            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{provider.responseTime}</span>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="mb-0.5 text-lg font-bold text-gray-900">{provider.totalPatients}</div>
            <div className="text-xs text-gray-600">{t("stats.patients")}</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="mb-0.5 text-lg font-bold text-gray-900">{provider.successRate}</div>
            <div className="text-xs text-gray-600">{t("stats.success")}</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="mb-0.5 text-lg font-bold text-gray-900">{provider.established}</div>
            <div className="text-xs text-gray-600">{t("stats.since")}</div>
          </div>
        </div>

        {provider.languages.length ? (
          <div className="mb-6 rounded-2xl bg-[#083f30]/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Users size={18} className="text-[#083f30]" />
              <h3 className="font-bold text-gray-900">{t("sections.languages")}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {provider.languages.map((language) => (
                <span key={language} className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
                  {language}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="-mx-5 mb-6 border-b border-gray-200 px-5">
          <div className="flex gap-6 overflow-x-auto hide-scrollbar">
            {[
              { id: "overview", label: t("tabs.overview") },
              { id: "services", label: t("tabs.services") },
              { id: "specialists", label: t("tabs.specialists") },
              { id: "reviews", label: t("tabs.reviews") },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                className={`relative whitespace-nowrap pb-3 text-sm font-semibold transition-colors ${
                  selectedTab === tab.id ? "text-[#083f30]" : "text-gray-500 hover:text-gray-900"
                }`}
                type="button"
              >
                {tab.label}
                {selectedTab === tab.id ? <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#083f30]" /> : null}
              </button>
            ))}
          </div>
        </div>

        {selectedTab === "services" ? (
          <div className="space-y-4">
            {services.length ? services.map((treatment) => (
              <button
                key={treatment.id}
                onClick={() => navigate(`/n/app/mobile/service/${treatment.id}`)}
                className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-start transition-all hover:shadow-lg"
                type="button"
              >
                <div className="flex gap-4 p-4 lg:gap-5 lg:p-5">
                  <span className="relative block h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 lg:h-32 lg:w-40 lg:rounded-2xl">
                    <ImageWithFallback fill src={mediaUrl(treatment.image)} alt={treatment.name} sizes="(min-width: 1024px) 160px, 96px" className="object-cover" fallbackClassName="h-full w-full" />
                  </span>

                  <div className="min-w-0 flex-1">
                    {treatment.popular ? (
                      <span className="mb-2 inline-block rounded-md bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                        {t("services.popular")}
                      </span>
                    ) : null}
                    <h3 className="mb-1 line-clamp-1 font-bold text-gray-900">{treatment.name}</h3>
                    <LexicalDescription content={treatment.description} className="mb-2 line-clamp-2 text-xs leading-5 text-gray-600" />

                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span>{treatment.duration}</span>
                      <span>•</span>
                      <span>{t("services.recovery", { value: treatment.recovery })}</span>
                      {treatment.attributes?.slice(0, 2).map((attribute) => (
                        <span key={`${treatment.id}-${attribute.name}`} className="rounded-md bg-gray-100 px-2 py-0.5 text-gray-700">
                          {attribute.name}: {attribute.value}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-bold text-gray-900">{treatment.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({treatment.reviews})</span>
                      </div>

                      <div className="text-end">
                        <PriceTextClient
                          amount={treatment.price}
                          currencyCode={treatment.currency}
                          locale={locale}
                          showCode
                          className="text-lg font-bold text-[#083f30]"
                        />
                        {treatment.sourceCurrency && treatment.sourceCurrency !== treatment.currency ? (
                          <div className="text-[11px] text-gray-500">
                            {t("services.from")} <PriceTextClient amount={treatment.sourcePrice || 0} currencyCode={treatment.sourceCurrency} locale={locale} showCode />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            )) : <EmptyState title={t("empty.services.title")} text={t("empty.services.text")} />}
          </div>
        ) : null}

        {selectedTab === "specialists" ? (
          <div className="space-y-4">
            {specialists.length ? specialists.map((doctor) => (
              <button
                key={doctor.id}
                onClick={() => navigate(`/n/app/mobile/specialist/${doctor.id}`)}
                className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-start transition-all hover:shadow-lg lg:p-5"
                type="button"
              >
                <div className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    <span className="relative block h-20 w-20 overflow-hidden rounded-xl bg-gray-100 lg:h-28 lg:w-28 lg:rounded-2xl">
                      <ImageWithFallback fill src={mediaUrl(doctor.image)} alt={doctor.name} sizes="(min-width: 1024px) 112px, 80px" className="object-cover" fallbackClassName="h-full w-full" />
                    </span>
                    {doctor.verified ? (
                      <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#083f30]">
                        <BadgeCheck size={14} className="text-[#eacb7f]" />
                      </div>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 font-bold text-gray-900">{doctor.name}</h3>
                    <p className="mb-2 text-sm text-gray-600">{doctor.specialty}</p>
                    <div className="mb-2 flex items-center gap-3 text-xs text-gray-600">
                      <span>{t("specialists.experience", { value: doctor.experience })}</span>
                      <span>•</span>
                      <span>{t("specialists.patients", { value: doctor.patients })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold text-gray-900">{doctor.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </button>
            )) : <EmptyState title={t("empty.specialists.title")} text={t("empty.specialists.text")} />}
          </div>
        ) : null}

        {selectedTab === "reviews" ? (
          <div className="space-y-4">
            <button
              onClick={() => setShowReviewForm(true)}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#083f30] font-bold text-white transition-all hover:bg-[#0a5a44] active:scale-95"
              type="button"
            >
              <MessageSquare size={20} /> {t("reviews.writeReview")}
            </button>

            <div className="flex flex-wrap gap-2">
              {(["newest", "buyers", "helpful"] as ReviewSort[]).map((sort) => (
                <button
                  key={sort}
                  type="button"
                  onClick={() => changeReviewSort(sort)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${reviewSort === sort ? "border-[#083f30] bg-[#083f30] text-white" : "border-gray-200 bg-white text-gray-700"}`}
                  disabled={isLoadingMoreReviews}
                >
                  {sortText[sort]}
                </button>
              ))}
            </div>

            {visibleReviews.length ? visibleReviews.map((review) => (
              <DigikalaReviewCard key={review.id} review={review} locale={locale} providerId={provider.id} />
            )) : <EmptyState title={t("empty.reviews.title")} text={t("empty.reviews.text")} />}

            {hasMoreReviews ? (
              <button
                onClick={loadMoreReviews}
                disabled={isLoadingMoreReviews}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-[#083f30] disabled:opacity-60"
                type="button"
              >
                {isLoadingMoreReviews ? <Loader2 size={16} className="animate-spin" /> : null}
                {isLoadingMoreReviews ? sortText.loading : sortText.more}
              </button>
            ) : null}

            {showReviewForm ? (
              <ReviewForm
                providerName={provider.name}
                onClose={() => setShowReviewForm(false)}
                onSubmit={handleReviewSubmit}
                locale={locale}
                eligibilityState={reviewEligibility.eligibilityState}
                eligibilityMessage={reviewEligibility.eligibilityMessage}
              />
            ) : null}
          </div>
        ) : null}

        {selectedTab === "overview" ? (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-lg font-bold text-gray-900">{t("sections.about")}</h3>
              <LexicalDescription content={provider.about || provider.description || provider.tagline} className="text-sm leading-relaxed text-gray-700" />
            </div>

            {provider.videos && provider.videos.length ? (
              <div>
                <h3 className="mb-3 text-lg font-bold text-gray-900">
                  {locale?.startsWith("fa") ? "ویدیوها" : "Videos"}
                </h3>
                <VideoGallery
                  videos={provider.videos.map((video) => ({
                    id: video.id,
                    src: mediaUrl(video.url),
                    title: video.title ?? null,
                  }))}
                />
              </div>
            ) : null}

            {images.length > 1 ? (
              <div>
                <h3 className="mb-3 text-lg font-bold text-gray-900">{t("sections.gallery")}</h3>
                <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible">
                  {images.map((image, index) => (
                    <button key={`${image}-${index}`} type="button" onClick={() => setCurrentImageIndex(index)} className="relative h-24 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 lg:h-36 lg:w-full lg:flex-shrink lg:rounded-2xl">
                      <ImageWithFallback fill src={mediaUrl(image)} alt={t("gallery.imageAlt", { name: provider.name, number: index + 1 })} sizes="(min-width: 1024px) 25vw, 112px" className="object-cover" fallbackClassName="h-full w-full" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {provider.attributes.length ? (
              <div>
                <h3 className="mb-3 text-lg font-bold text-gray-900">{t("sections.providerDetails")}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {provider.attributes.map((item) => (
                    <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.name}</div>
                      <div className="mt-1 text-sm font-semibold text-gray-900">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {provider.certifications.length ? (
              <div>
                <h3 className="mb-3 text-lg font-bold text-gray-900">{t("sections.certifications")}</h3>
                <div className="space-y-3">
                  {provider.certifications.map((item) => (
                    <div key={item.name} className="rounded-xl border border-gray-100 bg-white p-3">
                      <div className="flex items-start gap-3">
                        {item.verified ? <Shield size={20} className="mt-0.5 flex-shrink-0 text-[#083f30]" /> : <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0 text-gray-400" />}
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </div>
                      {(item.imageUrl || item.secondaryImageUrl) ? (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                          {item.imageUrl ? <span className="rounded-full bg-gray-100 px-2 py-1">{t("certifications.certificateImage", { number: 1 })}</span> : null}
                          {item.secondaryImageUrl ? <span className="rounded-full bg-gray-100 px-2 py-1">{t("certifications.certificateImage", { number: 2 })}</span> : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {provider.policies.length ? (
              <div>
                <h3 className="mb-3 text-lg font-bold text-gray-900">{t("sections.policies")}</h3>
                <div className="space-y-3">
                  {provider.policies.map((policy) => (
                    <div key={policy.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="mb-1 text-sm font-bold text-gray-900">{policy.type}</div>
                      <LexicalDescription content={policy.description} className="text-sm leading-6 text-gray-600" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <h3 className="mb-3 text-lg font-bold text-gray-900">{t("sections.contact")}</h3>
              <div className="space-y-3">
                {provider.phone ? (
                  <a href={`tel:${provider.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-sm text-gray-700 transition-colors hover:text-[#083f30]">
                    <Phone size={18} className="text-[#083f30]" /> <span>{provider.phone}</span>
                  </a>
                ) : null}
                {provider.email ? (
                  <a href={`mailto:${provider.email}`} className="flex items-center gap-3 text-sm text-gray-700 transition-colors hover:text-[#083f30]">
                    <Mail size={18} className="text-[#083f30]" /> <span>{provider.email}</span>
                  </a>
                ) : null}
                {provider.street ? (
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <MapPin size={18} className="text-[#083f30]" /> <span>{provider.street}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <RecommendationsSection
              currentProviderId={provider.id}
              currentCountry={provider.country}
              localRecommendations={data.localRecommendations}
              internationalRecommendations={data.internationalRecommendations}
              locale={locale}
            />

            <ServiceProductsRail src={`/api/shop/provider/${providerId}/products`} locale={locale} />
          </div>
        ) : null}
      </div>

      <div className="safe-area-bottom fixed bottom-20 left-0 right-0 z-40 rounded-t-3xl border-t border-gray-200 bg-white px-5 py-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/n/app/mobile/support")}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gray-100 font-bold text-gray-900 transition-all hover:bg-gray-200 active:scale-95"
            type="button"
          >
            <Phone size={18} /> {t("actions.contact")}
          </button>
          <button
            onClick={() => setSelectedTab("services")}
            className="h-14 flex-[2] rounded-2xl bg-gradient-to-r from-[#083f30] to-[#0a5a44] font-bold text-white transition-all hover:shadow-xl active:scale-95"
            type="button"
          >
            {t("actions.viewServices")}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
      <h3 className="mb-1 font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}

export function ProviderPageSkeleton() {
  return (
    <CardContent className="min-h-screen bg-white p-0 pb-32">
      <div className="space-y-5">
        <Skeleton className="h-80 w-full" />
        <div className="space-y-5 px-5">
          <div className="space-y-3">
            <Skeleton className="h-6 w-44 rounded-full" />
            <Skeleton className="h-8 w-4/5 rounded-md" />
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-2/3 rounded-md" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    </CardContent>
  );
}
