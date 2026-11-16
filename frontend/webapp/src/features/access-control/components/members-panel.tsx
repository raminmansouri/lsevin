"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { addMemberAction, removeMemberAction, searchUsersAction } from "../server/actions";
import type { UserHit } from "../server/repository";
import { useHydrated } from "./use-hydrated";
import { useRunAction } from "./use-run-action";

export type MemberRow = {
  userId: string;
  displayName: string;
  userName: string | null;
  email: string | null;
  phone: string | null;
  staffStatus: "active" | "disabled" | null;
};

export function MembersPanel({ roleId, members }: { roleId: string; members: MemberRow[] }) {
  const t = useTranslations("AdminAccess");
  const { run, pending } = useRunAction();
  const hydrated = useHydrated();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<UserHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const latest = useRef(0);
  const memberIds = new Set(members.map((m) => m.userId));

  // Debounced search; a slow earlier response never overwrites a newer one.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits(null);
      return;
    }
    const ticket = ++latest.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      const result = await searchUsersAction(q);
      if (ticket !== latest.current) return;
      setSearching(false);
      setHits(result.ok === true ? result.data : []);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Card data-testid="members-panel" data-hydrated={hydrated ? "true" : "false"}>
      <CardHeader>
        <CardTitle>{t("members.title")}</CardTitle>
        <p className="text-muted-foreground text-sm">{t("members.help")}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="member-search">{t("members.searchLabel")}</Label>
          <Input
            id="member-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("members.searchPlaceholder")}
            autoComplete="off"
          />
          {searching ? <p className="text-muted-foreground text-sm">{t("members.searching")}</p> : null}
          {hits && !searching ? (
            hits.length === 0 ? (
              <p className="text-muted-foreground text-sm" data-testid="member-no-results">
                {t("members.noResults")}
              </p>
            ) : (
              <ul className="divide-y rounded-md border" data-testid="member-results">
                {hits.map((hit) => {
                  const already = memberIds.has(hit.userId);
                  return (
                    <li key={hit.userId} className="flex flex-wrap items-center justify-between gap-2 p-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{hit.displayName}</p>
                        <p className="text-muted-foreground truncate text-xs" dir="ltr">
                          {[hit.userName, hit.email, hit.phone].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {hit.isSuperAdmin ? (
                          <Badge variant="secondary">{t("members.superAdmin")}</Badge>
                        ) : hit.isAdmin ? (
                          <Badge variant="outline">{t("members.isAdmin")}</Badge>
                        ) : (
                          <Badge variant="outline">{t("members.willBecomeAdmin")}</Badge>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          disabled={pending || already || hit.isSuperAdmin}
                          data-testid={`member-add-${hit.userId}`}
                          onClick={() =>
                            run(() => addMemberAction(roleId, hit.userId), {
                              success: t("members.added"),
                              onSuccess: () => {
                                setQuery("");
                                setHits(null);
                              },
                            })
                          }
                        >
                          {already ? t("members.alreadyMember") : pending ? t("members.adding") : t("members.add")}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          ) : null}
        </div>

        {members.length === 0 ? (
          <p className="text-muted-foreground text-sm" data-testid="members-empty">
            {t("members.empty")}
          </p>
        ) : (
          <ul className="divide-y rounded-md border" data-testid="members-list">
            {members.map((member) => (
              <li key={member.userId} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{member.displayName}</p>
                  <p className="text-muted-foreground truncate text-xs" dir="ltr">
                    {[member.userName, member.email, member.phone].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {member.staffStatus === "disabled" ? <Badge variant="destructive">{t("members.disabled")}</Badge> : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    data-testid={`member-remove-${member.userId}`}
                    onClick={() =>
                      run(() => removeMemberAction(roleId, member.userId), { success: t("members.removed") })
                    }
                  >
                    {t("members.remove")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
