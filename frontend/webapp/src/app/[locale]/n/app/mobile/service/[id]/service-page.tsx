"use client";

import {
  AlertCircle,
  ArrowLeft,
  Award,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Image as ImageIcon,
  Languages,
  MapPin,
  Medal,
  Percent,
  PlusCircle,
  Shield,
  Share2,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import RecommendationSection from "../../components/RecommendationSection";
import ReviewForm, { type ReviewFormSubmitValue } from "../../../components/ReviewForm";
import { DigikalaReviewCard } from "../../../components/DigikalaReviewCard";
import { useReviewEligibility } from "../../../components/useReviewEligibility";
import { PriceConverterCardClient } from "@/features/finance/components/price-converter-card-client";
import { PriceTextClient } from "@/features/finance/components/price-text-client";
import { FavoriteButton } from "@/features/favorites/components/favorite-button";
import { LexicalDescription } from "@/features/service-providers/components/lexical-description";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/config/env/client";
import { useNavigate } from "@/hooks/use-navigate";
import type {
  GetServicePageByIdResponse,
  ProviderAttribute,
  ProviderPolicy,
  ServiceAddon,
  ServiceAttribute,
  ServiceDomainRequirement,
  ServiceGalleryItem,
  ServiceOffer,
  ServiceProviderOffering,
  ServiceSpecialist,
  ServiceUploadRequirement,
  TopReview,
} from "@/features/service-providers/types/service-page.types";

type ServicePageProps = {
  data: GetServicePageByIdResponse;
  serviceId: string;
  locale: string;
};

type ReviewSort = "newest" | "buyers" | "helpful";

function reviewSortLabels(locale?: string | null) {
  const key = String(locale || "en").split("-")[0]?.toLowerCase();
  if (key === "fa") {
    return { newest: "جدیدترین", buyers: "دیدگاه خریداران", helpful: "مفیدترین", more: "مشاهده بیشتر", loading: "در حال بارگذاری..." };
  }
  return { newest: "Newest", buyers: "Booked customers", helpful: "Most helpful", more: "Show more", loading: "Loading reviews..." };
}

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale || "en-US").format(value || 0);
}

function formatReviewDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale || "en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale || "en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatBytes(bytes: number) {
  if (!bytes) return "No limit";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function isAbsoluteUrl(value: string) {
  return /^(https?:)?\/\//i.test(value) || /^data:/i.test(value) || /^blob:/i.test(value);
}

function resolveMediaUrl(value?: string | null) {
  if (!value) return "";
  if (isAbsoluteUrl(value)) return value;

  const base = env.NEXT_PUBLIC_FILES_URL?.replace(/\/+$/, "") ?? "";
  const path = value.replace(/^\/+/, "");

  return base ? `${base}/${path}` : `/${path}`;
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{children}</span>;
}

function MediaPreview({ item, alt, className, sizes = "100vw" }: { item?: ServiceGalleryItem; alt: string; className: string; sizes?: string }) {
  const src = resolveMediaUrl(item?.url);

  if (!src) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-400`}>
        <ImageIcon size={28} />
      </div>
    );
  }

  const mediaType = item?.mediaType?.toLowerCase() || "";

  if (mediaType.includes("video")) {
    return <video src={src} className={className} controls playsInline preload="metadata" />;
  }

  if (mediaType.includes("gif") || src.split("?")[0]?.toLowerCase().endsWith(".gif")) {
    return <img src={src} alt={alt} className={className} loading="lazy" />;
  }

  return (
    <ImageWithFallback
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      fallbackClassName="bg-gray-100"
    />
  );
}

function ThumbImage({ src, alt, className }: { src?: string | null; alt: string; className: string }) {
  const resolved = resolveMediaUrl(src);
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {resolved ? (
        <ImageWithFallback
          fill
          src={resolved}
          alt={alt}
          className="h-full w-full object-cover"
          sizes="(max-width: 768px) 96px, 160px"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-gray-400">
          <ImageIcon size={24} />
        </div>
      )}
    </div>
  );
}

function ProviderOfferingCard({ provider, currentProviderServiceId, locale }: { provider: ServiceProviderOffering; currentProviderServiceId: string; locale: string }) {
  const navigate = useNavigate();
  const isCurrent = provider.providerServiceId === currentProviderServiceId;

  return (
    <button
      type="button"
      onClick={() => navigate(`/n/app/mobile/service/${provider.providerServiceId}`)}
      className={`w-full rounded-2xl border bg-white p-3 text-left transition-all active:scale-[0.99] ${
        isCurrent ? "border-[#083f30] shadow-md ring-1 ring-[#083f30]/10" : "border-gray-200 hover:border-[#083f30] hover:shadow-md"
      }`}
    >
      <div className="flex gap-3">
        <ThumbImage src={provider.image} alt={provider.provider} className="h-24 w-24 flex-shrink-0 rounded-xl lg:h-32 lg:w-40 lg:rounded-2xl" />

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="line-clamp-1 text-sm font-bold text-gray-900">{provider.provider}</h3>
              <p className="line-clamp-1 text-xs text-gray-600">{provider.title}</p>
            </div>
            {isCurrent && <span className="rounded-full bg-[#083f30] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Selected</span>}
          </div>

          <div className="mb-2 flex items-center gap-2 text-xs text-gray-600">
            <Star size={13} className="fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-gray-900">{provider.rating || "—"}</span>
            <span>({formatNumber(provider.reviewCount, locale)})</span>
            {provider.providerTypeName && <span className="truncate">• {provider.providerTypeName}</span>}
          </div>

          <div className="mb-2 flex items-center gap-1 text-xs text-gray-600">
            <MapPin size={12} className="flex-shrink-0" />
            <span className="truncate">{[provider.city, provider.country].filter(Boolean).join(", ")}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 gap-1 overflow-hidden">
              {provider.verified && <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700"><BadgeCheck size={11} /> Verified</span>}
              {provider.sponsored && <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">Sponsored</span>}
            </div>
            <PriceTextClient amount={provider.displayPrice.amount} currencyCode={provider.displayPrice.code} locale={locale} className="whitespace-nowrap text-sm font-bold text-[#083f30]" />
          </div>
        </div>

        <ChevronRight size={16} className="self-center text-gray-400" />
      </div>
    </button>
  );
}

function ProvidersForServiceSection({ providers, currentProviderServiceId, locale }: { providers: ServiceProviderOffering[]; currentProviderServiceId: string; locale: string }) {
  const [showAllProviders, setShowAllProviders] = useState(false);
  const visibleProviders = showAllProviders ? providers : providers.slice(0, 4);
  if (!providers.length) return null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Providers offering this service</h2>
          <p className="mt-1 text-sm text-gray-600">Compare clinics and providers that can deliver this treatment.</p>
        </div>
        <span className="rounded-full bg-[#083f30]/10 px-3 py-1 text-xs font-bold text-[#083f30]">{providers.length}</span>
      </div>

      <div className="space-y-3">
        {visibleProviders.map((provider) => <ProviderOfferingCard key={provider.providerServiceId} provider={provider} currentProviderServiceId={currentProviderServiceId} locale={locale} />)}
      </div>

      {!showAllProviders && providers.length > visibleProviders.length && (
        <button type="button" onClick={() => setShowAllProviders(true)} className="mt-3 text-sm font-semibold text-[#083f30] hover:underline">
          Show {providers.length - visibleProviders.length} more providers
        </button>
      )}
    </section>
  );
}

function ServiceAttributesSection({ attributes }: { attributes: ServiceAttribute[] }) {
  if (!attributes.length) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Service details and options</h2>
      <div className="space-y-3">
        {attributes.map((attribute) => (
          <div key={attribute.id} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900">{attribute.name}</h3>
                {attribute.description && <LexicalDescription content={attribute.description} className="mt-1 text-sm text-gray-600" />}
              </div>
              <div className="flex flex-shrink-0 gap-1">
                {attribute.isRequired && <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700">Required</span>}
                {attribute.affectsPricing && <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">Pricing</span>}
              </div>
            </div>
            {attribute.value && <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800">{attribute.value}</p>}
            {attribute.availableOptions.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {attribute.availableOptions.map((option) => (
                  <Chip key={`${attribute.id}-${option.id}`}>{option.name || option.value}{option.additionalPrice > 0 ? ` +${option.additionalPrice}` : ""}</Chip>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function AddonsSection({ addOns, locale }: { addOns: ServiceAddon[]; locale: string }) {
  if (!addOns.length) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Available add-ons</h2>
      <div className="space-y-3">
        {addOns.map((addon) => (
          <div key={addon.id} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <PlusCircle size={18} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">{addon.name}</h3>
                  {addon.popular && <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-700">Popular</span>}
                  {addon.isRequired && <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700">Required</span>}
                </div>
                {addon.description && <LexicalDescription content={addon.description} className="text-sm leading-relaxed text-gray-600" />}
              </div>
              <PriceTextClient amount={addon.displayPrice.amount} currencyCode={addon.displayPrice.code} locale={locale} className="whitespace-nowrap text-sm font-bold text-[#083f30]" />
            </div>
            {addon.details.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-gray-700">
                {addon.details.map((detail, index) => <li key={`${addon.id}-${index}`} className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-green-600" />{detail}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function OffersSection({ offers, locale }: { offers: ServiceOffer[]; locale: string }) {
  if (!offers.length) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Active offers</h2>
      <div className="space-y-3">
        {offers.map((offer) => (
          <div key={offer.id} className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-amber-950"><Percent size={18} />{offer.title}</h3>
                {offer.subtitle && <p className="mt-1 text-sm text-amber-800">{offer.subtitle}</p>}
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700">-{offer.discountPercent}%</span>
            </div>
            {offer.description && <LexicalDescription content={offer.description} className="text-sm leading-relaxed text-amber-900" />}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-amber-900">
              {offer.code && <span className="rounded-full bg-white px-2 py-1 font-bold">Code: {offer.code}</span>}
              <span>Valid until {formatDate(offer.validUntil, locale)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RequirementsSection({ uploadRequirements, domainRequirements }: { uploadRequirements: ServiceUploadRequirement[]; domainRequirements: ServiceDomainRequirement[] }) {
  if (!uploadRequirements.length && !domainRequirements.length) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Requirements before booking</h2>
      <div className="space-y-3">
        {domainRequirements.map((requirement) => (
          <div key={`domain-${requirement.id}`} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex gap-3">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0 text-blue-600" />
              <div>
                <h3 className="font-bold text-gray-900">{requirement.isMandatory ? "Mandatory requirement" : "Requirement"}</h3>
                <LexicalDescription content={requirement.description} className="mt-1 text-sm text-gray-600" />
              </div>
            </div>
          </div>
        ))}
        {uploadRequirements.map((requirement) => (
          <div key={requirement.id} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-gray-900"><FileText size={18} />{requirement.title}</h3>
                {requirement.description && <LexicalDescription content={requirement.description} className="mt-1 text-sm text-gray-600" />}
              </div>
              {requirement.isRequired && <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700">Required</span>}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              <Chip>Max files: {requirement.maxFiles}</Chip>
              <Chip>Max size: {formatBytes(requirement.maxFileSizeBytes)}</Chip>
              {requirement.allowedExtensions.map((ext) => <Chip key={ext}>{ext}</Chip>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProviderProfileSection({ data }: { data: GetServicePageByIdResponse }) {
  const provider = data.service.providerProfile;
  return (
    <section className="mb-8 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex gap-4">
        <ThumbImage src={provider.image} alt={provider.name} className="h-24 w-24 flex-shrink-0 rounded-2xl lg:h-32 lg:w-40" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="line-clamp-1 text-xl font-bold text-gray-900">{provider.name}</h2>
            {provider.accredited && <BadgeCheck size={18} className="text-[#083f30]" />}
          </div>
          <p className="text-sm font-semibold text-[#083f30]">{provider.providerTypeName || "Provider"}</p>
          <LexicalDescription content={provider.description || data.service.providerDescription} className="mt-1 line-clamp-2 text-sm text-gray-600" fallback="-" />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 p-3"><div className="text-xs text-gray-500">Rating</div><div className="font-bold text-gray-900">{provider.rating || "—"} ({provider.reviewCount})</div></div>
        <div className="rounded-xl bg-gray-50 p-3"><div className="text-xs text-gray-500">Response</div><div className="font-bold text-gray-900">{provider.responseTime || "On request"}</div></div>
        <div className="rounded-xl bg-gray-50 p-3"><div className="text-xs text-gray-500">Established</div><div className="font-bold text-gray-900">{provider.establishedYear || "—"}</div></div>
        <div className="rounded-xl bg-gray-50 p-3"><div className="text-xs text-gray-500">Patients</div><div className="font-bold text-gray-900">{provider.totalPatients || "—"}</div></div>
      </div>

      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex gap-2"><MapPin size={16} className="mt-0.5 flex-shrink-0 text-gray-500" /><span>{[provider.street, provider.city, provider.country].filter(Boolean).join(", ") || "Location on request"}</span></div>
        {provider.languages.length > 0 && <div className="flex gap-2"><Languages size={16} className="mt-0.5 flex-shrink-0 text-gray-500" /><span>{provider.languages.join(", ")}</span></div>}
        {provider.specialties.length > 0 && <div className="flex gap-2"><Sparkles size={16} className="mt-0.5 flex-shrink-0 text-gray-500" /><span>{provider.specialties.join(", ")}</span></div>}
      </div>

      {data.providerAttributes.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {data.providerAttributes.slice(0, 8).map((attr: ProviderAttribute) => <Chip key={attr.id}>{attr.name}: {attr.value}</Chip>)}
        </div>
      )}
    </section>
  );
}

function SpecialistsSection({ specialists, locale }: { specialists: ServiceSpecialist[]; locale: string }) {
  const navigate = useNavigate();

  if (!specialists.length) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Specialists</h2>
      <div className="space-y-3">
        {specialists.map((specialist) => (
          <button
            key={specialist.id}
            type="button"
            onClick={() => navigate(`/n/app/mobile/specialist/${specialist.id}`)}
            className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-[#083f30] hover:shadow-md active:scale-[0.99] lg:p-5"
          >
            <div className="flex gap-3">
              <ThumbImage src={specialist.image} alt={specialist.name} className="h-20 w-20 flex-shrink-0 rounded-2xl lg:h-28 lg:w-28" />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{specialist.name}</h3>
                    <p className="text-sm text-gray-600">{specialist.title || specialist.specialty}</p>
                  </div>
                  {specialist.canProvideThisService && <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700">This service</span>}
                </div>
                <div className="mb-2 flex items-center gap-2 text-xs text-gray-600"><Star size={13} className="fill-yellow-400 text-yellow-400" />{specialist.rating || "—"} ({specialist.reviewCount})</div>
                {specialist.nextAvailableLabel && <p className="text-xs font-semibold text-[#083f30]">{specialist.nextAvailableLabel}</p>}
              </div>
            </div>
            {specialist.biography && <LexicalDescription content={specialist.biography} className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600" />}
            <div className="mt-3 flex flex-wrap gap-2">
              {specialist.experience && <Chip>{specialist.experience}</Chip>}
              {specialist.languages.slice(0, 4).map((language) => <Chip key={language}>{language}</Chip>)}
              {specialist.consultationFee > 0 && <Chip>Consultation: <PriceTextClient amount={specialist.consultationDisplayPrice.amount} currencyCode={specialist.consultationDisplayPrice.code} locale={locale} /></Chip>}
            </div>
            {specialist.certifications.length > 0 && (
              <div className="mt-3 space-y-1 text-xs text-gray-600">
                {specialist.certifications.slice(0, 2).map((cert) => <div key={cert.id} className="flex items-center gap-1"><Medal size={13} />{cert.name}{cert.issuer ? ` — ${cert.issuer}` : ""}</div>)}
              </div>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

function PoliciesSection({ policies }: { policies: ProviderPolicy[] }) {
  if (!policies.length) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Provider policies</h2>
      <div className="space-y-3">
        {policies.map((policy) => (
          <div key={policy.id} className="rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="mb-1 font-bold text-gray-900">{policy.type}</h3>
            <LexicalDescription content={policy.description} className="text-sm leading-relaxed text-gray-600" fallback="-" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ServicePage({ data, serviceId, locale }: ServicePageProps) {
  const navigate = useNavigate();
  const service = data.service;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllFAQs, setShowAllFAQs] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(service.displayCurrencyCode || service.currency);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [visibleReviews, setVisibleReviews] = useState<TopReview[]>(data.topReviews || []);
  const [reviewSort, setReviewSort] = useState<ReviewSort>("newest");
  const [hasMoreReviews, setHasMoreReviews] = useState((data.topReviews || []).length >= 3);
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false);

  useEffect(() => {
    setVisibleReviews(data.topReviews || []);
    setHasMoreReviews((data.topReviews || []).length >= 3);
  }, [data.topReviews]);

  const reviewEligibility = useReviewEligibility({
    open: showReviewForm,
    providerId: service.clinicId,
    targetType: "service",
    providerServiceId: service.providerServiceId,
    locale,
  });
  const sortText = reviewSortLabels(locale);

  const galleryItems = service.galleryItems || [];
  const currentGalleryItem = galleryItems[currentImageIndex];
  const selectedPrice = service.priceOptions.find((price) => price.targetCurrencyCode === selectedCurrency) || service.priceOptions[0];
  const selectedOriginalPrice = service.originalPriceOptions.find((price) => price.targetCurrencyCode === selectedCurrency) || service.originalPriceOptions[0];
  const displayPrice = selectedPrice?.targetAmount ?? service.displayPrice.amount;
  const displayCurrencyCode = selectedPrice?.targetCurrencyCode ?? service.displayPrice.code;
  const displayOriginalPrice = selectedOriginalPrice?.targetAmount ?? service.displayOriginalPrice.amount;
  const hasDiscount = displayOriginalPrice > displayPrice;
  const importantInfo = useMemo(() => {
    const items = [
      service.requiresSpecialist ? "Specialist selection may be required during booking" : "This service can be booked without choosing a specialist first",
      service.bookingUiMode === "date_range" ? "This service uses date-range availability" : "Availability is confirmed during the booking flow",
      data.uploadRequirements.length ? "Medical or identity documents may be requested" : "No upload requirement is configured for this service yet",
      "Final treatment plan and price can depend on provider assessment",
    ];
    return items;
  }, [data.uploadRequirements.length, service.bookingUiMode, service.requiresSpecialist]);

  const handleShare = async () => {
    const shareText = service.clinic ? `Check out ${service.name} at ${service.clinic}` : `Check out ${service.name}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: service.name, text: shareText, url: window.location.href });
      } catch {
        // User cancelled the native share sheet.
      }
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
  };

  const handleReviewSubmit = async (review: ReviewFormSubmitValue) => {
    const response = await fetch(`/api/service-providers/${service.clinicId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: review.rating,
        title: review.title,
        treatment: review.title || service.name,
        comment: review.comment,
        pros: review.pros,
        cons: review.cons,
        imageUrls: [],
        targetType: "service",
        providerServiceId: service.providerServiceId,
      }),
    });

    if (!response.ok) {
      const problem = await response.json().catch(() => null);
      throw new Error(problem?.title || "Could not submit review.");
    }
  };


  const fetchReviewsPage = async (options: { offset: number; sort: ReviewSort }) => {
    const params = new URLSearchParams({
      offset: String(options.offset),
      limit: "3",
      sort: options.sort,
      targetType: "service",
      providerServiceId: service.providerServiceId,
    });
    const response = await fetch(`/api/service-providers/${service.clinicId}/reviews?${params.toString()}`);
    if (!response.ok) throw new Error("Could not load reviews.");
    return response.json() as Promise<{ reviews: TopReview[]; hasMore: boolean }>;
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
        return [...current, ...(payload.reviews || []).filter((item) => !existing.has(item.id))];
      });
      setHasMoreReviews(Boolean(payload.hasMore));
    } finally {
      setIsLoadingMoreReviews(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-36">
      <div className="relative lg:px-6 lg:pt-6">
        <div className="relative h-80 overflow-hidden bg-gray-100 lg:h-[460px] lg:rounded-[2rem] lg:shadow-xl">
          <MediaPreview item={currentGalleryItem} alt={service.name} className="h-full w-full object-cover" sizes="(min-width: 1024px) 960px, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
            <button type="button" onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-transform hover:scale-105 active:scale-95">
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleShare} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-transform hover:scale-105 active:scale-95">
                <Share2 size={18} className="text-gray-900" />
              </button>
              <FavoriteButton
                entityId={service.providerServiceId}
                entityType="service"
                initialIsFavorite={service.isFavorite}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
                iconClassName="h-[18px] w-[18px]"
                ariaLabel="Save service"
              />
            </div>
          </div>

          {galleryItems.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-5">
              {galleryItems.slice(0, 6).map((item, index) => (
                <button key={item.id} type="button" onClick={() => setCurrentImageIndex(index)} className={`h-14 w-14 overflow-hidden rounded-xl border-2 transition-all ${index === currentImageIndex ? "border-white shadow-lg" : "border-white/30 opacity-70"}`}>
                  <div className="relative h-full w-full">
                    <MediaPreview item={item} alt={`${service.name} ${index + 1}`} className="h-full w-full object-cover" sizes="56px" />
                  </div>
                </button>
              ))}
              {galleryItems.length > 6 && (
                <button type="button" onClick={() => navigate(`/n/app/mobile/service/${serviceId}/gallery`)} className="flex h-14 w-14 items-center justify-center rounded-xl bg-black/50 text-xs font-bold text-white backdrop-blur-sm">+{galleryItems.length - 6}</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-6 lg:px-8">
        <div className="mb-3 flex flex-wrap gap-2">
          {service.verified && <span className="flex items-center gap-1 rounded-full bg-[#083f30] px-3 py-1 text-xs font-bold text-white"><BadgeCheck size={14} />Verified</span>}
          {service.popular && <span className="flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white"><TrendingUp size={14} />Featured</span>}
          {service.categoryName && <span className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white"><Award size={14} />{service.categoryName}</span>}
          {service.tags.slice(0, 3).map((tag) => <span key={tag} className="flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white"><Tag size={13} />{tag}</span>)}
        </div>

        <h1 className="mb-2 text-2xl font-bold leading-tight text-gray-900">{service.name}</h1>
        <div className="mb-4 text-base text-gray-600">
          <LexicalDescription content={service.subtitle} fallback="-" className="leading-relaxed text-muted-foreground" />
        </div>

        <button type="button" onClick={() => navigate(`/n/app/mobile/provider/${service.clinicId}`)} className="-mx-2 mb-4 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-gray-50">
          <ThumbImage src={service.providerProfile.image} alt={service.clinic} className="h-12 w-12 flex-shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2">
              <h3 className="truncate font-bold text-gray-900">{service.clinic}</h3>
              {service.verified && <BadgeCheck size={16} className="text-[#083f30]" />}
            </div>
            <p className="truncate text-sm text-gray-600">{service.location || "Location on request"}</p>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </button>

        <div className="mb-6 flex items-center gap-4 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-2"><Star size={20} className="fill-yellow-400 text-yellow-400" /><span className="text-xl font-bold text-gray-900">{service.rating || "—"}</span><span className="text-sm text-gray-600">({formatNumber(service.reviews, locale)} reviews)</span></div>
          {service.providerCount > 1 && <span className="text-sm font-semibold text-[#083f30]">{service.providerCount} providers available</span>}
        </div>

        <PriceConverterCardClient label="Package Price" convertedPrices={service.priceOptions} convertedOriginalPrices={service.originalPriceOptions} selectedCurrencyCode={selectedCurrency} onCurrencyChange={setSelectedCurrency} badgeText="Provider package price" locale={locale} />

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gray-50 p-4"><Clock size={20} className="mb-2 text-[#083f30]" /><div className="mb-1 text-xs text-gray-600">Duration</div><div className="font-bold text-gray-900">{service.duration}</div></div>
          <div className="rounded-xl bg-gray-50 p-4"><Calendar size={20} className="mb-2 text-[#083f30]" /><div className="mb-1 text-xs text-gray-600">Recovery</div><div className="font-bold text-gray-900">{service.recovery}</div></div>
          <div className="rounded-xl bg-gray-50 p-4"><Shield size={20} className="mb-2 text-[#083f30]" /><div className="mb-1 text-xs text-gray-600">Success Rate</div><div className="font-bold text-gray-900">{service.successRate}</div></div>
          <div className="rounded-xl bg-gray-50 p-4"><Users size={20} className="mb-2 text-[#083f30]" /><div className="mb-1 text-xs text-gray-600">Satisfaction</div><div className="font-bold text-gray-900">{service.satisfaction}</div></div>
        </div>

        <ProviderProfileSection data={data} />
        <SpecialistsSection specialists={data.specialists} locale={locale} />
        <OffersSection offers={data.offers} locale={locale} />
        <ServiceAttributesSection attributes={data.serviceAttributes} />
        <AddonsSection addOns={data.addOns} locale={locale} />
        <RequirementsSection uploadRequirements={data.uploadRequirements} domainRequirements={data.domainRequirements} />

        {data.included.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900">What's Included</h2>
            <div className="space-y-3">
              {data.included.map((item, idx) => <div key={`${item}-${idx}`} className="flex items-start gap-3"><CheckCircle2 size={20} className="mt-0.5 flex-shrink-0 text-green-600" /><span className="text-sm leading-relaxed text-gray-700">{item}</span></div>)}
            </div>
          </section>
        )}

        {data.process.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Treatment Process</h2>
            <div className="space-y-4">
              {data.process.map((step, idx) => (
                <div key={`${step.step}-${idx}`} className="flex gap-4">
                  <div className="flex flex-shrink-0 flex-col items-center"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#083f30] font-bold text-white">{step.step}</div>{idx < data.process.length - 1 && <div className="my-1 h-12 w-0.5 bg-gray-200" />}</div>
                  <div className="flex-1 pb-4"><div className="mb-1 flex items-center justify-between gap-3"><h3 className="font-bold text-gray-900">{step.title}</h3>{step.duration && <span className="text-xs font-medium text-gray-500">{step.duration}</span>}</div>{step.description && <LexicalDescription content={step.description} className="text-sm leading-relaxed text-gray-600" />}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0 text-blue-600" />
            <div>
              <h3 className="mb-2 font-bold text-blue-900">Important Information</h3>
              <ul className="space-y-1.5 text-sm text-blue-800">{importantInfo.map((item) => <li key={item}>• {item}</li>)}</ul>
            </div>
          </div>
        </div>

        <ProvidersForServiceSection providers={data.providers} currentProviderServiceId={service.providerServiceId} locale={locale} />
        {(data.localRecommendations.length > 0 || data.internationalRecommendations.length > 0) && <RecommendationSection localRecommendations={data.localRecommendations} internationalRecommendations={data.internationalRecommendations} userCountry={service.country || "your country"} />}

        <section className="mb-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900">Patient Reviews</h2>
            <div className="flex items-center gap-3">
              {hasMoreReviews ? (
                <button type="button" onClick={loadMoreReviews} className="text-sm font-semibold text-[#083f30] hover:underline">View All</button>
              ) : null}
              <button type="button" onClick={() => setShowReviewForm(true)} className="rounded-xl bg-[#083f30] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0a5a44]">Write Review</button>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["newest", "buyers", "helpful"] as ReviewSort[]).map((sort) => (
              <button
                key={sort}
                type="button"
                onClick={() => changeReviewSort(sort)}
                disabled={isLoadingMoreReviews}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${reviewSort === sort ? "border-[#083f30] bg-[#083f30] text-white" : "border-gray-200 bg-white text-gray-700"}`}
              >
                {sortText[sort]}
              </button>
            ))}
          </div>
          {visibleReviews.length > 0 ? (
            <div className="space-y-4">
              {visibleReviews.map((review) => (
                <DigikalaReviewCard key={review.id} review={review} locale={locale} providerId={service.clinicId} />
              ))}
              {hasMoreReviews ? (
                <button type="button" onClick={loadMoreReviews} disabled={isLoadingMoreReviews} className="flex h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold text-[#083f30] disabled:opacity-60">
                  {isLoadingMoreReviews ? sortText.loading : sortText.more}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">No public reviews yet. Booked customers can submit a review for this service.</div>
          )}
        </section>

        {showReviewForm ? (
          <ReviewForm
            providerName={service.clinic || service.name}
            treatmentName={service.name}
            onClose={() => setShowReviewForm(false)}
            onSubmit={handleReviewSubmit}
            locale={locale}
            eligibilityState={reviewEligibility.eligibilityState}
            eligibilityMessage={reviewEligibility.eligibilityMessage}
          />
        ) : null}

        <PoliciesSection policies={data.policies} />

        {data.faqs.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <div className="space-y-3">{data.faqs.slice(0, showAllFAQs ? data.faqs.length : 2).map((faq, idx) => <div key={`${faq.q}-${idx}`} className="rounded-xl bg-gray-50 p-4"><h3 className="mb-2 font-bold text-gray-900">{faq.q}</h3><p className="text-sm leading-relaxed text-gray-700">{faq.a}</p></div>)}</div>
            {!showAllFAQs && data.faqs.length > 2 && <button type="button" onClick={() => setShowAllFAQs(true)} className="mt-3 text-sm font-semibold text-[#083f30] hover:underline">Show {data.faqs.length - 2} more questions</button>}
          </section>
        )}
      </div>

      <div className="safe-area-bottom fixed bottom-20 left-0 right-0 z-40 rounded-t-3xl border-t border-gray-200 bg-white px-5 py-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 text-xs text-gray-600">Total Package Price</div>
            <div className="flex items-baseline gap-2"><PriceTextClient amount={displayPrice} currencyCode={displayCurrencyCode} locale={locale} className="text-2xl font-bold text-[#083f30]" />{hasDiscount && <PriceTextClient amount={displayOriginalPrice} currencyCode={displayCurrencyCode} locale={locale} className="text-sm text-gray-500 line-through" />}</div>
          </div>
          <button type="button" onClick={() => navigate(`/n/app/mobile/booking?serviceId=${service.providerServiceId}`)} className="flex h-14 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#083f30] to-[#0a5a44] px-8 font-bold text-white transition-all hover:shadow-xl active:scale-95">Book Now</button>
        </div>
      </div>
    </div>
  );
}

export function ServicePageSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-36">
      <Skeleton className="h-80 w-full rounded-none" />
      <div className="space-y-6 px-5 py-6">
        <div className="flex gap-2"><Skeleton className="h-7 w-20 rounded-full" /><Skeleton className="h-7 w-24 rounded-full" /></div>
        <Skeleton className="h-8 w-4/5" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /></div>
      </div>
    </div>
  );
}
