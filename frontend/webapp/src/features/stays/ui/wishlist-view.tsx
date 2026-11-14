"use client";

import { useTranslations } from "next-intl";

import type { PropertyCard } from "../types";

import { PropertyCardView } from "./property-card";

export function WishlistView({ items }: { items: PropertyCard[] }) {
  const t = useTranslations("StayApp.wishlist");
  return (
    <div className="px-4 py-4 sm:px-6">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>
      {items.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white p-8 text-center text-slate-600 ring-1 ring-slate-200" data-testid="stay-wishlist-empty">
          {t("empty")}
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="stay-wishlist">
          {items.map((c) => (
            <li key={c.id}>
              <PropertyCardView card={c} saved />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
