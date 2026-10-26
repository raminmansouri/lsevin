"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { logServiceRelationClickAction } from "../actions/service-relation.actions";
import { ProductCard, shopCardLabels } from "./ProductCard";
import type { ProductCard as ProductCardModel } from "../types/domain";

/**
 * Booking step 1: the shop products linked to the selected service, as one
 * horizontal row under the provider / service / specialist cards. Read-only —
 * it never touches the booking draft. Renders nothing when the service has no
 * linked products (or the request fails), so it can sit in the stack unconditionally.
 */
export function BookingServiceProductsRow({
  serviceDefinitionId,
  serviceName,
  locale,
}: {
  serviceDefinitionId: string;
  /** name of the selected service as shown on its card; falls back to the definition name */
  serviceName?: string | null;
  locale: string;
}) {
  const t = useTranslations("Shop");
  const labels = shopCardLabels(t as never);
  const [state, setState] = useState<{ id: string; products: ProductCardModel[]; name: string } | null>(null);

  useEffect(() => {
    let alive = true;
    // /api/shop/* lives under the [locale] segment; the prefix also localizes names.
    fetch(`/${locale}/api/shop/service/${encodeURIComponent(serviceDefinitionId)}/products?limit=24`, {
      headers: { accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return;
        setState({
          id: serviceDefinitionId,
          products: Array.isArray(data?.flat) ? data.flat : [],
          name: typeof data?.serviceName === "string" ? data.serviceName : "",
        });
      })
      .catch(() => alive && setState({ id: serviceDefinitionId, products: [], name: "" }));
    return () => {
      alive = false;
    };
  }, [serviceDefinitionId, locale]);

  // Nothing while loading (first load, or the user just switched service): most
  // services have no linked products, so a skeleton would only flash and vanish.
  if (!state || state.id !== serviceDefinitionId) return null;
  if (!state.products.length) return null;

  const title = serviceName?.trim() || state.name;
  const isRtl = ["fa", "ar", "ku"].includes(locale);
  const Arrow = isRtl ? ChevronLeft : ChevronRight;

  return (
    <section className="pt-3">
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-slate-900">
            {title ? t("bookingRelatedProductsTitle", { service: title }) : t("serviceRelatedProductsTitle")}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">{t("bookingRelatedProductsSubtitle")}</p>
        </div>
        {state.products.length > 2 ? (
          <span className="flex shrink-0 items-center text-slate-400" aria-hidden>
            <Arrow className="h-4 w-4" />
            <Arrow className="-ms-2.5 h-4 w-4 opacity-60" />
            <Arrow className="-ms-2.5 h-4 w-4 opacity-30" />
          </span>
        ) : null}
      </div>
      <div className="no-scrollbar -mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-1">
        {state.products.map((p) => (
          <div
            key={p.id}
            className="w-[112px] shrink-0 snap-start"
            onClickCapture={() => {
              void logServiceRelationClickAction({ serviceDefinitionId, productId: p.id });
            }}
          >
            <ProductCard product={p} locale={locale} labels={labels} compact />
          </div>
        ))}
      </div>
    </section>
  );
}
