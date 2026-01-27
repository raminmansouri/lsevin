import { Skeleton } from "@/components/ui/skeleton";

export const ServiceProviderDetailsSkeleton = () => {
  return (
    <div className="relative min-h-screen">
      {/* Hero Image Skeleton */}
      <div className="relative h-80 w-full md:h-96">
        <Skeleton className="h-full w-full rounded-none" />

        {/* Gallery count badge skeleton */}
        <div className="absolute top-4 right-4">
          <Skeleton className="h-6 w-16" />
        </div>
      </div>

      {/* Content Section with Rounded Top */}
      <div className="bg-background relative -mt-6 min-h-screen rounded-t-3xl shadow-lg">
        {/* Header Section Skeleton */}
        <section className="bg-primary/10 flex items-center justify-between p-4">
          <div className="text-center">
            <Skeleton className="h-6 w-32 md:h-8 md:w-48" />
          </div>

          {/* Contact Button Skeleton */}
          <div>
            <Skeleton className="h-11 w-32" />
          </div>
        </section>

        {/* Content Section */}
        <section className="px-6 pt-8">
          {/* About Section Skeleton */}
          <div className="mb-8">
            <div className="mb-4 flex items-center">
              <Skeleton className="mr-3 h-2 w-2 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Available Services Section Skeleton */}
          <div className="mb-8">
            <div className="mb-4 flex items-center">
              <Skeleton className="mr-3 h-2 w-2 rounded-full" />
              <Skeleton className="h-6 w-36" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-muted/50 flex items-center justify-between rounded-lg p-4"
                >
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Policies Section Skeleton */}
          <div className="mb-8">
            <div className="mb-4 flex items-center">
              <Skeleton className="mr-3 h-2 w-2 rounded-full" />
              <Skeleton className="h-6 w-28" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gallery Section Skeleton */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <Skeleton className="mr-3 h-2 w-2 rounded-full" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>

            <div className="space-y-4">
              {/* Gallery grid skeleton */}
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="aspect-square w-full" />
                ))}
              </div>

              {/* View Gallery button skeleton */}
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
