import {
  Building2,
  Clock,
  FolderTree,
  MessageSquare,
  Settings,
  Tags,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { TranslationType } from "@/types/next";

import { DashboardStats } from "../types";
import { STATS_CARDS_CONFIG } from "../types/constants";

interface DashboardStatsCardsProps {
  stats: DashboardStats;
  t: TranslationType;
}

const iconMap = {
  MessageSquare,
  Building2,
  Users,
  Clock,
  FolderTree,
  Tags,
  Settings,
};

export function DashboardStatsCards({ stats, t }: DashboardStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {STATS_CARDS_CONFIG.map((config) => {
        const Icon = iconMap[config.icon as keyof typeof iconMap];
        const value = stats[config.key];

        return (
          <Link
            key={config.key}
            href={config.href}
            className="transition-transform hover:scale-105"
          >
            <Card className="cursor-pointer hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t(`stats.${config.key}.title`)}
                </CardTitle>
                <Icon className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {value.toLocaleString()}
                </div>
                <p className="text-muted-foreground text-xs">
                  {t(`stats.${config.key}.description`)}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export function DashboardStatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-2 h-8 w-[60px]" />
            <Skeleton className="h-3 w-[120px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
