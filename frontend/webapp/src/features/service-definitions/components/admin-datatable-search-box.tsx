"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { cn } from "@/lib/utils";

type Props = {
  placeholder?: string;
  className?: string;
  paramName?: string;
};

export function AdminDatatableSearchBox({
  placeholder = "Search services...",
  className,
  paramName = "search",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialValue = useMemo(() => {
    return (
      searchParams.get(paramName) ||
      searchParams.get("q") ||
      searchParams.get("query") ||
      searchParams.get("keyword") ||
      searchParams.get("globalFilter") ||
      ""
    );
  }, [paramName, searchParams]);

  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const next = value.trim();

      // Normalize all possible old search keys into one canonical key.
      ["search", "q", "query", "keyword", "term", "globalFilter", "global", "name"].forEach((key) => {
        params.delete(key);
      });

      if (next) params.set(paramName, next);
      else params.delete(paramName);

      // Important: searching from page 4 can look broken if page 4 has no results.
      params.set("page", "1");

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, 350);

    return () => window.clearTimeout(handle);
  }, [value, searchParams, paramName, pathname, router]);

  return (
    <div className={cn("relative w-full sm:max-w-sm", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
      {isPending ? <div className="absolute bottom-0 left-0 h-px w-full animate-pulse bg-primary/60" /> : null}
    </div>
  );
}
