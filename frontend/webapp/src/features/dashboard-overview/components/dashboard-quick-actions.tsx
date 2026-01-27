import {
  ArrowRight,
  Building2,
  FolderTree,
  MessageSquare,
  Plus,
  Settings,
  Tags,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { TranslationType } from "@/types/next";

import { DashboardStats } from "../types";
import { QUICK_ACTIONS } from "../types/constants";

interface DashboardQuickActionsProps {
  stats: DashboardStats;
  t: TranslationType;
}

const iconMap = {
  MessageSquare,
  Building2,
  Users,
  FolderTree,
  Tags,
  Settings,
};

export function DashboardQuickActions({
  stats,
  t,
}: DashboardQuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {t("quickActions.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = iconMap[action.icon as keyof typeof iconMap];
            const count = stats[action.countKey];

            return (
              <Card
                key={action.href}
                className="transition-all hover:scale-105 hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary/10 rounded-md p-2">
                        <Icon className="text-primary h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium">
                          {t(`quickActions.${action.countKey}.title`)}
                        </h3>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {t(`quickActions.${action.countKey}.description`)}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-lg font-bold">
                            {count.toLocaleString()}
                          </span>
                          <div className="flex space-x-1">
                            {action.hasAdd && (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`${action.href}/add`}>
                                  <Plus className="h-3 w-3" />
                                </Link>
                              </Button>
                            )}
                            <Button variant="outline" size="sm" asChild>
                              <Link href={action.href}>
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardQuickActionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[150px]" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <div className="flex-1">
                      <Skeleton className="mb-2 h-4 w-[100px]" />
                      <Skeleton className="mb-3 h-3 w-[120px]" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-[40px]" />
                        <div className="flex space-x-1">
                          <Skeleton className="h-7 w-7" />
                          <Skeleton className="h-7 w-7" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
