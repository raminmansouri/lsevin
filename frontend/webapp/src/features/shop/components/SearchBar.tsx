"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function SearchBar({ defaultValue = "", className }: { defaultValue?: string; className?: string }) {
  const t = useTranslations("Shop");
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/n/app/mobile/shop/search?q=${encodeURIComponent(q)}` : "/n/app/mobile/shop/search");
      }}
      className={cn(
        // min-w-0 so this flex item can actually shrink below its content on
        // narrow phones instead of forcing the header wider than the viewport
        "flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white py-2 pe-1.5 ps-3.5 shadow-sm ring-1 ring-black/[0.06]",
        className
      )}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400" aria-hidden>
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("search")}
        className="w-0 min-w-0 flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
      />
      <button
        type="submit"
        aria-label={t("search")}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#083f30] text-white"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
          <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}
