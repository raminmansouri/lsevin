"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { setRolePermissionsAction } from "../server/actions";
import { useHydrated } from "./use-hydrated";
import { useRunAction } from "./use-run-action";

export type MatrixLevel = "view" | "manage";

export type MatrixResource = {
  key: string;
  /** Already translated by the server. */
  label: string;
  href: string;
  origin: "nav" | "unlisted";
  unlimitedOnly: boolean;
  /** Not grantable yet: its server-side guards are not migrated. */
  pending: boolean;
  sensitive: boolean;
};

export type MatrixGroup = { groupKey: string; label: string; resources: MatrixResource[] };

const LEVELS: Array<MatrixLevel | "none"> = ["none", "view", "manage"];

export function PermissionMatrix({
  roleId,
  groups,
  initialGrants,
}: {
  roleId: string;
  groups: MatrixGroup[];
  initialGrants: Record<string, MatrixLevel>;
}) {
  const t = useTranslations("AdminAccess");
  const { run, pending } = useRunAction();
  const [grants, setGrants] = useState<Record<string, MatrixLevel>>(initialGrants);
  const [saved, setSaved] = useState<Record<string, MatrixLevel>>(initialGrants);
  const [filter, setFilter] = useState("");
  const hydrated = useHydrated();

  const grantable = useMemo(
    () => new Set(groups.flatMap((g) => g.resources.filter((r) => !r.unlimitedOnly && !r.pending).map((r) => r.key))),
    [groups]
  );
  const stale = Object.keys(grants).filter((key) => !grantable.has(key)).length;
  const count = Object.keys(grants).filter((key) => grantable.has(key)).length;
  const dirty = JSON.stringify(sortEntries(grants)) !== JSON.stringify(sortEntries(saved)) || stale > 0;

  const set = (key: string, level: MatrixLevel | "none") =>
    setGrants((prev) => {
      const next = { ...prev };
      if (level === "none") delete next[key];
      else next[key] = level;
      return next;
    });

  const setGroup = (group: MatrixGroup, level: MatrixLevel | "none") =>
    setGrants((prev) => {
      const next = { ...prev };
      for (const resource of group.resources) {
        if (resource.unlimitedOnly || resource.pending) continue;
        if (level === "none") delete next[resource.key];
        else next[resource.key] = level;
      }
      return next;
    });

  const needle = filter.trim().toLowerCase();
  const visible = groups
    .map((group) => ({
      ...group,
      resources: group.resources.filter(
        (r) => !needle || r.label.toLowerCase().includes(needle) || r.key.toLowerCase().includes(needle)
      ),
    }))
    .filter((group) => group.resources.length > 0);

  const save = () => {
    const payload = Object.entries(grants)
      .filter(([key]) => grantable.has(key))
      .map(([resourceKey, level]) => ({ resourceKey, level }));
    run(() => setRolePermissionsAction(roleId, payload), {
      success: t("matrix.saved"),
      onSuccess: () => {
        const next: Record<string, MatrixLevel> = {};
        for (const { resourceKey, level } of payload) next[resourceKey] = level as MatrixLevel;
        setGrants(next);
        setSaved(next);
      },
    });
  };

  return (
    <Card data-testid="permission-matrix" data-hydrated={hydrated ? "true" : "false"}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>{t("matrix.title")}</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">{t("matrix.help")}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm" data-testid="matrix-summary">
            {t("matrix.summary", { count })}
          </span>
          {dirty ? (
            <Badge variant="outline" data-testid="matrix-unsaved">
              {t("matrix.unsaved")}
            </Badge>
          ) : null}
          <Button type="button" onClick={save} disabled={pending || !dirty} data-testid="matrix-save">
            {pending ? t("matrix.saving") : t("matrix.save")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {stale > 0 ? (
          <p className="text-sm text-amber-600" role="status">
            {t("matrix.stale", { count: stale })}
          </p>
        ) : null}

        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t("matrix.filter")}
          aria-label={t("matrix.filter")}
          className="max-w-sm"
        />

        {visible.map((group) => (
          <section key={group.groupKey} className="rounded-md border" data-testid={`matrix-group-${group.groupKey}`}>
            <header className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
              <h3 className="text-sm font-semibold">{group.label}</h3>
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="ghost" onClick={() => setGroup(group, "view")}>
                  {t("matrix.allView")}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setGroup(group, "manage")}>
                  {t("matrix.allManage")}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setGroup(group, "none")}>
                  {t("matrix.clear")}
                </Button>
              </div>
            </header>
            <ul className="divide-y">
              {group.resources.map((resource) => {
                const current: MatrixLevel | "none" = grants[resource.key] ?? "none";
                return (
                  <li
                    key={resource.key}
                    className="flex flex-wrap items-center justify-between gap-3 px-3 py-2"
                    data-testid={`matrix-row-${resource.key}`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{resource.label}</span>
                        {resource.sensitive ? (
                          <Badge variant="destructive" title={t("matrix.sensitiveHint")}>
                            {t("matrix.sensitive")}
                          </Badge>
                        ) : null}
                        {resource.origin === "unlisted" ? (
                          <Badge variant="outline" title={t("matrix.unlistedHint")}>
                            {t("matrix.unlisted")}
                          </Badge>
                        ) : null}
                        {resource.pending ? (
                          <Badge variant="secondary" title={t("matrix.pendingHint")}>
                            {t("matrix.pending")}
                          </Badge>
                        ) : null}
                        {resource.unlimitedOnly ? (
                          <Badge variant="secondary" title={t("matrix.unlimitedOnlyHint")}>
                            {t("matrix.unlimitedOnly")}
                          </Badge>
                        ) : null}
                      </div>
                      <code className="text-muted-foreground text-xs" dir="ltr">
                        {resource.href}
                      </code>
                    </div>
                    <div
                      role="radiogroup"
                      aria-label={t("matrix.levelFor", { area: resource.label })}
                      className="inline-flex overflow-hidden rounded-md border"
                    >
                      {LEVELS.map((level) => {
                        const active = current === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={resource.unlimitedOnly || resource.pending}
                            data-testid={`perm-${resource.key}-${level}`}
                            onClick={() => set(resource.key, level)}
                            className={cn(
                              "border-s px-3 py-1 text-sm first:border-s-0 disabled:cursor-not-allowed disabled:opacity-40",
                              active
                                ? level === "manage"
                                  ? "bg-primary text-primary-foreground"
                                  : level === "view"
                                    ? "bg-secondary text-secondary-foreground"
                                    : "bg-muted"
                                : "hover:bg-muted/60"
                            )}
                          >
                            {t(`matrix.${level}`)}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}

function sortEntries(grants: Record<string, MatrixLevel>) {
  return Object.entries(grants).sort(([a], [b]) => a.localeCompare(b));
}
