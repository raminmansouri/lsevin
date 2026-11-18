"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserListSort } from "@/features/customers-admin/lib/user-list-params";

/** Sort dropdown for the admin user lists; writes `sort` to the URL and resets paging. */
export function UserListSortSelect({
  value,
  label,
  options,
}: {
  value: UserListSort;
  label: string;
  options: { value: UserListSort; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={value}
      disabled={pending}
      onValueChange={(next) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("page");
        if (next === "newest") params.delete("sort");
        else params.set("sort", next);
        const qs = params.toString();
        startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
      }}
    >
      <SelectTrigger className="w-full sm:w-52" aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
