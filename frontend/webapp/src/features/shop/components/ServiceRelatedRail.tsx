"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { logServiceRelationClickAction } from "../actions/service-relation.actions";
import { ProductCard, shopCardLabels } from "./ProductCard";
import type { ProductCard as ProductCardModel } from "../types/domain";
import type { ServiceRelationType } from "../api/service-relations.repository";

const REL_KEY: Record<ServiceRelationType, string> = {
  recommended_before: "relBefore",
  recommended_after: "relAfter",
  required: "relRequired",
  optional_addon: "relAddon",
  compatible: "relCompatible",
  general: "relGeneral",
};

export function ServiceRelatedRail({
  serviceDefinitionId,
  serviceName,
  groups,
  locale,
}: {
  serviceDefinitionId: string;
  serviceName: string;
  groups: Array<{ relationType: ServiceRelationType; products: ProductCardModel[] }>;
  locale: string;
}) {
  const t = useTranslations("Shop");
  const labels = shopCardLabels(t as never);

  if (!groups.length) return null;

  return (
    <section className="mt-2 bg-white p-4">
      <h2 className="mb-1 text-sm font-bold text-neutral-900">{t("serviceRelated", { service: serviceName })}</h2>
      {groups.map((g) => (
        <div key={g.relationType} className="mt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {t(REL_KEY[g.relationType] as never)}
          </p>
          <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
            {g.products.map((p) => (
              <Link
                key={p.id}
                href={`/n/app/mobile/shop/product/${p.slug}`}
                onClick={() => {
                  void logServiceRelationClickAction({ serviceDefinitionId, productId: p.id });
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
