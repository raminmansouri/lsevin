import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const AuthContentSkeleton = () => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2 text-center">
        <Skeleton className="mx-auto h-7 w-48" />
        <Skeleton className="mx-auto h-5 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input fields */}
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}

        {/* Submit button */}
        <Skeleton className="mx-auto mt-6 h-10 w-full" />

        {/* Separator + links */}
        <div className="pt-4">
          <Skeleton className="mx-auto my-4 h-[1px] w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
