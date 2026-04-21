 "use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  ChevronLeft,
  Sparkles,
  Clock,
  Tag,
  Star,
  MapPin,
  BadgeCheck,
  X,
  Check,
  SlidersHorizontal,
  DollarSign,
  Globe,
} from "lucide-react";

import type { OfferCard, OfferTab, OffersFiltersInput } from "./offers.data";

type FilterFormValues = {
  q: string;
  maxPrice: number;
  minRating: number;
  verifiedOnly: boolean;
  responseTime: "any" | "fast" | "instant";
  languages: string[];
};

function buildOffersQuery(next: OffersFiltersInput) {
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.categoryId && next.categoryId !== "all") params.set("categoryId", next.categoryId);
  if (next.maxPrice > 0 && next.maxPrice !== 5000) params.set("maxPrice", String(next.maxPrice));
  if (next.minRating > 0) params.set("minRating", String(next.minRating));
  if (next.verifiedOnly) params.set("verifiedOnly", "1");
  if (next.languages.length > 0) params.set("languages", next.languages.join(","));
  if (next.responseTime !== "any") params.set("responseTime", next.responseTime);

  const query = params.toString();
  return query ? `/n/app/mobile/offers?${query}` : "/n/app/mobile/offers";
}

function navigateSmooth(
  startTransition: React.TransitionStartFunction,
  router: ReturnType<typeof useRouter>,
  href: string,
) {
  startTransition(() => {
    router.replace(href, { scroll: false });
  });
}

function formatPrice(value: number, currency: string = "USD") {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value.toLocaleString("en")}`;
  }
}

function PendingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 bg-white/55 backdrop-blur-[1px]">
      <div className="px-5 py-4 space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200" />
            <div className="p-4">
              <div className="h-5 w-2/3 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-100 rounded mb-3" />
              <div className="h-6 w-32 bg-gray-200 rounded mb-3" />
              <div className="h-11 w-full bg-gray-100 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OffersClient({
  tabs,
  offers,
  featuredOffer,
  availableLanguages,
  filters: initialFilters,
}: {
  tabs: OfferTab[];
  offers: OfferCard[];
  featuredOffer: OfferCard | null;
  availableLanguages: string[];
  filters: OffersFiltersInput;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const initialUi = useMemo(
    () => ({
      q: initialFilters.q,
      categoryId: initialFilters.categoryId ?? "all",
      maxPrice: initialFilters.maxPrice || 5000,
      minRating: initialFilters.minRating || 0,
      verifiedOnly: initialFilters.verifiedOnly,
      languages: initialFilters.languages,
      responseTime: initialFilters.responseTime,
    }),
    [initialFilters],
  );

  const [uiFilters, setUiFilters] = useState(initialUi);

  useEffect(() => {
    setUiFilters(initialUi);
  }, [initialUi]);

  const form = useForm<FilterFormValues>({
    defaultValues: {
      q: initialUi.q,
      maxPrice: initialUi.maxPrice,
      minRating: initialUi.minRating,
      verifiedOnly: initialUi.verifiedOnly,
      languages: initialUi.languages,
      responseTime: initialUi.responseTime,
    },
  });

  useEffect(() => {
    form.reset({
      q: initialUi.q,
      maxPrice: initialUi.maxPrice,
      minRating: initialUi.minRating,
      verifiedOnly: initialUi.verifiedOnly,
      languages: initialUi.languages,
      responseTime: initialUi.responseTime,
    });
  }, [form, initialUi]);

  const watched = form.watch();

  const hasActiveFilters =
    uiFilters.q.trim().length > 0 ||
    uiFilters.maxPrice !== 5000 ||
    uiFilters.minRating > 0 ||
    uiFilters.verifiedOnly ||
    uiFilters.languages.length > 0 ||
    uiFilters.responseTime !== "any";

  const applyTab = (tabId: string) => {
    const next = { ...uiFilters, categoryId: tabId };
    setUiFilters(next);
    navigateSmooth(
      startTransition,
      router,
      buildOffersQuery({
        q: next.q,
        categoryId: tabId === "all" ? null : tabId,
        minPrice: 0,
        maxPrice: next.maxPrice,
        minRating: next.minRating,
        verifiedOnly: next.verifiedOnly,
        languages: next.languages,
        responseTime: next.responseTime,
      }),
    );
  };

  const applySearch = () => {
    const next = { ...uiFilters, q: watched.q.trim() };
    setUiFilters(next);
    navigateSmooth(
      startTransition,
      router,
      buildOffersQuery({
        q: next.q,
        categoryId: next.categoryId === "all" ? null : next.categoryId,
        minPrice: 0,
        maxPrice: next.maxPrice,
        minRating: next.minRating,
        verifiedOnly: next.verifiedOnly,
        languages: next.languages,
        responseTime: next.responseTime,
      }),
    );
  };

  const applyFilters = form.handleSubmit((values) => {
    const next = {
      ...uiFilters,
      q: values.q.trim(),
      maxPrice: values.maxPrice,
      minRating: values.minRating,
      verifiedOnly: values.verifiedOnly,
      languages: values.languages,
      responseTime: values.responseTime,
    };
    setUiFilters(next);
    setShowFilters(false);
    navigateSmooth(
      startTransition,
      router,
      buildOffersQuery({
        q: next.q,
        categoryId: next.categoryId === "all" ? null : next.categoryId,
        minPrice: 0,
        maxPrice: next.maxPrice,
        minRating: next.minRating,
        verifiedOnly: next.verifiedOnly,
        languages: next.languages,
        responseTime: next.responseTime,
      }),
    );
  });

  const clearFilters = () => {
    const next = {
      ...uiFilters,
      q: "",
      maxPrice: 5000,
      minRating: 0,
      verifiedOnly: false,
      languages: [],
      responseTime: "any" as const,
    };
    form.reset(next);
    setUiFilters(next);
    navigateSmooth(
      startTransition,
      router,
      buildOffersQuery({
        q: "",
        categoryId: next.categoryId === "all" ? null : next.categoryId,
        minPrice: 0,
        maxPrice: 5000,
        minRating: 0,
        verifiedOnly: false,
        languages: [],
        responseTime: "any",
      }),
    );
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="relative min-h-screen bg-gray-50 pb-24">
      {isPending && <PendingOverlay />}

      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="px-5 pt-3 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>

            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Special Offers</h1>
              <p className="text-sm text-gray-600">Limited time deals & promotions</p>
            </div>

            <div className="w-10 h-10 bg-[#eacb7f] rounded-full flex items-center justify-center">
              <Sparkles size={20} className="text-[#083f30]" />
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <div className="flex-1 h-11 bg-gray-50 rounded-xl border border-gray-100 px-4 flex items-center gap-3">
              <input
                value={watched.q ?? ""}
                onChange={(e) => form.setValue("q", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applySearch();
                  }
                }}
                placeholder="Search offers, providers, services..."
                className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <button
              type="button"
              onClick={applySearch}
              className="h-11 px-4 rounded-xl bg-[#083f30] text-white font-semibold hover:bg-[#0a5a44] transition-colors"
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center relative"
            >
              <SlidersHorizontal size={18} className="text-[#083f30]" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#083f30] rounded-full border-2 border-white" />
              )}
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-5 px-5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => applyTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  uiFilters.categoryId === tab.id
                    ? "bg-[#083f30] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {featuredOffer && (
        <div className="px-5 pt-4 pb-2">
          <div
            className="relative h-40 rounded-2xl overflow-hidden shadow-lg cursor-pointer"
            onClick={() => router.push(`/app/treatment/${featuredOffer.providerServiceId}`)}
          >
            <img src={featuredOffer.image} alt={featuredOffer.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#083f30]/95 to-[#083f30]/60" />

            <div className="absolute inset-0 flex flex-col justify-center px-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-[#eacb7f]" />
                <span className="text-xs font-bold text-[#eacb7f] uppercase tracking-wide">Featured Deal</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{featuredOffer.title}</h2>
              <p className="text-white/90 text-sm">
                Use code: <span className="font-bold text-[#eacb7f]">{featuredOffer.code || "NO-CODE"}</span>
              </p>
            </div>

            <div className="absolute top-3 right-3 bg-[#eacb7f] px-3 py-1.5 rounded-full">
              <span className="text-sm font-bold text-[#083f30]">{featuredOffer.discount} OFF</span>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 py-4 space-y-3">
        {offers.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-1">No offers found</h3>
            <p className="text-sm text-gray-600 mb-4">Try clearing some filters or searching with a broader term.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="h-11 px-5 rounded-xl bg-[#083f30] text-white font-semibold hover:bg-[#0a5a44] transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {offers.map((offer) => (
          <div
            key={offer.id}
            onClick={() => router.push(`/app/treatment/${offer.providerServiceId}`)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="relative h-48">
              <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              <div className="absolute top-3 right-3 bg-[#eacb7f] px-3 py-1.5 rounded-full shadow-lg">
                <span className="text-sm font-bold text-[#083f30]">{offer.discount} OFF</span>
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold">{offer.provider}</span>
                  {offer.verified && (
                    <div className="w-5 h-5 bg-[#083f30] rounded-full flex items-center justify-center">
                      <BadgeCheck size={14} className="text-[#eacb7f]" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-white/90 text-xs">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="fill-[#eacb7f] text-[#eacb7f]" />
                    <span>{offer.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span>{offer.location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-1">{offer.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{offer.subtitle}</p>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl font-bold text-[#083f30]">
                  {formatPrice(offer.discountedPrice, offer.currency)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(offer.originalPrice, offer.currency)}
                </span>
                <span className="text-sm font-semibold text-green-600">
                  Save {formatPrice(offer.originalPrice - offer.discountedPrice, offer.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-xl px-3 py-2">
                  <Tag size={16} className="text-[#083f30]" />
                  <span className="font-bold text-gray-900 text-sm">{offer.code || "NO-CODE"}</span>
                  <button
                    type="button"
                    className="ml-auto text-xs text-[#083f30] font-semibold hover:underline"
                    onClick={(e) => handleCopyCode(offer.code || "NO-CODE", e)}
                  >
                    {copiedCode === (offer.code || "NO-CODE") ? <Check size={14} /> : "Copy"}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Clock size={14} />
                  <span>Until {offer.validUntil}</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full h-11 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors active:scale-[0.98]"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/app/booking/${offer.providerServiceId}`);
                }}
              >
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end animate-in fade-in duration-200">
          <form
            onSubmit={applyFilters}
            className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 z-10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">Advanced Filters</h2>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-600">Find exactly what you're looking for</p>
            </div>

            <div className="px-5 py-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign size={20} className="text-[#083f30]" />
                    <h3 className="font-bold text-gray-900">Max Price</h3>
                  </div>
                  <span className="text-sm font-semibold text-[#083f30]">
                    $0 - ${watched.maxPrice ?? 5000}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={watched.maxPrice ?? 5000}
                  onChange={(e) => form.setValue("maxPrice", Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">Minimum Rating</h3>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[0, 3.0, 3.5, 4.0, 4.5].map((rating) => (
                    <button
                      type="button"
                      key={rating}
                      onClick={() => form.setValue("minRating", rating)}
                      className={`h-12 rounded-xl flex flex-col items-center justify-center font-semibold transition-all ${
                        (watched.minRating ?? 0) === rating
                          ? "bg-[#083f30] text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span className="text-sm">{rating === 0 ? "Any" : `${rating}+`}</span>
                      {rating > 0 && <Star size={12} className="fill-current" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => form.setValue("verifiedOnly", !(watched.verifiedOnly ?? false))}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                    watched.verifiedOnly
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      watched.verifiedOnly ? "bg-green-600" : "bg-gray-100"
                    }`}>
                      <BadgeCheck size={24} className={watched.verifiedOnly ? "text-white" : "text-gray-400"} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900">Verified Providers Only</h3>
                      <p className="text-sm text-gray-600">Show only accredited clinics</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    watched.verifiedOnly ? "bg-green-600" : "bg-gray-200"
                  }`}>
                    {watched.verifiedOnly && <Check size={16} className="text-white" />}
                  </div>
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">Languages Spoken</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableLanguages.map((lang) => (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => {
                        const current = watched.languages ?? [];
                        const next = current.includes(lang)
                          ? current.filter((item) => item !== lang)
                          : [...current, lang];
                        form.setValue("languages", next);
                      }}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        (watched.languages ?? []).includes(lang)
                          ? "bg-[#083f30] text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-colors"
                >
                  Clear All
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white font-bold hover:shadow-lg transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
