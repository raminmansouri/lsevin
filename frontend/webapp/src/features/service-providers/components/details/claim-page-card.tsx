"use client";

import { BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Lets the owner of a provider page, or the doctor of a doctor page, ask to manage it.
 * The link goes through /api/provider-portal-claim, which opens the claim form in the provider portal.
 */
export function ClaimPageCard({ targetType, targetId, variant = "card" }: { targetType: "provider" | "staff"; targetId?: string | null; variant?: "card" | "link" }) {
  const t = useTranslations("ClaimPage");
  if (!targetId) return null;
  const href = `/api/provider-portal-claim?type=${targetType}&id=${encodeURIComponent(targetId)}`;
  if (variant === "link") {
    return (
      <a href={href} className="flex h-10 w-full items-center justify-center gap-2 rounded-full text-xs font-semibold text-white/60 transition hover:text-white">
        <BadgeCheck size={15} />
        {t("button")}
      </a>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold text-gray-900">{t("title")}</p>
        <p className="mt-1 text-xs leading-6 text-gray-600">{t(targetType === "provider" ? "providerText" : "staffText")}</p>
      </div>
      <a href={href} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#083f30]/30 bg-white px-4 py-2 text-sm font-bold text-[#083f30] hover:bg-[#083f30]/5">
        <BadgeCheck size={16} />
        {t("button")}
      </a>
    </div>
  );
}
