"use client";

import { useTranslations } from "next-intl";

import { Hint } from "@/components/hint";
import { Card, CardContent } from "@/components/ui/card";
import { IconRenderer } from "@/components/ui/icon-renderer";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicProviderType } from "@/features/provider-types/types/provider-type";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface ProviderTypesSectionProps {
  providerTypes: PublicProviderType[];
  className?: string;
  showLabel?: boolean;
}

export const ProviderTypesSection = ({
  providerTypes,
  className,
  showLabel = true,
}: ProviderTypesSectionProps) => {
  const t = useTranslations("HomePage");

  if (!providerTypes.length) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showLabel && (
        <div className="flex items-center">
          <h3 className="text-lg font-semibold">{t("providerTypes")}</h3>
        </div>
      )}

      {/* Grid Layout */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {providerTypes.map((providerType) => (
          <Hint key={providerType.id} label={providerType.name} side="top">
            <Link href={`/type/${providerType.id}`} className="group">
              <Card className="hover:border-primary h-24 w-24 transition-all duration-200 hover:shadow-md sm:h-32 sm:w-32">
                <CardContent className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center sm:gap-2 sm:p-4">
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors sm:h-12 sm:w-12">
                    <IconRenderer
                      iconName={providerType.iconUrl}
                      size={16}
                      className="transition-colors sm:size-6"
                    />
                  </div>
                  <span className="w-full truncate text-xs leading-tight font-medium sm:text-sm">
                    {providerType.name}
                  </span>
                </CardContent>
              </Card>
            </Link>
          </Hint>
        ))}
      </div>
    </div>
  );
};

interface ProviderTypesSectionSkeletonProps {
  className?: string;
  showLabel?: boolean;
  itemCount?: number;
}

export const ProviderTypesSectionSkeleton = ({
  className,
  showLabel = true,
  itemCount = 6,
}: ProviderTypesSectionSkeletonProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      {showLabel && (
        <div className="flex items-center">
          <Skeleton className="h-6 w-24" />
        </div>
      )}

      {/* Grid Layout Skeleton */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {Array.from({ length: itemCount }, (_, index) => (
          <Card key={index} className="h-24 w-24 sm:h-32 sm:w-32">
            <CardContent className="flex h-full flex-col items-center justify-center gap-1 p-2 sm:gap-2 sm:p-4">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full sm:h-12 sm:w-12" />
              <Skeleton className="h-3 w-12 sm:h-4 sm:w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProviderTypesSection;
