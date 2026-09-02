"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { logServiceRelationClickAction } from "../actions/service-relation.actions";
import { ProductCard, shopCardLabels } from "./ProductCard";
import type { ProductCard as ProductCardModel } from "../types/domain";
import type { ServiceRelationType } from "../api/service-relations.repository";

/** relation type -> Shop i18n key for its heading */
const REL_KEY: Record<string, string> = {
  required: "relRequired",
  recommended_before: "relBefore",
  recommended_during: "relDuring",
  recommended_after: "relAfter",
  optional_addon: "relAddon",
  compatible: "relCompatible",
  general: "relGeneral",
};

type Group = { relationType: ServiceRelationType; products: ProductCardModel[] };

/**
 * Self-fetching product rail for a service / provider / specialist page
 * (SHP-V02-007). `src` is one of the public `/api/shop/{service|provider|
 * specialist}/…/products` contracts. Renders nothing until there is something
 * to show, so it is safe to drop unconditionally at the bottom of a page.
 */
export function ServiceProductsRail({
  src,
  locale,
  serviceDefinitionId,
  title,
}: {
  src: string;
  locale: string;
  /** when known (service page), lets a click be attributed */
  serviceDefinitionId?: string;
  title?: string;
}) {
  const t = useTranslations("Shop");
  const labels = shopCardLabels(t as never);
  const [groups, setGroups] = useState<Group[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(src, { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return;
        setGroups(Array.isArray(data?.byRelation) ? data.byRelation : []);
      })
      .catch(() => alive && setGroups([]));
    return () => {
      alive = false;
    };
  }, [src]);

  if (!groups || !groups.length) return null;

  return (
    <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
      <h2 className="mb-1 text-sm font-bold text-neutral-900">{title ?? t("serviceProductsHeading")}</h2>
      {groups.map((g) => (
        <div key={g.relationType} className="mt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {t((REL_KEY[g.relationType] ?? "relGeneral") as never)}
          </p>
          <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
            {g.products.map((p) => (
              <Link
                key={p.id}
                href={`/n/app/mobile/shop/product/${p.slug}`}
                onClick={() => {
                  if (serviceDefinitionId) {
                    void logServiceRelationClickAction({ serviceDefinitionId, productId: p.id });
                  }
                }}
                className="w-[150px] shrink-0"
              >
                <ProductCard product={p} locale={locale} labels={labels} />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
