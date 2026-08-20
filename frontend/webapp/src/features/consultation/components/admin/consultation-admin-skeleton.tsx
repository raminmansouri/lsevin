import { Skeleton } from "@/components/ui/skeleton";

/** Shape-matched to ConsultationAdminBoard so the page does not jump on hydration. */
export function ConsultationAdminSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-[74px] w-full rounded-lg" />
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-9 w-full sm:max-w-xs" />
          <Skeleton className="h-9 w-full sm:w-[170px]" />
          <Skeleton className="h-9 w-full sm:w-[170px]" />
        </div>
        <Skeleton className="h-[420px] w-full rounded-lg" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
