"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { findSimilarProductsAction } from "../../actions/admin-catalog.actions";

type Match = { id: string; name: string; brand: string | null; imageUrl: string | null; sellerCount: number };

/** Warns, while a new product is being named, that it may already exist; links to add a seller instead. */
export function SimilarProductsHint({ names }: { names: string[] }) {
  const t = useTranslations("ShopAdmin");
  const [matches, setMatches] = useState<Match[]>([]);
  const key = names.map((n) => (n ?? "").trim()).filter((n) => n.length >= 3).join("|");

  useEffect(() => {
    if (!key) {
      setMatches([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await findSimilarProductsAction({ names: key.split("|") });
        if (!cancelled) setMatches(res);
      } catch {
        if (!cancelled) setMatches([]);
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key]);

  if (!matches.length) return null;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
      <p className="text-sm font-bold text-amber-900">{t("similar.title")}</p>
      <p className="mb-2 text-xs text-amber-800">{t("similar.hint")}</p>
      <ul className="space-y-2">
        {matches.map((m) => (
          <li key={m.id} className="flex items-center gap-3 rounded-lg bg-white p-2 ring-1 ring-amber-200">
            {m.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
            ) : (
              <span className="h-10 w-10 shrink-0 rounded bg-gray-100" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-gray-900">{m.name}</span>
              <span className="block text-xs text-gray-500">
                {[m.brand, t("similar.sellers", { count: m.sellerCount })].filter(Boolean).join(" · ")}
              </span>
            </span>
            <Link
              href={`/admin/shop/products/${m.id}`}
              className="shrink-0 rounded-lg bg-[#083f30] px-3 py-1.5 text-xs font-semibold text-white"
            >
              {t("similar.addSeller")}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}