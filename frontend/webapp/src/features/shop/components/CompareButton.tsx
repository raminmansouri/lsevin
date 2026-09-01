"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { toggleCompareAction } from "../actions/compare.actions";

export function CompareButton({
  productId,
  initialInList,
  initialCount,
}: {
  productId: string;
  initialInList: boolean;
  initialCount: number;
}) {
  const t = useTranslations("Shop");
  const [inList, setInList] = useState(initialInList);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMsg(null);
          startTransition(async () => {
            const res = await toggleCompareAction({ productId });
            if (res.atMax) {
              setMsg(t("compareFull", { count: 4 }));
              return;
            }
            setInList(res.inList);
            setCount(res.count);
          });
        }}
        className={cn(
          "rounded-full border px-3 py-1.5 text-xs font-semibold",
          inList ? "border-[#083f30] bg-[#083f30]/5 text-[#083f30]" : "border-neutral-300 text-neutral-600"
        )}
      >
        {inList ? t("removeFromCompare") : t("addToCompare")}
      </button>
      {count > 0 ? (
        <Link href="/n/app/mobile/shop/compare" className="text-xs font-semibold text-[#083f30]">
          {t("compareTitle")} ({count})
        </Link>
      ) : null}
      {msg ? <span className="text-xs text-amber-700">{msg}</span> : null}
    </div>
  );
}
