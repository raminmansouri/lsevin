"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useNavigate } from "@/hooks/use-navigate";
import {
  ChevronLeft,
  Sparkles,
  Clock,
  Tag,
  Star,
  MapPin,
  BadgeCheck,
  Check,
} from "lucide-react";

function formatPrice(value: number, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value.toLocaleString(locale)}`;
  }
}

export default function Offers() {
  const navigate = useNavigate();
  const t = useTranslations("MobileOffers");
  const locale = useLocale();
  const [selectedTab, setSelectedTab] = useState<"all" | "medical" | "beauty" | "fitness">("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleBookNow = (offerId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/app/booking/${offerId}`);
  };

  const offers = [
    {
      id: 1,
      title: t("demoOffers.premiumPackages.title"),
      subtitle: t("demoOffers.premiumPackages.subtitle"),
      provider: t("demoOffers.premiumPackages.provider"),
      category: "medical",
      image: "/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=600&h=400&fit=crop.jpg",
      discount: "20%",
      validUntil: t("demoOffers.premiumPackages.validUntil"),
      code: "FIRST20",
      verified: true,
      location: t("demoOffers.premiumPackages.location"),
      rating: 4.9,
      originalPrice: 2499,
      discountedPrice: 1999,
    },
    {
      id: 2,
      title: t("demoOffers.laserSessions.title"),
      subtitle: t("demoOffers.laserSessions.subtitle"),
      provider: t("demoOffers.laserSessions.provider"),
      category: "beauty",
      image: "/unsplash_images/photo-1540555700478-4be289fbecef__w=600&h=400&fit=crop.jpg",
      discount: "33%",
      validUntil: t("demoOffers.laserSessions.validUntil"),
      code: "LASER3FOR2",
      verified: true,
      location: t("demoOffers.laserSessions.location"),
      rating: 4.8,
      originalPrice: 900,
      discountedPrice: 600,
    },
    {
      id: 3,
      title: t("demoOffers.gymMembership.title"),
      subtitle: t("demoOffers.gymMembership.subtitle"),
      provider: t("demoOffers.gymMembership.provider"),
      category: "fitness",
      image: "/unsplash_images/photo-1534438327276-14e5300c3a48__w=600&h=400&fit=crop.jpg",
      discount: "30%",
      validUntil: t("demoOffers.gymMembership.validUntil"),
      code: "GYM30",
      verified: true,
      location: t("demoOffers.gymMembership.location"),
      rating: 4.7,
      originalPrice: 1200,
      discountedPrice: 840,
    },
    {
      id: 4,
      title: t("demoOffers.dental.title"),
      subtitle: t("demoOffers.dental.subtitle"),
      provider: t("demoOffers.dental.provider"),
      category: "medical",
      image: "/unsplash_images/photo-1606811971618-4486d14f3f99__w=600&h=400&fit=crop.jpg",
      discount: "15%",
      validUntil: t("demoOffers.dental.validUntil"),
      code: "SMILE15",
      verified: true,
      location: t("demoOffers.dental.location"),
      rating: 4.9,
      originalPrice: 500,
      discountedPrice: 425,
    },
    {
      id: 5,
      title: t("demoOffers.spa.title"),
      subtitle: t("demoOffers.spa.subtitle"),
      provider: t("demoOffers.spa.provider"),
      category: "beauty",
      image: "/unsplash_images/photo-1544161515-4ab6ce6db874__w=600&h=400&fit=crop.jpg",
      discount: "25%",
      validUntil: t("demoOffers.spa.validUntil"),
      code: "SPA25",
      verified: true,
      location: t("demoOffers.spa.location"),
      rating: 4.8,
      originalPrice: 400,
      discountedPrice: 300,
    },
    {
      id: 6,
      title: t("demoOffers.personalTraining.title"),
      subtitle: t("demoOffers.personalTraining.subtitle"),
      provider: t("demoOffers.personalTraining.provider"),
      category: "fitness",
      image: "/unsplash_images/photo-1571019613454-1cb2f99b2d8b__w=600&h=400&fit=crop.jpg",
      discount: "40%",
      validUntil: t("demoOffers.personalTraining.validUntil"),
      code: "PT40",
      verified: true,
      location: t("demoOffers.personalTraining.location"),
      rating: 4.9,
      originalPrice: 150,
      discountedPrice: 90,
    },
  ];

  const tabs = [
    { id: "all", label: t("tabs.allOffers"), count: offers.length },
    { id: "medical", label: t("tabs.medical"), count: offers.filter((offer) => offer.category === "medical").length },
    { id: "beauty", label: t("tabs.beautySpa"), count: offers.filter((offer) => offer.category === "beauty").length },
    { id: "fitness", label: t("tabs.fitness"), count: offers.filter((offer) => offer.category === "fitness").length },
  ];

  const filteredOffers = selectedTab === "all"
    ? offers
    : offers.filter((offer) => offer.category === selectedTab);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="px-5 pt-3 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label={t("actions.back")}
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>

            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
              <p className="text-sm text-gray-600">{t("subtitle")}</p>
            </div>

            <div className="w-10 h-10 bg-[#eacb7f] rounded-full flex items-center justify-center">
              <Sparkles size={20} className="text-[#083f30]" />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-5 px-5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  selectedTab === tab.id
                    ? "bg-[#083f30] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t("tabs.countLabel", { label: tab.label, count: tab.count })}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-2">
        <div className="relative h-40 rounded-2xl overflow-hidden shadow-lg">
          <img
            src={offers[0].image}
            alt={offers[0].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#083f30]/95 to-[#083f30]/60" />

          <div className="absolute inset-0 flex flex-col justify-center px-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-[#eacb7f]" />
              <span className="text-xs font-bold text-[#eacb7f] uppercase tracking-wide">{t("featured.badge")}</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              {offers[0].title}
            </h2>
            <p className="text-white/90 text-sm">
              {t("featured.useCode")} <span className="font-bold text-[#eacb7f]">{offers[0].code}</span>
            </p>
          </div>

          <div className="absolute top-3 right-3 bg-[#eacb7f] px-3 py-1.5 rounded-full">
            <span className="text-sm font-bold text-[#083f30]">
              {t("discount.off", { discount: offers[0].discount })}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {filteredOffers.map((offer) => (
          <div
            key={offer.id}
            onClick={() => navigate(`/app/booking/${offer.id}`)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <div className="relative h-48">
              <img
                src={offer.image}
                alt={offer.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              <div className="absolute top-3 right-3 bg-[#eacb7f] px-3 py-1.5 rounded-full shadow-lg">
                <span className="text-sm font-bold text-[#083f30]">
                  {t("discount.off", { discount: offer.discount })}
                </span>
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
                  {formatPrice(offer.discountedPrice, locale)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(offer.originalPrice, locale)}
                </span>
                <span className="text-sm font-semibold text-green-600">
                  {t("pricing.save", { amount: formatPrice(offer.originalPrice - offer.discountedPrice, locale) })}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-xl px-3 py-2">
                  <Tag size={16} className="text-[#083f30]" />
                  <span className="font-bold text-gray-900 text-sm">{offer.code}</span>
                  <button
                    className="ml-auto text-xs text-[#083f30] font-semibold hover:underline"
                    onClick={(e) => handleCopyCode(offer.code, e)}
                  >
                    {copiedCode === offer.code ? <Check size={14} /> : t("code.copy")}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Clock size={14} />
                  <span>{t("validity.until", { date: offer.validUntil })}</span>
                </div>
              </div>

              <button
                className="w-full h-11 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors active:scale-98"
                onClick={(e) => handleBookNow(offer.id, e)}
              >
                {t("cta.bookNow")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
