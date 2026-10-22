"use client";

import { ArrowLeft, Award, BadgeCheck, Calendar, CheckCircle2, Clock, Loader2, Share2, Shield, Sparkles, Star, Tag, TrendingUp, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ConsultationCtaButton } from "@/features/consultation/components/consultation-cta-button";
import { FavoriteButton } from "@/features/favorites/components/favorite-button";
import { getViewerPricingAction } from "@/features/finance/actions/viewer-currency.actions";
import { PriceConverterCardClient } from "@/features/finance/components/price-converter-card-client";
import { ViewerPrice } from "@/features/finance/components/viewer-price";
import { MealPlanPrices } from "@/features/meal-plans/components/meal-plan-prices";
import { LexicalDescription } from "@/features/service-providers/components/lexical-description";
import { resolveMediaUrl } from "@/features/service-providers/lib/media-url";
import type { GetServicePageByIdResponse, TopReview } from "@/features/service-providers/types/service-page.types";
import { ServiceProductsRail } from "@/features/shop/components/ServiceProductsRail";
import { Link } from "@/i18n/navigation";
import { DigikalaReviewCard } from "@/app/[locale]/n/app/components/DigikalaReviewCard";
import ReviewForm, { type ReviewFormSubmitValue } from "@/app/[locale]/n/app/components/ReviewForm";
import { useReviewEligibility } from "@/app/[locale]/n/app/components/useReviewEligibility";
import RecommendationSection from "@/app/[locale]/n/app/mobile/components/RecommendationSection";
import {
  AddonsSection,
  applyInternationalMultiplier,
  MediaPreview,
  OffersSection,
  PoliciesSection,
  ProviderProfileSection,
  ProvidersForServiceSection,
  RequirementsSection,
  ServiceAttributesSection,
  SpecialistsSection,
} from "@/app/[locale]/n/app/mobile/service/[id]/service-page";

import { AnimatedWords, Magnetic, Reveal } from "../components/motion";

import { useFetchProviderPageData } from "@/features/service-providers/api/client/fetch-provider-page-data";
import { BeforeAfterGallery } from "@/features/service-providers/components/before-after-gallery";


type ReviewSort = "newest" | "buyers" | "helpful";
type SectionId = "included" | "process" | "beforeAfter" | "details" | "providers" | "reviews" | "faq";

function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-[28px] bg-white p-8 ring-1 ring-[#dce4e0] [&>section]:mb-0">{children}</div>;
}

export function DesktopServiceView({ data, serviceId, locale }: { data: GetServicePageByIdResponse; serviceId: string; locale: string }) {
  const t = useTranslations("ServicePage");
  const tShop = useTranslations("Shop");
  const tConsultation = useTranslations("Consultation");
  const tGallery = useTranslations("SpecialistPage");
  const service = data.service;

  // Before/after results belong to the clinic; show the ones for this treatment.
  const { data: clinicData } = useFetchProviderPageData(service.clinicId, locale, {
    targetCurrencyCode: null,
    selectedCountryCode: null,
    browserCountryCode: null,
    userId: undefined,
  });
  const beforeAfterItems = useMemo(
    () => (clinicData?.beforeAfter ?? []).filter((item) => item.providerServiceId === service.providerServiceId),
    [clinicData?.beforeAfter, service.providerServiceId]
  );

  // Viewer pricing: the same rules as the mobile page.
  const [selectedCurrency, setSelectedCurrency] = useState(service.displayCurrencyCode || service.currency);
  const [primaryCurrency, setPrimaryCurrency] = useState(service.displayCurrencyCode || service.currency);
  const [isIranianViewer, setIsIranianViewer] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    getViewerPricingAction().then(({ currencyCode, isIranian }) => {
      if (!alive) return;
      setIsIranianViewer(isIranian);
      if (!currencyCode) return;
      if (!service.priceOptions.some((price) => price.targetCurrencyCode === currencyCode)) return;
      setPrimaryCurrency(currencyCode);
      setSelectedCurrency(currencyCode);
    });
    return () => {
      alive = false;
    };
  }, [service.priceOptions]);

  const viewerPriceOptions = useMemo(
    () => applyInternationalMultiplier(service.priceOptions, service.internationalPriceMultiplier, isIranianViewer),
    [service.priceOptions, service.internationalPriceMultiplier, isIranianViewer]
  );
  const viewerOriginalPriceOptions = useMemo(
    () => applyInternationalMultiplier(service.originalPriceOptions, service.internationalPriceMultiplier, isIranianViewer),
    [service.originalPriceOptions, service.internationalPriceMultiplier, isIranianViewer]
  );
  const selectedPrice = viewerPriceOptions.find((price) => price.targetCurrencyCode === selectedCurrency) || viewerPriceOptions[0];
  const selectedOriginalPrice = viewerOriginalPriceOptions.find((price) => price.targetCurrencyCode === selectedCurrency) || viewerOriginalPriceOptions[0];
  const displayPrice = selectedPrice?.targetAmount ?? service.displayPrice.amount;
  const displayCurrencyCode = selectedPrice?.targetCurrencyCode ?? service.displayPrice.code;
  const displayOriginalPrice = selectedOriginalPrice?.targetAmount ?? service.displayOriginalPrice.amount;
  const hasDiscount = displayOriginalPrice > displayPrice;
  const savedPercent = hasDiscount ? Math.round((1 - displayPrice / displayOriginalPrice) * 100) : 0;

  const importantInfo = useMemo(
    () => [
      service.requiresSpecialist ? t("importantInfo.specialistRequired") : t("importantInfo.specialistOptional"),
      service.bookingUiMode === "date_range" ? t("importantInfo.dateRange") : t("importantInfo.availabilityConfirmed"),
      data.uploadRequirements.length ? t("importantInfo.documentsMayBeRequested") : t("importantInfo.noUploadRequirement"),
      t("importantInfo.finalPlanAssessment"),
    ],
    [data.uploadRequirements.length, service.bookingUiMode, service.requiresSpecialist, t]
  );

  // Reviews: the same requests as the mobile page.
  const [visibleReviews, setVisibleReviews] = useState<TopReview[]>(data.topReviews || []);
  const [reviewSort, setReviewSort] = useState<ReviewSort>("newest");
  const [hasMoreReviews, setHasMoreReviews] = useState((data.topReviews || []).length >= 3);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
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

  const fetchReviewsPage = async (options: { offset: number; sort: ReviewSort }) => {
    const query = new URLSearchParams({
      offset: String(options.offset),
      limit: "3",
      sort: options.sort,
      targetType: "service",
      providerServiceId: service.providerServiceId,
    });
    const response = await fetch(`/api/service-providers/${service.clinicId}/reviews?${query.toString()}`);
    if (!response.ok) throw new Error(t("errors.loadReviews"));
    return response.json() as Promise<{ reviews: TopReview[]; hasMore: boolean }>;
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
      throw new Error(problem?.title || t("errors.submitReview"));
    }
    const payload = await response.json().catch(() => null);
    const requiresModeration = Boolean(payload?.requiresModeration);
    const created = payload?.review as TopReview | undefined;
    if (created?.id) {
      setVisibleReviews((current) => [
        { ...created, date: requiresModeration ? "" : created.date, pending: requiresModeration },
        ...current.filter((item) => String(item.id) !== String(created.id)),
      ]);
    }
    return { requiresModeration };
  };

  const handleShare = async () => {
    const shareText = service.clinic
      ? t("share.textWithClinic", { service: service.name, clinic: service.clinic })
      : t("share.text", { service: service.name });
    if (navigator.share) {
      try {
        await navigator.share({ title: service.name, text: shareText, url: window.location.href });
      } catch {
        // The visitor cancelled the share sheet.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("share.linkCopied"));
    } catch {
      toast.error(t("share.unavailable"));
    }
  };

  // Sticky section nav, highlighting the section in view.
  const sections = useMemo(
    () =>
      [
        data.included.length ? { id: "included" as const, label: t("included.title") } : null,
        data.process.length ? { id: "process" as const, label: t("process.title") } : null,
        beforeAfterItems.length ? { id: "beforeAfter" as const, label: tGallery("gallery.beforeAfterTitle") } : null,
        { id: "details" as const, label: t("specialists.title") },
        data.providers.length ? { id: "providers" as const, label: t("providers.title") } : null,
        { id: "reviews" as const, label: t("reviews.title") },
        data.faqs.length ? { id: "faq" as const, label: t("faq.title") } : null,
      ].filter(Boolean) as { id: SectionId; label: string }[],
    [beforeAfterItems.length, data.faqs.length, data.included.length, data.process.length, data.providers.length, t, tGallery]
  );
  const [activeSection, setActiveSection] = useState<SectionId>(sections[0]?.id ?? "details");
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const ids = sections.map((section) => section.id as string);
    let frame = 0;
    const update = () => {
      const nav = navRef.current;
      if (!nav) return;
      const rect = nav.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + 30, rect.bottom + 70)?.closest<HTMLElement>('[id^="lsd-"]');
      const id = hit?.id.replace("lsd-", "");
      if (id && ids.includes(id)) setActiveSection(id as SectionId);
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
  }, [sections]);
  const scrollTo = (id: SectionId) => document.getElementById(`lsd-${id}`)?.scrollIntoView({ behavior: "smooth" });

  const galleryItems = service.galleryItems || [];
  const mosaic = galleryItems.slice(0, 5);
  const number = (value: number, digits = 0) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
  const facts = [
    { icon: Clock, label: t("stats.duration"), value: service.duration },
    { icon: Calendar, label: t("stats.recovery"), value: service.recovery },
    { icon: Shield, label: t("stats.successRate"), value: service.successRate },
    { icon: Users, label: t("stats.satisfaction"), value: service.satisfaction },
  ];
  const bookHref = `/n/app/mobile/booking?serviceId=${service.providerServiceId}`;

  return (
    <div className="lsd hidden pb-20 xl:block">
      {/* Gallery mosaic */}
      <section className="lsd-container pt-6">
        <div className={`grid h-[520px] gap-3 ${mosaic.length > 1 ? "grid-cols-4 grid-rows-2" : "grid-cols-1"}`}>
          {mosaic.map((item, index) => {
            const isLast = index === mosaic.length - 1 && galleryItems.length > mosaic.length;
            return (
              <Link
                key={item.id}
                href={`/n/app/mobile/service/${serviceId}/gallery`}
                aria-label={t("gallery.openGallery")}
                className={`group relative overflow-hidden rounded-[26px] bg-[#0f5a45] ${index === 0 && mosaic.length > 1 ? "col-span-2 row-span-2" : ""}`}
              >
                <div className="absolute inset-0 transition-transform duration-[1.4s] group-hover:scale-105">
                  <MediaPreview item={item} alt={`${service.name} ${index + 1}`} className="h-full w-full object-cover" sizes="(min-width: 1280px) 640px, 100vw" />
                </div>
                {isLast ? (
                  <span className="absolute inset-0 grid place-items-center bg-[#062a20]/60 text-2xl font-black text-white backdrop-blur-[2px]">
                    +{number(galleryItems.length - mosaic.length)}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Title block */}
      <section className="lsd-container mt-10 flex items-start justify-between gap-10">
        <Reveal className="min-w-0 flex-1 space-y-5">
          <div className="flex flex-wrap gap-2">
            {service.verified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#083f30] px-3 py-1 text-xs font-bold text-[#eacb7f]">
                <BadgeCheck size={14} />
                {t("badges.verified")}
              </span>
            ) : null}
            {service.popular ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eacb7f] px-3 py-1 text-xs font-black text-[#062a20]">
                <TrendingUp size={14} />
                {t("badges.featured")}
              </span>
            ) : null}
            {service.categoryName ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c9a55a]/50 px-3 py-1 text-xs font-bold text-[#8c6b2c]">
                <Award size={14} />
                {service.categoryName}
              </span>
            ) : null}
            {service.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs text-[#56675f] ring-1 ring-[#dce4e0]">
                <Tag size={12} />
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-[48px] font-black leading-[1.2] text-[#0e1a16]">
            <AnimatedWords text={service.name} />
          </h1>
          <LexicalDescription content={service.subtitle} fallback="" className="max-w-3xl text-lg leading-9 text-[#56675f]" />

          <div className="flex flex-wrap items-center gap-6">
            <Link href={`/n/app/mobile/provider/${service.clinicId}`} className="group flex items-center gap-3 rounded-full bg-white py-1.5 pe-5 ps-1.5 ring-1 ring-[#dce4e0] transition hover:ring-[#c9a55a]">
              <span className="h-11 w-11 overflow-hidden rounded-full bg-[#0f5a45]">
                {service.providerProfile.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveMediaUrl(service.providerProfile.image)} alt="" className="h-full w-full object-cover" />
                ) : null}
              </span>
              <span>
                <span className="flex items-center gap-1.5 font-bold text-[#0e1a16]">
                  {service.clinic}
                  {service.verified ? <BadgeCheck size={15} className="text-[#0f5a45]" /> : null}
                </span>
                <span className="block text-xs text-[#56675f]">{service.location || t("providerProfile.locationOnRequest")}</span>
              </span>
            </Link>
            <span className="flex items-center gap-2">
              <Star size={20} className="fill-[#c9a55a] text-[#c9a55a]" />
              <span className="text-xl font-black text-[#0e1a16]">{service.rating ? number(service.rating, 1) : "—"}</span>
              <span className="text-sm text-[#56675f]">({t("reviews.count", { count: number(service.reviews) })})</span>
            </span>
            {service.providerCount > 1 ? (
              <button type="button" onClick={() => scrollTo("providers")} className="text-sm font-bold text-[#083f30] hover:text-[#8c6b2c]">
                {t("providers.available", { count: service.providerCount })}
              </button>
            ) : null}
          </div>
        </Reveal>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleShare}
            aria-label={t("actions.share")}
            className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#083f30] ring-1 ring-[#dce4e0] transition hover:ring-[#c9a55a]"
          >
            <Share2 size={19} />
          </button>
          <FavoriteButton
            entityId={service.providerServiceId}
            entityType="service"
            initialIsFavorite={false}
            ariaLabel={t("actions.saveService")}
            className="!h-12 !w-12 bg-white ring-1 ring-[#dce4e0]"
            iconClassName="h-5 w-5"
          />
        </div>
      </section>

      {/* Key facts */}
      <section className="lsd-container mt-10 grid grid-cols-4 gap-4">
        {facts.map((fact, index) => (
          <Reveal key={fact.label} delay={index * 90}>
            <div className="flex items-center gap-4 rounded-[24px] bg-white p-5 ring-1 ring-[#dce4e0]">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fbf3de] text-[#8c6b2c]">
                <fact.icon size={22} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-[#56675f]">{fact.label}</span>
                <span className="block truncate text-lg font-black text-[#0e1a16]">{fact.value || t("providerProfile.onRequest")}</span>
              </span>
            </div>
          </Reveal>
        ))}
      </section>

      {/* Body */}
      <div className="lsd-container mt-12 grid grid-cols-[1fr_390px] gap-12">
        <div className="min-w-0 space-y-16">
          <nav ref={navRef} className="sticky top-24 z-20 flex w-fit gap-1 rounded-full bg-white/85 p-1.5 shadow-sm ring-1 ring-[#dce4e0] backdrop-blur-md">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollTo(section.id)}
                className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                  activeSection === section.id ? "bg-[#083f30] text-[#eacb7f]" : "text-[#56675f] hover:text-[#083f30]"
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>

          <Reveal>
            <PriceConverterCardClient
              label={t("price.packagePrice")}
              convertedPrices={viewerPriceOptions}
              convertedOriginalPrices={viewerOriginalPriceOptions}
              primaryCurrencyCode={primaryCurrency}
              selectedCurrencyCode={selectedCurrency}
              onCurrencyChange={setSelectedCurrency}
              saveLabel={(percent) => t("price.save", { percent })}
              convertedFromLabel={(value) => t("price.convertedFrom", { value })}
              badgeText={t("price.providerPackagePrice")}
              locale={locale}
            />
            {service.bookingUiMode === "date_range" ? <MealPlanPrices serviceId={service.providerServiceId} /> : null}
          </Reveal>

          {data.included.length ? (
            <section id="lsd-included" className="lsd-anchor">
              <Reveal>
                <h2 className="lsd-heading mb-8 text-4xl font-black text-[#0e1a16]">{t("included.title")}</h2>
                <ul className="grid grid-cols-2 gap-4">
                  {data.included.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#dce4e0]">
                      <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-[#c9a55a]" />
                      <span className="text-[15px] leading-7 text-[#3d4b45]">{item}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </section>
          ) : null}

          {data.process.length ? (
            <section id="lsd-process" className="lsd-anchor">
              <Reveal>
                <h2 className="lsd-heading mb-8 text-4xl font-black text-[#0e1a16]">{t("process.title")}</h2>
                <ol className="lsd-timeline space-y-6">
                  {data.process.map((step, index) => (
                    <li key={`${step.step}-${index}`} className="relative flex gap-6">
                      <span className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#083f30] text-lg font-black text-[#eacb7f] ring-4 ring-[#f2f5f3]">
                        {number(step.step)}
                      </span>
                      <div className="flex-1 rounded-[24px] bg-white p-6 ring-1 ring-[#dce4e0]">
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <h3 className="text-lg font-black text-[#0e1a16]">{step.title}</h3>
                          {step.duration ? (
                            <span className="flex items-center gap-1.5 rounded-full bg-[#fbf3de] px-3 py-1 text-xs font-bold text-[#8c6b2c]">
                              <Clock size={13} />
                              {step.duration}
                            </span>
                          ) : null}
                        </div>
                        {step.description ? <LexicalDescription content={step.description} className="text-sm leading-7 text-[#56675f]" /> : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </Reveal>
            </section>
          ) : null}

          {beforeAfterItems.length ? (
            <section id="lsd-beforeAfter" className="lsd-anchor">
              <Reveal>
                <h2 className="lsd-heading mb-8 text-4xl font-black text-[#0e1a16]">{tGallery("gallery.beforeAfterTitle")}</h2>
                <BeforeAfterGallery items={beforeAfterItems} />
              </Reveal>
            </section>
          ) : null}

          {/* Clinic, doctors, offers, attributes, add-ons and requirements: the existing sections in desktop panels */}
          <section id="lsd-details" className="lsd-anchor space-y-6">
            <Panel><ProviderProfileSection data={data} /></Panel>
            {data.specialists.length ? <Panel><SpecialistsSection specialists={data.specialists} locale={locale} /></Panel> : null}
            {data.offers.length ? <Panel><OffersSection offers={data.offers} locale={locale} /></Panel> : null}
            {data.serviceAttributes.length ? (
              <Panel><ServiceAttributesSection attributes={data.serviceAttributes} currency={service.currency} locale={locale} /></Panel>
            ) : null}
            {data.addOns.length ? <Panel><AddonsSection addOns={data.addOns} locale={locale} /></Panel> : null}
            {data.uploadRequirements.length || data.domainRequirements.length ? (
              <Panel><RequirementsSection uploadRequirements={data.uploadRequirements} domainRequirements={data.domainRequirements} /></Panel>
            ) : null}
          </section>

          {data.providers.length ? (
            <section id="lsd-providers" className="lsd-anchor">
              <Panel>
                <ProvidersForServiceSection providers={data.providers} currentProviderServiceId={service.providerServiceId} locale={locale} />
              </Panel>
            </section>
          ) : null}

          {/* Reviews */}
          <section id="lsd-reviews" className="lsd-anchor">
            <Reveal className="mb-8 flex items-end justify-between gap-6">
              <h2 className="lsd-heading text-4xl font-black text-[#0e1a16]">{t("reviews.title")}</h2>
              <div className="flex items-center gap-2">
                {(["newest", "buyers", "helpful"] as ReviewSort[]).map((sort) => (
                  <button
                    key={sort}
                    type="button"
                    onClick={() => changeReviewSort(sort)}
                    disabled={isLoadingReviews}
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
                  providerName={service.clinic || service.name}
                  treatmentName={service.name}
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
                  <DigikalaReviewCard key={review.id} review={review} locale={locale} providerId={service.clinicId} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-[#dce4e0] bg-white p-6 text-[#56675f]">{t("reviews.empty")}</p>
            )}

            {hasMoreReviews ? (
              <button
                type="button"
                onClick={loadMoreReviews}
                disabled={isLoadingReviews}
                className="mx-auto mt-4 flex h-12 items-center gap-2 rounded-full border border-[#083f30]/20 px-8 text-sm font-bold text-[#083f30] transition hover:bg-[#083f30] hover:text-white disabled:opacity-60"
              >
                {isLoadingReviews ? <Loader2 size={16} className="animate-spin" /> : null}
                {isLoadingReviews ? t("reviews.loading") : t("reviews.more")}
              </button>
            ) : null}
          </section>

          {data.policies.length ? <Panel><PoliciesSection policies={data.policies} /></Panel> : null}

          {data.faqs.length ? (
            <section id="lsd-faq" className="lsd-anchor">
              <Reveal>
                <h2 className="lsd-heading mb-8 text-4xl font-black text-[#0e1a16]">{t("faq.title")}</h2>
                <div className="space-y-3">
                  {data.faqs.map((faq, index) => (
                    <details key={`${faq.q}-${index}`} className="group rounded-2xl bg-white px-6 py-5 ring-1 ring-[#dce4e0] open:ring-[#c9a55a]/60">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-[#0e1a16]">
                        {faq.q}
                        <span className="text-xl text-[#c9a55a] transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="mt-4 text-[15px] leading-8 text-[#56675f]">{faq.a}</p>
                    </details>
                  ))}
                </div>
              </Reveal>
            </section>
          ) : null}

          {data.localRecommendations.length || data.internationalRecommendations.length ? (
            <RecommendationSection
              localRecommendations={data.localRecommendations}
              internationalRecommendations={data.internationalRecommendations}
              userCountry={service.country || t("recommendations.yourCountry")}
            />
          ) : null}
          {service.serviceDefinitionId ? (
            <ServiceProductsRail
              src={`/api/shop/service/${service.serviceDefinitionId}/products`}
              serviceDefinitionId={service.serviceDefinitionId}
              locale={locale}
              title={tShop("serviceRelatedProductsTitle")}
            />
          ) : null}
        </div>

        {/* Sticky booking concierge */}
        <aside>
          <div className="sticky top-28">
            <Reveal direction="left" className="overflow-hidden rounded-[32px] bg-[#062a20] text-white shadow-[0_40px_80px_-40px_rgba(6,42,32,0.85)]">
              <div className="p-8">
                <p className="text-sm text-white/60">{t("price.totalPackagePrice")}</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <ViewerPrice
                    amount={service.displayPrice.sourceAmount ?? displayPrice}
                    sourceCurrencyCode={service.displayPrice.sourceCurrencyCode ?? displayCurrencyCode}
                    providerId={service.displayPrice.providerId ?? service.clinicId}
                    valueToman={service.displayPrice.valueToman ?? null}
                    locale={locale}
                    className="text-3xl font-black text-[#eacb7f] [overflow-wrap:anywhere]"
                  />
                  {hasDiscount ? (
                    <ViewerPrice
                      amount={service.displayOriginalPrice.sourceAmount ?? displayOriginalPrice}
                      sourceCurrencyCode={service.displayOriginalPrice.sourceCurrencyCode ?? displayCurrencyCode}
                      providerId={service.displayPrice.providerId ?? service.clinicId}
                      locale={locale}
                      className="text-sm text-white/45 line-through"
                    />
                  ) : null}
                </div>
                {savedPercent > 0 ? (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#eacb7f] px-3 py-1 text-xs font-black text-[#062a20]">
                    <Sparkles size={13} />
                    {t("price.save", { percent: savedPercent })}
                  </span>
                ) : null}

                <div className="mt-7 space-y-3">
                  <Magnetic>
                    <Link href={bookHref} className="lsd-btn lsd-btn-gold h-14 w-full text-base">
                      {t("actions.bookNow")}
                      <ArrowLeft size={18} className="ltr:rotate-180" />
                    </Link>
                  </Magnetic>
                  <ConsultationCtaButton
                    categoryName={service.name}
                    label={tConsultation("cta.beforeBooking")}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-full border border-[#eacb7f]/40 text-sm font-bold text-[#eacb7f] transition hover:bg-[#eacb7f]/10"
                  />
                </div>
              </div>

              <div className="border-t border-white/10 px-8 py-6">
                <p className="mb-3 text-sm font-bold text-[#eacb7f]">{t("importantInfo.title")}</p>
                <ul className="space-y-2.5">
                  {importantInfo.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-white/75">
                      <CheckCircle2 size={16} className="mt-1 shrink-0 text-[#eacb7f]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </aside>
      </div>
    </div>
  );
}