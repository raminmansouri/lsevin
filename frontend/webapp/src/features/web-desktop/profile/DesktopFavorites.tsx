"use client";

import { Heart, MapPin, Star } from "lucide-react";
import { useTranslations } from "next-intl";

import type { FavoriteCard, FavoriteTab, FavoritesTabId } from "@/app/[locale]/n/app/mobile/profile/favorites/types";

import { Reveal } from "../components/motion";

/** Desktop favourites (>= 1280px). State and actions come from FavoritesPageClient. */
export function DesktopFavorites({
  tabs,
  activeTab,
  onTab,
  items,
  errorMessage,
  pending,
  onRemove,
  onOpen,
  onExplore,
}: {
  tabs: FavoriteTab[];
  activeTab: FavoritesTabId;
  onTab: (id: FavoritesTabId) => void;
  items: FavoriteCard[];
  errorMessage: string | null;
  pending: boolean;
  onRemove: (favoriteId: string) => void;
  onOpen: (item: FavoriteCard) => void;
  onExplore: () => void;
}) {
  const t = useTranslations("MobileProfile.favorites");

  return (
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg overflow-hidden rounded-[36px] px-12 py-12 text-white">
          <Reveal className="space-y-3">
            <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">SAVED</span>
            <h1 className="lsd-gold-text text-[40px] font-black leading-tight">{t("title")}</h1>
          </Reveal>
        </div>
      </section>

      <nav className="lsd-container mt-10 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTab(tab.id)}
            className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
              activeTab === tab.id ? "bg-[#083f30] text-[#eacb7f]" : "bg-white text-[#56675f] ring-1 ring-[#e7dcc4] hover:text-[#083f30]"
            }`}
          >
            {tab.label}
            <span className={`ms-2 text-xs ${activeTab === tab.id ? "text-white/60" : "text-[#a8a08e]"}`}>{tab.count}</span>
          </button>
        ))}
      </nav>

      <section className="lsd-container mt-8">
        {errorMessage ? (
          <p className="mb-6 rounded-[18px] border border-[#f1c7c0] bg-[#fdf1ef] px-6 py-4 text-sm text-[#8f2f26]">{errorMessage}</p>
        ) : null}

        {items.length ? (
          <div className="grid grid-cols-4 gap-6">
            {items.map((item, index) => (
              <Reveal key={item.favoriteId} delay={(index % 4) * 70}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpen(item);
                    }
                  }}
                  className="group block cursor-pointer overflow-hidden rounded-[24px] bg-white ring-1 ring-[#e7dcc4] transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_50px_-30px_rgba(6,42,32,0.45)] hover:ring-[#c9a55a]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#f4efe4]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemove(item.favoriteId);
                      }}
                      disabled={pending}
                      aria-label={t("removeFavoriteAria", { name: item.name })}
                      className="absolute end-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#c2453a] shadow-sm transition hover:scale-105 disabled:opacity-50"
                    >
                      <Heart size={18} fill="currentColor" />
                    </button>
                    {item.providerTypeLabel ? (
                      <span className="absolute bottom-3 start-3 rounded-full bg-[#083f30]/90 px-3 py-1 text-xs font-bold text-[#eacb7f] backdrop-blur-sm">
                        {item.providerTypeLabel}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-1.5 p-5">
                    <h3 className="truncate text-lg font-black text-[#0e1a16]">{item.name}</h3>
                    {item.specialty ? <p className="truncate text-sm text-[#6b6150]">{item.specialty}</p> : null}
                    <p className="flex items-center gap-1.5 truncate text-sm text-[#8a8170]">
                      <MapPin size={14} className="shrink-0 text-[#c9a55a]" />
                      <span className="truncate">{item.location}</span>
                    </p>
                    <p className="flex items-center gap-1.5 pt-1 text-sm">
                      <Star size={14} className="fill-[#c9a55a] text-[#c9a55a]" />
                      <span className="font-bold text-[#0e1a16]">{item.rating.toFixed(1)}</span>
                      <span className="text-[#a8a08e]">({item.reviews})</span>
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md py-20 text-center">
            <span className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-white text-[#c9a55a] ring-1 ring-[#e7dcc4]">
              <Heart size={30} />
            </span>
            <h3 className="text-xl font-black text-[#0e1a16]">{t("emptyTitle")}</h3>
            <p className="mt-2 text-[#6b6150]">{t("emptyDescription")}</p>
            <button type="button" onClick={onExplore} className="lsd-btn lsd-btn-green mt-6 h-12 px-8 text-sm">
              {t("exploreServices")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}