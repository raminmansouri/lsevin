"use client";

import { Plus, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";

export const StaffListToolbar = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <form className="relative w-full md:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="search"
          defaultValue={searchParams.get("search") || ""}
          placeholder="Search staff, title, specialty..."
          className="pl-9"
        />
      </form>
      <Button type="button" onClick={() => router.push("/admin/staff/add")} className="bg-[#083f30] hover:bg-[#083f30]/90">
        <Plus className="mr-2 h-4 w-4" /> Add staff
      </Button>
    </div>
  );
};
