"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { CONSULTATION_TRANSLATION_KEY, type ConsultationStats } from "../../types";

type Tile = {
  key: string;
  value: number;
  /** Failed deliveries are the only number on the strip that means "act now". */
  alert?: boolean;
};

export function ConsultationStatsStrip({ stats }: { stats: ConsultationStats }) {
  const t = useTranslations(CONSULTATION_TRANSLATION_KEY);

  const tiles: Tile[] = [
    { key: "total", value: stats.total },
    { key: "new", value: stats.newCount },
    { key: "inProgress", value: stats.inProgressCount },
    { key: "contacted", value: stats.contactedCount },
    { key: "done", value: stats.doneCount },
    { key: "rejected", value: stats.rejectedCount },
    {
      key: "failedNotifications",
      value: stats.failedNotifications,
      alert: stats.failedNotifications > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
      {tiles.map((tile) => (
        <div
          key={tile.key}
          className={cn(
            "bg-card rounded-lg border p-3 text-start",
            tile.alert &&
              "border-destructive/40 bg-destructive/5 dark:bg-destructive/10"
          )}
        >
          <p className="text-muted-foreground truncate text-xs">
            {t(`admin.stats.${tile.key}`)}
          </p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tabular-nums",
              tile.alert && "text-destructive"
            )}
          >
            {tile.value}
          </p>
        </div>
      ))}
    </div>
  );
}
