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
import { useLocale } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";

import ReviewForm from "../../../components/ReviewForm";
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

const FALLBACK_IMAGE = "/placeholder-provider.svg";

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
  const path = raw.replace(/^\/+/, "");
  return base ? `${base}/${path}` : `/${path}`;
}

function LexicalDescription({ content, className }: { content?: string | null; className?: string }) {
  return content && hasLexicalContent(content) ? (
    <LexicalRenderer content={content} className={className} />
  ) : (
    <p className={className}>-</p>
  );
}

export default function ProviderDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { user } = useCurrentSession(false);
  const providerId = firstParam(params.id as string | string[] | undefined);

  const [selectedTab, setSelectedTab] = useState<"overview" | "treatments" | "doctors" | "reviews">("overview");
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteSaving, setIsFavoriteSaving] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [visibleReviews, setVisibleReviews] = useState<Review[]>([]);
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
        >
          <ArrowLeft size={20} />
        </button>
        <div className="rounded-3xl border border-red-100 bg-red-50 p-6">
          <h1 className="mb-2 text-xl font-bold text-red-900">Provider could not be loaded</h1>
          <p className="text-sm leading-6 text-red-700">
            {error instanceof Error ? error.message : "Please try again later."}
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
      text: `Check out ${provider.name} on LSevin`,
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
        throw new Error(problem?.title || "Could not update favorite status.");
      }

      const payload = await response.json();
      setIsFavorited(Boolean(payload.isFavorite));
    } catch {
      setIsFavorited(!nextValue);
    } finally {
      setIsFavoriteSaving(false);
    }
  };

  const handleReviewSubmit = async (review: { rating: number; title: string; comment: string; images: File[] }) => {
    if (!user?.id) {
      throw new Error("Please sign in and complete your profile before writing a review.");
    }

    const response = await fetch(`/api/service-providers/${provider.id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        rating: review.rating,
        title: review.title,
        treatment: review.title || "Provider experience",
        comment: review.comment,
        imageUrls: [],
      }),
    });

    if (!response.ok) {
      const problem = await response.json().catch(() => null);
      throw new Error(problem?.title || "Could not submit review.");
    }

    const payload = await response.json();
    if (payload.review) {
      setVisibleReviews((current) => [payload.review, ...current.filter((item) => item.id !== payload.review.id)]);
    }
    await refetch();
  };

  const loadMoreReviews = async () => {
    if (isLoadingMoreReviews || !hasMoreReviews) return;

    setIsLoadingMoreReviews(true);
    try {
      const response = await fetch(`/api/service-providers/${provider.id}/reviews?offset=${visibleReviews.length}&limit=10`);
      if (!response.ok) throw new Error("Could not load reviews.");
      const payload = await response.json();
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
      <div className="relative">
        <div className="relative h-80 overflow-hidden bg-gray-100">
          <ImageWithFallback fill src={heroImage} alt={provider.name} sizes="100vw" priority className="object-cover" fallbackClassName="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

          <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-transform active:scale-95"
              type="button"
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-transform active:scale-95"
                type="button"
              >
                <Share2 size={20} className="text-gray-900" />
              </button>
              <button
                onClick={handleFavorite}
                disabled={isFavoriteSaving}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-transform active:scale-95 disabled:opacity-60"
                type="button"
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
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="px-5 py-6">
        <div className="mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {provider.verified ? (
              <span className="flex items-center gap-1 rounded-full bg-[#083f30] px-3 py-1 text-xs font-bold text-white">
                <BadgeCheck size={14} /> Verified
              </span>
            ) : null}
            {provider.accredited ? (
              <span className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                <Award size={14} /> Accredited
              </span>
            ) : null}
            {provider.providerType ? (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">{provider.providerType}</span>
            ) : null}
            <span className="flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
              <TrendingUp size={14} /> Top Rated
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
              <span className="text-sm text-gray-600">({provider.reviews.toLocaleString()} reviews)</span>
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
            <div className="text-xs text-gray-600">Patients</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="mb-0.5 text-lg font-bold text-gray-900">{provider.successRate}</div>
            <div className="text-xs text-gray-600">Success</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="mb-0.5 text-lg font-bold text-gray-900">{provider.established}</div>
            <div className="text-xs text-gray-600">Since</div>
          </div>
        </div>

        {provider.languages.length ? (
          <div className="mb-6 rounded-2xl bg-[#083f30]/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Users size={18} className="text-[#083f30]" />
              <h3 className="font-bold text-gray-900">Languages</h3>
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
              { id: "overview", label: "Overview" },
              { id: "treatments", label: "Treatments" },
              { id: "doctors", label: "Doctors" },
              { id: "reviews", label: "Reviews" },
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

        {selectedTab === "treatments" ? (
          <div className="space-y-4">
            {services.length ? services.map((treatment) => (
              <button
                key={treatment.id}
                onClick={() => navigate(`/n/app/mobile/service/${treatment.id}`)}
                className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition-all hover:shadow-lg"
                type="button"
              >
                <div className="flex gap-4 p-4">
                  <span className="relative block h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    <ImageWithFallback fill src={mediaUrl(treatment.image)} alt={treatment.name} sizes="96px" className="object-cover" fallbackClassName="h-full w-full" />
                  </span>

                  <div className="min-w-0 flex-1">
                    {treatment.popular ? (
                      <span className="mb-2 inline-block rounded-md bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                        POPULAR
                      </span>
                    ) : null}
                    <h3 className="mb-1 line-clamp-1 font-bold text-gray-900">{treatment.name}</h3>
                    <LexicalDescription content={treatment.description} className="mb-2 line-clamp-2 text-xs leading-5 text-gray-600" />

                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span>{treatment.duration}</span>
                      <span>•</span>
                      <span>{treatment.recovery} recovery</span>
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

                      <div className="text-right">
                        <PriceTextClient
                          amount={treatment.price}
                          currencyCode={treatment.currency}
                          locale={locale}
                          showCode
                          className="text-lg font-bold text-[#083f30]"
                        />
                        {treatment.sourceCurrency && treatment.sourceCurrency !== treatment.currency ? (
                          <div className="text-[11px] text-gray-500">
                            from <PriceTextClient amount={treatment.sourcePrice || 0} currencyCode={treatment.sourceCurrency} locale={locale} showCode />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            )) : <EmptyState title="No active treatments" text="This provider has not published active services yet." />}
          </div>
        ) : null}

        {selectedTab === "doctors" ? (
          <div className="space-y-4">
            {specialists.length ? specialists.map((doctor) => (
              <button
                key={doctor.id}
                onClick={() => navigate(`/n/app/mobile/specialist/${doctor.id}`)}
                className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-all hover:shadow-lg"
                type="button"
              >
                <div className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    <span className="relative block h-20 w-20 overflow-hidden rounded-xl bg-gray-100">
                      <ImageWithFallback fill src={mediaUrl(doctor.image)} alt={doctor.name} sizes="80px" className="object-cover" fallbackClassName="h-full w-full" />
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
                      <span>{doctor.experience} exp</span>
                      <span>•</span>
                      <span>{doctor.patients} patients</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold text-gray-900">{doctor.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </button>
            )) : <EmptyState title="No doctors listed" text="Specialists will appear here when the provider publishes them." />}
          </div>
        ) : null}

        {selectedTab === "reviews" ? (
          <div className="space-y-4">
            <button
              onClick={() => setShowReviewForm(true)}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#083f30] font-bold text-white transition-all hover:bg-[#0a5a44] active:scale-95"
              type="button"
            >
              <MessageSquare size={20} /> Write a Review
            </button>

            {visibleReviews.length ? visibleReviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-600">
                    {review.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{review.name}</h4>
                      {review.verified ? <BadgeCheck size={16} className="text-[#083f30]" /> : null}
                    </div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-gray-600">
                      {review.country ? <span>{review.country}</span> : null}
                      {review.country ? <span>•</span> : null}
                      <span>{review.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <span className="mb-3 inline-block rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">{review.treatment}</span>
                <p className="mb-3 text-sm leading-relaxed text-gray-700">{review.review}</p>
                {review.images?.length ? (
                  <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                    {review.images.map((img, idx) => (
                      <span key={`${img}-${idx}`} className="relative block h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <ImageWithFallback fill src={mediaUrl(img)} alt="Review" sizes="80px" className="object-cover" fallbackClassName="h-full w-full" />
                      </span>
                    ))}
                  </div>
                ) : null}
                <button className="text-xs font-medium text-gray-600 hover:text-gray-900" type="button">
                  👍 Helpful ({review.helpful})
                </button>
              </div>
            )) : <EmptyState title="No public reviews yet" text="Reviews will appear here after customers publish them." />}

            {hasMoreReviews ? (
              <button
                onClick={loadMoreReviews}
                disabled={isLoadingMoreReviews}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-[#083f30] disabled:opacity-60"
                type="button"
              >
                {isLoadingMoreReviews ? <Loader2 size={16} className="animate-spin" /> : null}
                {isLoadingMoreReviews ? "Loading reviews..." : "Load more reviews"}
              </button>
            ) : null}

            {showReviewForm ? (
              <ReviewForm
                providerName={provider.name}
                onClose={() => setShowReviewForm(false)}
                onSubmit={handleReviewSubmit}
              />
            ) : null}
          </div>
        ) : null}

        {selectedTab === "overview" ? (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-lg font-bold text-gray-900">About</h3>
              <LexicalDescription content={provider.about || provider.description || provider.tagline} className="text-sm leading-relaxed text-gray-700" />
            </div>

            {images.length > 1 ? (
              <div>
                <h3 className="mb-3 text-lg font-bold text-gray-900">Gallery</h3>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button key={`${image}-${index}`} type="button" onClick={() => setCurrentImageIndex(index)} className="relative h-24 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200">
                      <ImageWithFallback fill src={mediaUrl(image)} alt={`${provider.name} ${index + 1}`} sizes="112px" className="object-cover" fallbackClassName="h-full w-full" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {provider.attributes.length ? (
              <div>
                <h3 className="mb-3 text-lg font-bold text-gray-900">Provider Details</h3>
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
                <h3 className="mb-3 text-lg font-bold text-gray-900">Certifications</h3>
                <div className="space-y-3">
                  {provider.certifications.map((item) => (
                    <div key={item.name} className="flex items-start gap-3">
                      {item.verified ? <Shield size={20} className="mt-0.5 flex-shrink-0 text-[#083f30]" /> : <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0 text-gray-400" />}
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {provider.policies.length ? (
              <div>
                <h3 className="mb-3 text-lg font-bold text-gray-900">Policies</h3>
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
              <h3 className="mb-3 text-lg font-bold text-gray-900">Contact</h3>
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
            <Phone size={18} /> Contact
          </button>
          <button
            onClick={() => setSelectedTab("treatments")}
            className="h-14 flex-[2] rounded-2xl bg-gradient-to-r from-[#083f30] to-[#0a5a44] font-bold text-white transition-all hover:shadow-xl active:scale-95"
            type="button"
          >
            View Treatments
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
