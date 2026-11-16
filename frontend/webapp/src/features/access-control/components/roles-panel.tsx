"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";

import { createRoleAction } from "../server/actions";
import { useHydrated } from "./use-hydrated";
import { useRunAction } from "./use-run-action";

export type RoleRow = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  permissionCount: number;
};

export function RolesPanel({ roles }: { roles: RoleRow[] }) {
  const t = useTranslations("AdminAccess");
  const router = useRouter();
  const { run, pending } = useRunAction();
  const hydrated = useHydrated();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    run(() => createRoleAction({ name, description }), {
      success: t("roles.created"),
      refresh: false,
      onSuccess: (result) => {
        setName("");
        setDescription("");
        const id = result.data?.id;
        if (id) router.push(`/admin/access-control/roles/${id}`);
        else router.refresh();
      },
    });
  };

  return (
    <Card data-testid="roles-panel" data-hydrated={hydrated ? "true" : "false"}>
      <CardHeader>
        <CardTitle>{t("roles.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="new-role-name">{t("roles.nameLabel")}</Label>
            <Input
              id="new-role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("roles.namePlaceholder")}
              maxLength={64}
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-role-description">{t("roles.descriptionLabel")}</Label>
            <Input
              id="new-role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              disabled={pending}
            />
          </div>
          <Button type="submit" disabled={pending || name.trim().length < 2}>
            {pending ? t("roles.creating") : t("roles.createButton")}
          </Button>
        </form>

        {roles.length === 0 ? (
          <p className="text-muted-foreground text-sm" data-testid="roles-empty">
            {t("roles.empty")}
          </p>
        ) : (
          <ul className="divide-y rounded-md border" data-testid="roles-list">
            {roles.map((role) => (
              <li key={role.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{role.name}</p>
                  {role.description ? (
                    <p className="text-muted-foreground truncate text-sm">{role.description}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{t("roles.members", { count: role.memberCount })}</Badge>
                  <Badge variant="outline">{t("roles.permissions", { count: role.permissionCount })}</Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/access-control/roles/${role.id}`} aria-label={`${t("roles.open")}: ${role.name}`}>
                      {t("roles.open")}
                    </Link>
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
