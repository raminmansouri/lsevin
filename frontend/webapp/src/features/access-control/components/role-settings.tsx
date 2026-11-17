"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";

import { deleteRoleAction, updateRoleAction } from "../server/actions";
import { useHydrated } from "./use-hydrated";
import { ConfirmButton, useRunAction } from "./use-run-action";

export function RoleSettings({
  role,
}: {
  role: { id: string; name: string; description: string | null };
}) {
  const t = useTranslations("AdminAccess");
  const router = useRouter();
  const { run, pending } = useRunAction();
  const hydrated = useHydrated();
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description ?? "");
  const dirty = name !== role.name || description !== (role.description ?? "");

  return (
    <Card data-testid="role-settings" data-hydrated={hydrated ? "true" : "false"}>
      <CardHeader>
        <CardTitle>{t("role.settings")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => updateRoleAction(role.id, { name, description }), { success: t("role.saved") });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="role-name">{t("roles.nameLabel")}</Label>
            <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={64} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-description">{t("roles.descriptionLabel")}</Label>
            <Input
              id="role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>
          <Button type="submit" disabled={pending || !dirty || name.trim().length < 2}>
            {pending ? t("role.saving") : t("role.save")}
          </Button>
        </form>

        <ConfirmButton
          testId="delete-role"
          variant="destructive"
          label={t("role.delete")}
          title={t("role.deleteTitle")}
          description={t("role.deleteBody")}
          confirmLabel={t("role.deleteConfirm")}
          cancelLabel={t("role.cancel")}
          disabled={pending}
          onConfirm={() =>
            run(() => deleteRoleAction(role.id), {
              success: t("role.deleted"),
              refresh: false,
              onSuccess: () => router.push("/admin/access-control"),
            })
          }
        />
      </CardContent>
    </Card>
  );
}
