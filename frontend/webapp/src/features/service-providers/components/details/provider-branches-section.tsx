"use client";

import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { resolveMediaUrl } from "@/features/service-providers/lib/media-url";
import type { ProviderBranch } from "@/features/service-providers/types/provider-page-types";
import { Link } from "@/i18n/navigation";

const FALLBACK_IMAGE = "/placeholder-provider.svg";

type Props = {
  branches?: ProviderBranch[] | null;
  /** "desktop" matches the big lsd headings of the desktop page; "mobile" the compact app look. */
  variant?: "desktop" | "mobile";
  className?: string;
};

/**
 * "Other branches": the other locations of the same business, linked by an admin with the
 * "branch" type in the provider's Recommendations tab. Renders nothing when there are none.
 * Shared by every provider type (hotel, clinic, gym, ...), since they all use the same page.
 */
export function ProviderBranchesSection({ branches, variant = "mobile", className }: Props) {
  const t = useTranslations("ProviderPage.branches");
  const locale = useLocale();
  if (!branches?.length) return null;

  const isDesktop = variant === "desktop";

  return (
    <section id="provider-branches" className={className}>
      <div className={isDesktop ? "mb-8" : "mb-4"}>
        <h2
          className={
            isDesktop
              ? "lsd-heading text-4xl font-black text-[#0e1a16]"
              : "text-lg font-bold text-gray-900"
          }
        >
          {t("title")}
        </h2>
        <p className={isDesktop ? "mt-3 text-[#56675f]" : "mt-1 text-sm text-gray-600"}>
          {t("subtitle")}
        </p>
      </div>

      <div className={isDesktop ? "grid grid-cols-2 gap-5" : "grid grid-cols-1 gap-3 sm:grid-cols-2"}>
        {branches.map((branch) => {
          const place = [branch.city, branch.country].filter(Boolean).join(locale === "fa" || locale === "ar" ? "، " : ", ");
          const image = resolveMediaUrl(branch.image) || FALLBACK_IMAGE;
          return (
            <Link
              key={branch.id}
              href={branch.link}
              className="group flex items-stretch overflow-hidden rounded-2xl border border-[#dce4e0] bg-white transition-all hover:border-[#083f30] hover:shadow-lg"
            >
              <span className="relative m-2 block aspect-square w-24 shrink-0 self-center overflow-hidden rounded-xl bg-gray-100 sm:w-28">
                <ImageWithFallback
                  fill
                  src={image}
                  alt={branch.title}
                  sizes="128px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  fallbackClassName="h-full w-full"
                />
              </span>
              <span className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-4">
                <span className="line-clamp-2 font-bold text-[#0e1a16] transition-colors group-hover:text-[#083f30]">
                  {branch.title}
                </span>
                {place || branch.address ? (
                  <span className="flex items-start gap-1.5 text-sm text-[#56675f]">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-[#083f30]" />
                    <span className="line-clamp-2">
                      {[place, branch.address].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                ) : null}
                <span className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#8c6b2c]">
                  {t("viewBranch")}
                  <ChevronRight size={16} className="rtl:hidden" />
                  <ChevronLeft size={16} className="ltr:hidden" />
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
