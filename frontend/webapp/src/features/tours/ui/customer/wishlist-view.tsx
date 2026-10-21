"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

import { cardsAction } from "../../server/actions/customer";
import type { TourCard as TourCardData } from "../../server/platform/catalog";
import { ToursErrorAlert, type ToursActionError } from "../shared/error-alert";
import { formatNumber } from "../shared/format";

import { useToursPrefs } from "./prefs-context";
import { TourCard } from "./tour-card";
import { readGuestWishlist } from "./wishlist-button";

export function WishlistView({ serverCards }: { serverCards: TourCardData[] | null }) {
  const t = useTranslations("TourApp.wishlist");
  const locale = useLocale();
  const pathname = usePathname();
  const { signedIn } = useToursPrefs();
  const [cards, setCards] = useState<TourCardData[] | null>(serverCards);
  const [error, setError] = useState<ToursActionError | null>(null);
  const [compare, setCompare] = useState<string[]>([]);

  useEffect(() => {
    if (serverCards) return;
    const ids = readGuestWishlist();
    if (ids.length === 0) {
      setCards([]);
      return;
    }
    void cardsAction(ids, locale)
      .then((res) => {
        if (res.ok) {
          setCards(res.data);
        } else {
          setError((res as { error: ToursActionError }).error);
          setCards([]);
        }
      })
      .catch(() => {
        setError({ kind: "infrastructure", code: "service_unavailable" });
        setCards([]);
      });
  }, [serverCards, locale]);

  return (
    <div className="px-4 pt-4 sm:px-6" data-testid="wishlist">
      <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
      {!signedIn ? (
        <p className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-sky-50 p-3 text-sm text-sky-900" data-testid="wishlist-guest-note">
          {t("guestNote")}
          <Link href={`/sign-in?redirectTo=${encodeURIComponent(pathname)}`} className="min-h-11 content-center font-semibold underline">
            {t("signIn")}
          </Link>
        </p>
      ) : null}
      <ToursErrorAlert error={error} className="mt-3" />
      {cards === null ? (
        <p role="status" className="mt-6 text-sm text-slate-500">
          …
        </p>
      ) : cards.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">{t("empty")}</p>
      ) : (
        <>
          {cards.length > 1 ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-slate-600">{t("compareHint")}</span>
              {compare.length >= 2 ? (
                <Link href={`/tours/compare?ids=${compare.join(",")}`} className="inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-4 font-semibold text-white" data-testid="compare-link">
                  {t("compare")} ({formatNumber(compare.length, locale)})
                </Link>
              ) : null}
            </div>
          ) : null}
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <li key={c.id} className="space-y-1">
                <TourCard card={c} saved />
                {cards.length > 1 ? (
                  <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={compare.includes(c.id)}
                      disabled={!compare.includes(c.id) && compare.length >= 3}
                      onChange={(e) => setCompare((x) => (e.target.checked ? [...x, c.id].slice(0, 3) : x.filter((y) => y !== c.id)))}
                      className="size-5 accent-emerald-700"
                    />
                    {t("compare")}
                  </label>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
