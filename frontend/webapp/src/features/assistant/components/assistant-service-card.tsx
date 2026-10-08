"use client";

import { MapPin, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { formatMoney } from "@/features/finance/lib/money";
import { resolveMediaUrl } from "@/features/service-providers/lib/media-url";
import { Link } from "@/i18n/navigation";

import type { AssistantServiceResult } from "../types";

export function AssistantServiceCard({ service }: { service: AssistantServiceResult }) {
  const t = useTranslations("Assistant.card");
  const locale = useLocale();
  const hasPrice = service.price > 0;
  const hasRating = service.rating > 0;
  const typeLabel =
    service.type === "provider"
      ? t("types.provider")
      : service.type === "specialist"
        ? t("types.specialist")
        : null;

  return (
    <Link
      href={service.href}
      className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm transition active:scale-[0.98]"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        <ImageWithFallback
          fill
          src={resolveMediaUrl(service.image)}
          alt={service.name}
          sizes="80px"
          className="object-cover"
          fallbackClassName="h-full w-full"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-sm font-bold text-gray-900">{service.name}</p>
          {typeLabel ? (
            <span className="shrink-0 rounded-full bg-[#eacb7f]/30 px-1.5 py-0.5 text-[10px] font-semibold text-[#083f30]">
              {typeLabel}
            </span>
          ) : null}
        </div>
        <p className="truncate text-xs text-gray-600">{service.provider}</p>

        <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
          {service.location ? (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{service.location}</span>
            </span>
          ) : null}
          {hasRating ? (
            <span className="flex items-center gap-0.5">
              <Star size={12} className="fill-[#eacb7f] text-[#eacb7f]" />
              {new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(service.rating)}
            </span>
          ) : null}
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-[#083f30]">
            {hasPrice
              ? formatMoney({ amount: service.price, currencyCode: service.currency }, { locale })
              : t("priceOnRequest")}
          </span>
          <span className="text-[11px] font-semibold text-[#083f30]">{t("viewService")}</span>
        </div>
      </div>
    </Link>
  );
}