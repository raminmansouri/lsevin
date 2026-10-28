"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";

export function CustomerSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(initialQuery);

  const applySearch = useCallback(
    (raw: string) => {
      const term = raw.trim();
      if (term === (searchParams.get("q") ?? "")) return;
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      if (term) params.set("q", term);
      else params.delete("q");
      const qs = params.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const handle = setTimeout(() => applySearch(value), 400);
    return () => clearTimeout(handle);
  }, [value, applySearch]);

  return (
    <Input
      type="search"
      dir="rtl"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          applySearch(value);
        }
      }}
      placeholder="جستجوی نام مشتری..."
      aria-label="جستجوی نام مشتری"
    />
  );
}
