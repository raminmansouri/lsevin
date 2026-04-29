"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  GalleryHorizontalEnd,
  Globe,
  GraduationCap,
  Heart,
  Image as ImageIcon,
  MapPin,
  Share2,
  Sparkles,
  Star,
  Stethoscope,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";

import { hasLexicalContent, LexicalRenderer } from "@/components/editor/lexical-renderer";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { env } from "@/config/env/client";
import { PriceTextClient } from "@/features/finance/components/price-text-client";
import type {
  SpecialistAchievement,
  SpecialistAvailability,
  SpecialistBeforeAfter,
  SpecialistGalleryItem,
  SpecialistPageResponse,
  SpecialistProvider,
  SpecialistReview,
  SpecialistService,
} from "@/features/service-providers/types/specialist-page-types";
import { useNavigate } from "@/hooks/use-navigate";

function mediaUrl(value?: string | null) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  return `${env.NEXT_PUBLIC_FILES_URL}/${trimmed.replace(/^\/+/, "")}`;
}

function MediaImage({
  src,
  alt,
  className,
  fallbackClassName,
  sizes = "100vw",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  sizes?: string;
}) {
  const resolvedSrc = mediaUrl(src);

  if (!resolvedSrc) {
    return (
      <div className={fallbackClassName || className || "flex h-full w-full items-center justify-center bg-gray-100"}>
        <ImageIcon className="h-7 w-7 text-gray-400" />
      </div>
    );
  }

  return (
    <ImageWithFallback
      fill
      src={resolvedSrc}
      alt={alt}
      sizes={sizes}
      className={className}
      fallbackClassName={fallbackClassName}
    />
  );
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating || 0)));

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={size}
          className={index < rounded ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
      <p className="font-bold text-gray-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
    </div>
  );
}

function DescriptionBlock({ content, className }: { content?: string | null; className?: string }) {
  if (content && hasLexicalContent(content)) {
    return <LexicalRenderer content={content} className={className || "text-sm leading-relaxed text-gray-700"} />;
  }

  if (content?.trim()) {
    return <p className={className || "text-sm leading-relaxed text-gray-700"}>{content}</p>;
  }

  return <p className={className || "text-sm leading-relaxed text-gray-500"}>-</p>;
}

function dayName(dayOfWeek: number) {
  return ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][dayOfWeek] || "Day";
}

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale || "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatInterval(value: string) {
  return value.replace(/^0 days?\s*/i, "").replace(/\.000000$/, "").slice(0, 5);
}

function PriceLine({ service }: { service: SpecialistService }) {
  const price = service.price;

  return (
    <div>
      <PriceTextClient
        amount={price.displayAmount}
        currencyCode={price.displayCurrencyCode}
        showCode
        className="text-lg font-extrabold text-[#083f30]"
      />
      {price.converted ? (
        <div className="mt-0.5 text-xs text-gray-500">
          ≈ <PriceTextClient amount={price.sourceAmount} currencyCode={price.sourceCurrencyCode} showCode />
        </div>
      ) : null}
    </div>
  );
}

function GalleryModal({
  open,
  onClose,
  gallery,
  beforeAfter,
}: {
  open: boolean;
  onClose: () => void;
  gallery: SpecialistGalleryItem[];
  beforeAfter: SpecialistBeforeAfter[];
}) {
  if (!open) return null;

  const allGallery = gallery.filter((item) => item.mediaType !== "video");

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Full gallery</h3>
            <p className="text-sm text-gray-500">Specialist media and before/after results</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 active:scale-95"
            aria-label="Close gallery"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {allGallery.length ? (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {allGallery.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                  <div className="relative aspect-square">
                    <MediaImage src={item.url} alt={item.title || "Gallery image"} className="object-cover" />
                  </div>
                  {item.title || item.description ? (
                    <div className="p-3">
                      {item.title ? <p className="text-sm font-bold text-gray-900">{item.title}</p> : null}
                      {item.description ? <p className="line-clamp-2 text-xs text-gray-500">{item.description}</p> : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {beforeAfter.length ? (
            <div className="space-y-4">
              <h4 className="font-bold text-gray-900">Before / after</h4>
              {beforeAfter.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                  <div className="grid grid-cols-2 gap-px bg-gray-200">
                    <div className="relative aspect-[4/3]">
                      <MediaImage src={item.before} alt={`${item.procedure || "Procedure"} before`} className="object-cover" />
                      <span className="absolute left-2 top-2 rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white">Before</span>
                    </div>
                    <div className="relative aspect-[4/3]">
                      <MediaImage src={item.after} alt={`${item.procedure || "Procedure"} after`} className="object-cover" />
                      <span className="absolute right-2 top-2 rounded-lg bg-green-500 px-2 py-1 text-xs font-bold text-white">After</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-gray-900">{item.procedure || "Result"}</p>
                    {item.months ? <p className="text-sm text-gray-500">After {item.months} months</p> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!allGallery.length && !beforeAfter.length ? (
            <EmptyState title="No gallery yet" description="Gallery items will appear here after they are added in admin." />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProvidersSection({ providers, navigate }: { providers: SpecialistProvider[]; navigate: ReturnType<typeof useNavigate> }) {
  if (!providers.length) {
    return <EmptyState title="No workplaces connected" description="This specialist is not connected to any active provider yet." />;
  }

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <button
          key={provider.providerStaffId}
          type="button"
          onClick={() => navigate(`/n/app/mobile/provider/${provider.id}`)}
          className="flex w-full gap-3 rounded-2xl border border-gray-200 bg-white p-3 text-left transition-colors hover:bg-gray-50 active:scale-[0.99]"
        >
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-100">
            <MediaImage src={provider.image} alt={provider.name} className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5">
              <h4 className="truncate font-bold text-gray-900">{provider.name}</h4>
              {provider.accredited ? <BadgeCheck size={16} className="flex-shrink-0 text-[#083f30]" /> : null}
            </div>
            {provider.providerTypeName ? <p className="text-xs font-semibold text-[#083f30]">{provider.providerTypeName}</p> : null}
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={13} />
              <span className="truncate">{provider.location || "Location on request"}</span>
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1 font-semibold text-gray-800">
                <Star size={13} className="fill-yellow-400 text-yellow-400" /> {provider.rating || "-"}
              </span>
              <span>{provider.reviewCount} reviews</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function ServicesSection({ services, navigate }: { services: SpecialistService[]; navigate: ReturnType<typeof useNavigate> }) {
  if (!services.length) {
    return <EmptyState title="No services connected" description="Services will appear after staff services and provider services are connected in admin." />;
  }

  return (
    <div className="space-y-3">
      {services.map((service) => (
        <button
          key={service.providerServiceId}
          type="button"
          onClick={() => navigate(`/n/app/mobile/service/${service.providerServiceId}`)}
          className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:bg-gray-50 active:scale-[0.99]"
        >
          <div className="flex gap-3 p-3">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-100">
              <MediaImage src={service.image} alt={service.name} className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="line-clamp-2 font-bold text-gray-900">{service.name}</h4>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-500">{service.providerName}</p>
                </div>
                {service.isPopular ? (
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-700">Popular</span>
                ) : null}
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                {service.durationMinutes > 0 ? (
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {service.durationMinutes} min
                  </span>
                ) : null}
                <span className="flex items-center gap-1">
                  <Star size={13} className="fill-yellow-400 text-yellow-400" /> {service.rating || "-"}
                </span>
                {service.city || service.country ? <span>{[service.city, service.country].filter(Boolean).join(", ")}</span> : null}
              </div>

              <PriceLine service={service} />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function ReviewsSection({ reviews, locale }: { reviews: SpecialistReview[]; locale: string }) {
  if (!reviews.length) {
    return <EmptyState title="No reviews yet" description="Public reviews from the specialist’s connected providers will appear here." />;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700">
              {review.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h4 className="font-bold text-gray-900">{review.name}</h4>
                {review.verified ? <BadgeCheck size={16} className="text-[#083f30]" /> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {review.country ? <span>{review.country}</span> : null}
                {review.country ? <span>•</span> : null}
                <span>{formatDate(review.date, locale)}</span>
                <span>•</span>
                <span>{review.providerName}</span>
              </div>
            </div>
            <Stars rating={review.rating} />
          </div>

          {review.treatment ? (
            <span className="mb-3 inline-block rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
              {review.treatment}
            </span>
          ) : null}

          <p className="text-sm leading-relaxed text-gray-700">{review.review}</p>

          {review.images.length ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {review.images.map((image, index) => (
                <div key={`${review.id}-${image}-${index}`} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  <MediaImage src={image} alt="Review image" className="object-cover" sizes="80px" />
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-3 text-xs font-medium text-gray-500">👍 Helpful ({review.helpful})</div>
        </div>
      ))}
    </div>
  );
}

function CredentialsSection({ data }: { data: SpecialistPageResponse }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          <GraduationCap size={22} className="text-[#083f30]" />
          Education
        </h3>
        {data.education.length ? (
          <div className="space-y-3">
            {data.education.map((edu) => (
              <div key={edu.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h4 className="font-bold text-gray-900">{edu.degree}</h4>
                  {edu.year ? <span className="text-sm font-semibold text-[#083f30]">{edu.year}</span> : null}
                </div>
                <p className="text-sm text-gray-600">{edu.institution}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No education records" description="Education records are not added for this specialist yet." />
        )}
      </div>

      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          <Award size={22} className="text-[#083f30]" />
          Certifications & memberships
        </h3>
        {data.certifications.length ? (
          <div className="space-y-2">
            {data.certifications.map((cert) => (
              <div key={cert.id} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
                {cert.verified ? <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0 text-green-600" /> : <Award size={20} className="mt-0.5 flex-shrink-0 text-gray-400" />}
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{cert.name}</h4>
                  {cert.issuer ? <p className="text-sm text-gray-600">{cert.issuer}</p> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No certifications" description="Certifications and memberships are not added yet." />
        )}
      </div>

      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          <UserRoundCheck size={22} className="text-[#083f30]" />
          Credentials
        </h3>
        {data.credentials.length ? (
          <div className="space-y-2">
            {data.credentials.map((credential) => (
              <div key={credential.id} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
                {credential.verified ? <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0 text-green-600" /> : null}
                <p className="text-sm font-semibold text-gray-800">{credential.credential}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No credentials" description="Credentials are not added for this specialist yet." />
        )}
      </div>
    </div>
  );
}

function AvailabilitySection({ items }: { items: SpecialistAvailability[] }) {
  if (!items.length) return null;

  return (
    <div>
      <h3 className="mb-3 text-lg font-bold text-gray-900">Availability</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 text-sm">
            <div>
              <p className="font-bold text-gray-900">{item.isRecurring ? dayName(item.dayOfWeek) : item.specificDate || dayName(item.dayOfWeek)}</p>
              <p className="text-gray-500">{item.status}</p>
            </div>
            <div className="font-semibold text-[#083f30]">
              {formatInterval(item.startTime)} – {formatInterval(item.endTime)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementsSection({ achievements }: { achievements: SpecialistAchievement[] }) {
  if (!achievements.length) return null;

  return (
    <div>
      <h3 className="mb-4 text-lg font-bold text-gray-900">Achievements & recognition</h3>
      <div className="space-y-3">
        {achievements.map((achievement) => (
          <div key={achievement.id} className="flex gap-4 rounded-xl bg-gray-50 p-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#083f30]/10 text-[#083f30]">
              <Award size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{achievement.title}</h4>
              {achievement.organization ? <p className="text-sm text-gray-600">{achievement.organization}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SpecialistProfileClient({
  data,
  specialistId,
  locale,
}: {
  data: SpecialistPageResponse;
  specialistId: string;
  locale: string;
}) {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<"about" | "providers" | "services" | "reviews" | "credentials">("about");
  const [isFavorited, setIsFavorited] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const specialist = data.specialist;
  const primaryGalleryImage = data.gallery.find((item) => item.isPrimary)?.url || data.gallery[0]?.url || specialist.image;
  const galleryCount = data.gallery.length + data.beforeAfter.length;

  const tabs = useMemo(
    () => [
      { id: "about" as const, label: "About" },
      { id: "providers" as const, label: `Places (${data.providers.length})` },
      { id: "services" as const, label: `Services (${data.services.length})` },
      { id: "reviews" as const, label: `Reviews (${data.recentReviews.length})` },
      { id: "credentials" as const, label: "Credentials" },
    ],
    [data.providers.length, data.recentReviews.length, data.services.length]
  );

  const handleShare = async () => {
    const shareData = {
      title: specialist.name,
      text: `Check out ${specialist.name}${specialist.specialty ? ` - ${specialist.specialty}` : ""}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled share sheet. Fall through without noisy UI.
      }
    }

    await navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      <GalleryModal
        open={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        gallery={data.gallery}
        beforeAfter={data.beforeAfter}
      />

      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#083f30] to-[#0a5a44]" />

        <div className="relative z-10 flex items-center justify-between px-5 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-transform active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFavorited((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-transform active:scale-95"
              aria-label="Favorite"
            >
              <Heart size={20} className={isFavorited ? "fill-red-500 text-red-500" : "text-gray-900"} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-transform active:scale-95"
              aria-label="Share"
            >
              <Share2 size={20} className="text-gray-900" />
            </button>
          </div>
        </div>

        <div className="relative z-10 px-5 pb-6">
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className="relative h-40 bg-gray-100">
              <MediaImage src={primaryGalleryImage} alt={specialist.name} className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <button
                type="button"
                onClick={() => setIsGalleryOpen(true)}
                className="absolute bottom-3 right-3 flex items-center gap-2 rounded-xl bg-black/70 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm"
              >
                <GalleryHorizontalEnd size={16} />
                {galleryCount ? `${galleryCount} media` : "Gallery"}
              </button>
            </div>

            <div className="p-5">
              <div className="flex gap-4">
                <div className="relative -mt-14 h-28 w-28 flex-shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-gray-100 shadow-md">
                  <MediaImage src={specialist.image} alt={specialist.name} className="object-cover" sizes="112px" />
                  {specialist.verified ? (
                    <div className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#083f30] shadow-lg">
                      <BadgeCheck size={18} className="text-[#eacb7f]" />
                    </div>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <h1 className="text-xl font-bold leading-tight text-gray-900">{specialist.name}</h1>
                  {specialist.title ? <p className="mt-1 text-sm text-gray-600">{specialist.title}</p> : null}
                  {specialist.specialty ? <p className="mt-1 text-sm font-semibold text-[#083f30]">{specialist.specialty}</p> : null}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{specialist.rating || "-"}</div>
                  <div className="mb-1 flex justify-center"><Stars rating={specialist.rating} size={10} /></div>
                  <div className="text-xs text-gray-600">{specialist.reviews} reviews</div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{specialist.experience}</div>
                  <div className="text-xs text-gray-600">Experience</div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{specialist.patients}</div>
                  <div className="text-xs text-gray-600">Patients</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Building size={16} className="text-[#083f30]" />
                  <span className="font-semibold">{data.providers[0]?.name || "Provider on request"}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span>{specialist.nextAvailableLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5">
        <div className="-mx-5 mb-6 flex gap-2 overflow-x-auto border-b border-gray-200 px-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id)}
              className={`relative whitespace-nowrap px-3 pb-3 text-sm font-semibold transition-colors ${
                selectedTab === tab.id ? "text-[#083f30]" : "text-gray-500"
              }`}
            >
              {tab.label}
              {selectedTab === tab.id ? <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#083f30]" /> : null}
            </button>
          ))}
        </div>

        {selectedTab === "about" ? (
          <div className="space-y-6">
            <div>
              <h2 className="mb-3 text-lg font-bold text-gray-900">About {specialist.name}</h2>
              <DescriptionBlock content={specialist.biography} />
            </div>

            <AchievementsSection achievements={data.achievements} />

            <div>
              <h3 className="mb-3 text-lg font-bold text-gray-900">Specializations</h3>
              {specialist.specializations.length ? (
                <div className="flex flex-wrap gap-2">
                  {specialist.specializations.map((spec) => (
                    <span key={spec} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900">
                      {spec}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyState title="No specializations" description="Specialization records are not added yet." />
              )}
            </div>

            {specialist.languages.length ? (
              <div>
                <h3 className="mb-3 text-lg font-bold text-gray-900">Languages</h3>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-4">
                  <Globe size={20} className="text-[#083f30]" />
                  <span className="text-sm text-gray-700">{specialist.languages.join(", ")}</span>
                </div>
              </div>
            ) : null}

            <AvailabilitySection items={data.availability} />

            {data.beforeAfter.length ? (
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-gray-900">Results gallery</h3>
                  <button type="button" onClick={() => setIsGalleryOpen(true)} className="text-sm font-bold text-[#083f30]">
                    View all
                  </button>
                </div>
                <div className="space-y-4">
                  {data.beforeAfter.slice(0, 2).map((item) => (
                    <div key={item.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                      <div className="grid grid-cols-2 gap-px bg-gray-200">
                        <div className="relative aspect-[4/3]">
                          <MediaImage src={item.before} alt="Before" className="object-cover" />
                          <span className="absolute left-2 top-2 rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white">Before</span>
                        </div>
                        <div className="relative aspect-[4/3]">
                          <MediaImage src={item.after} alt="After" className="object-cover" />
                          <span className="absolute right-2 top-2 rounded-lg bg-green-500 px-2 py-1 text-xs font-bold text-white">After</span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-gray-900">{item.procedure || "Result"}</p>
                        {item.months ? <p className="text-sm text-gray-500">After {item.months} months</p> : null}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsGalleryOpen(true)}
                  className="mt-3 h-11 w-full rounded-xl bg-gray-100 font-semibold text-gray-900 transition-colors hover:bg-gray-200"
                >
                  View Full Gallery
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {selectedTab === "providers" ? (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Building size={21} className="text-[#083f30]" />
              Places this specialist works
            </h2>
            <ProvidersSection providers={data.providers} navigate={navigate} />
          </div>
        ) : null}

        {selectedTab === "services" ? (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Stethoscope size={21} className="text-[#083f30]" />
              Services provided
            </h2>
            <ServicesSection services={data.services} navigate={navigate} />
          </div>
        ) : null}

        {selectedTab === "reviews" ? (
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-6 text-white">
              <div className="text-center">
                <div className="mb-2 text-5xl font-bold">{specialist.rating || "-"}</div>
                <div className="mb-2 flex justify-center"><Stars rating={specialist.rating} size={18} /></div>
                <div className="text-white/90">Based on {specialist.reviews} reviews</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/20 pt-4 text-center">
                <div>
                  <div className="mb-1 text-2xl font-bold text-[#eacb7f]">{specialist.successRate}</div>
                  <div className="text-sm text-white/80">Success rate</div>
                </div>
                <div>
                  <div className="mb-1 text-2xl font-bold text-[#eacb7f]">{data.providers.length}</div>
                  <div className="text-sm text-white/80">Connected places</div>
                </div>
              </div>
            </div>
            <ReviewsSection reviews={data.recentReviews} locale={locale} />
          </div>
        ) : null}

        {selectedTab === "credentials" ? <CredentialsSection data={data} /> : null}
      </div>

      <div className="fixed bottom-20 left-0 right-0 z-40 rounded-t-3xl border-t border-gray-200 bg-white px-5 py-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-1 text-xs text-gray-600">
              <Sparkles size={13} /> Consultation
            </div>
            {specialist.consultationPrice.sourceAmount === 0 ? (
              <div className="text-lg font-bold text-[#083f30]">Free</div>
            ) : (
              <div>
                <PriceTextClient
                  amount={specialist.consultationPrice.displayAmount}
                  currencyCode={specialist.consultationPrice.displayCurrencyCode}
                  showCode
                  className="text-lg font-bold text-[#083f30]"
                />
                {specialist.consultationPrice.converted ? (
                  <div className="text-xs text-gray-500">
                    ≈ <PriceTextClient amount={specialist.consultationPrice.sourceAmount} currencyCode={specialist.consultationPrice.sourceCurrencyCode} showCode />
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate(`/n/app/mobile/booking?specialistId=${specialistId}`)}
            className="flex h-14 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#083f30] to-[#0a5a44] px-8 font-bold text-white transition-all active:scale-95"
          >
            <Calendar size={20} />
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
