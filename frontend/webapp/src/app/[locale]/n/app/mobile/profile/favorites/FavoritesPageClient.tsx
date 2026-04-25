"use client";

import { useMemo, useState, useTransition } from "react";
import { useNavigate } from "@/hooks/use-navigate";
import { ChevronLeft, Heart, MapPin, Star } from "lucide-react";

import { removeFavoriteAction } from "./actions";
import type { FavoriteCard, FavoritesPageData, FavoritesTabId } from "./types";
import { resolveFavoriteHref } from "./utils";

interface FavoritesPageClientProps {
  initialData: FavoritesPageData;
}

export default function FavoritesPageClient({
  initialData,
}: FavoritesPageClientProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FavoritesTabId>("all");
  const [favorites, setFavorites] = useState<FavoriteCard[]>(initialData.favorites);
  const [pendingFavoriteId, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tabs = useMemo(() => {
    const counts = {
      all: favorites.length,
      clinic: favorites.filter((item) => item.tabId === "clinic").length,
      doctor: favorites.filter((item) => item.tabId === "doctor").length,
      salon: favorites.filter((item) => item.tabId === "salon").length,
      gym: favorites.filter((item) => item.tabId === "gym").length,
    };

    return [
      { id: "all", label: "All", count: counts.all },
      { id: "clinic", label: "Clinics", count: counts.clinic },
      { id: "doctor", label: "Doctors", count: counts.doctor },
      { id: "salon", label: "Salons", count: counts.salon },
      { id: "gym", label: "Gyms", count: counts.gym },
    ] as FavoritesPageData["tabs"];
  }, [favorites]);

  const filteredFavorites = useMemo(() => {
    if (activeTab === "all") {
      return favorites;
    }

    return favorites.filter((favorite) => favorite.tabId === activeTab);
  }, [activeTab, favorites]);

  const handleRemoveFavorite = (favoriteId: string) => {
    const previousFavorites = favorites;
    setErrorMessage(null);
    setFavorites((current) => current.filter((item) => item.favoriteId !== favoriteId));

    startTransition(async () => {
      const result = await removeFavoriteAction(favoriteId);

      if (!result.ok) {
        setFavorites(previousFavorites);
        setErrorMessage(result.message);
      }
    });
  };

  const handleCardClick = (item: FavoriteCard) => {
    navigate(resolveFavoriteHref(item.favoriteType, item.entityId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/n/app/mobile/profile")}
            className="w-10 h-10 -ml-2 flex items-center justify-center text-gray-600"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Saved Favorites</h1>
        </div>

        <div className="px-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? "bg-[#083f30] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {filteredFavorites.length > 0 ? (
          <div className="space-y-4">
            {filteredFavorites.map((item) => (
              <button
                key={item.favoriteId}
                onClick={() => handleCardClick(item)}
                className="w-full text-left bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#083f30] hover:shadow-md transition-all"
              >
                <div className="flex">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover"
                  />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                        {!!item.specialty && (
                          <p className="text-sm text-gray-600 mb-1 line-clamp-1">{item.specialty}</p>
                        )}
                        <div className="flex items-center gap-1 text-sm text-gray-500 line-clamp-1">
                          <MapPin size={14} className="flex-shrink-0" />
                          <span className="line-clamp-1">{item.location}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveFavorite(item.favoriteId);
                        }}
                        disabled={pendingFavoriteId}
                        className="w-8 h-8 flex items-center justify-center text-red-500 disabled:opacity-50"
                        aria-label={`Remove ${item.name} from favorites`}
                      >
                        <Heart size={20} fill="currentColor" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-amber-500" fill="currentColor" />
                      <span className="text-sm font-semibold text-gray-900">
                        {item.rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">({item.reviews})</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Heart size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Favorites Yet</h3>
            <p className="text-gray-600 mb-6">Start saving your favorite providers</p>
            <button
              onClick={() => navigate("/app/explore")}
              className="px-6 py-3 bg-[#083f30] text-white rounded-xl font-medium"
            >
              Explore Services
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
