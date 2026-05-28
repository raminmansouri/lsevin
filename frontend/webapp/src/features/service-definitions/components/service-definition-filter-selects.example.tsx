"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { LazySearchableSelect } from "@/features/admin-lazy-select";

export function ServiceDefinitionCategoryFilter({ locale }: { locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || "";

  return (
    <LazySearchableSelect
      value={categoryId}
      resource="category"
      locale={locale}
      placeholder="All categories"
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (typeof value === "string" && value) params.set("categoryId", value);
        else params.delete("categoryId");
        params.set("page", "1");
        router.push(`?${params.toString()}`);
      }}
    />
  );
}
