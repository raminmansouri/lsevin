"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { purgeAllCacheAction, type PurgeCacheResult } from "./cache-actions";

export function PurgeCacheButton() {
  const t = useTranslations("AdminGenerated");
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<PurgeCacheResult | null>(null);

  const run = () => {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await purgeAllCacheAction();
        setResult(res);
      } catch (error) {
        setResult({
          ok: false,
          revalidatedAt: new Date().toISOString(),
          tagCount: 0,
          error: (error as Error).message,
        });
      } finally {
        setConfirming(false);
      }
    });
  };

  return (
    <div className="space-y-3">
      {!confirming ? (
        <Button
          variant="destructive"
          onClick={() => {
            setResult(null);
            setConfirming(true);
          }}
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4" />
          {t("purgeAllCache")}
        </Button>
      ) : (
        <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-sm font-medium text-red-900 dark:text-red-200">
            {t("purgeCacheConfirmMessage")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={run} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isPending ? t("purging") : t("yesPurgeEverything")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirming(false)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}

      {result?.ok ? (
        <p className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          {t("cachePurgedAt", {
            count: result.tagCount,
            time: new Date(result.revalidatedAt).toLocaleTimeString(),
          })}
        </p>
      ) : null}

      {result && !result.ok ? (
        <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          {result.error ?? t("failedToPurgeCache")}
        </p>
      ) : null}
    </div>
  );
}
