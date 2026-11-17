"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

import { manageAdminAction, releaseStaffAction, setStaffStatusAction } from "../server/actions";
import { useHydrated } from "./use-hydrated";
import { ConfirmButton, useRunAction } from "./use-run-action";

export type StaffItem = {
  userId: string;
  displayName: string;
  userName: string | null;
  email: string | null;
  status: "active" | "disabled";
  roles: { id: string; name: string }[];
};

export type UnmanagedAdmin = { userId: string; displayName: string; userName: string | null; email: string | null };

export function StaffPanel({ staff, unmanaged }: { staff: StaffItem[]; unmanaged: UnmanagedAdmin[] }) {
  const t = useTranslations("AdminAccess");
  const { run, pending } = useRunAction();
  const hydrated = useHydrated();

  return (
    <div className="space-y-6" data-hydrated={hydrated ? "true" : "false"}>
      <Card data-testid="staff-panel">
        <CardHeader>
          <CardTitle>{t("staff.title")}</CardTitle>
          <p className="text-muted-foreground text-sm">{t("staff.help")}</p>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="text-muted-foreground text-sm" data-testid="staff-empty">
              {t("staff.empty")}
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {staff.map((person) => (
                <li
                  key={person.userId}
                  className="flex flex-wrap items-center justify-between gap-3 p-3"
                  data-testid={`staff-row-${person.userId}`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{person.displayName}</span>
                      <Badge variant={person.status === "active" ? "secondary" : "destructive"}>
                        {t(`staff.${person.status}`)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {person.roles.length === 0 ? (
                        <span className="text-muted-foreground text-xs">{t("staff.noRoles")}</span>
                      ) : (
                        person.roles.map((role) => (
                          <Link key={role.id} href={`/admin/access-control/roles/${role.id}`}>
                            <Badge variant="outline">{role.name}</Badge>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () => setStaffStatusAction(person.userId, person.status === "active" ? "disabled" : "active"),
                          { success: t("staff.updated") }
                        )
                      }
                    >
                      {person.status === "active" ? t("staff.disable") : t("staff.enable")}
                    </Button>
                    <ConfirmButton
                      testId={`release-${person.userId}`}
                      label={t("staff.makeFull")}
                      title={t("staff.makeFull")}
                      description={t("staff.confirmFull", { name: person.displayName })}
                      confirmLabel={t("staff.makeFull")}
                      cancelLabel={t("role.cancel")}
                      disabled={pending}
                      onConfirm={() =>
                        run(() => releaseStaffAction(person.userId, "unlimited"), { success: t("staff.updated") })
                      }
                    />
                    <ConfirmButton
                      variant="destructive"
                      label={t("staff.revoke")}
                      title={t("staff.revoke")}
                      description={t("staff.confirmRevoke", { name: person.displayName })}
                      confirmLabel={t("staff.revoke")}
                      cancelLabel={t("role.cancel")}
                      disabled={pending}
                      onConfirm={() =>
                        run(() => releaseStaffAction(person.userId, "revoke"), { success: t("staff.updated") })
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card data-testid="unmanaged-panel">
        <CardHeader>
          <CardTitle>{t("staff.fullTitle")}</CardTitle>
          <p className="text-muted-foreground text-sm">{t("staff.fullHelp")}</p>
        </CardHeader>
        <CardContent>
          {unmanaged.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("staff.fullEmpty")}</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {unmanaged.map((person) => (
                <li
                  key={person.userId}
                  className="flex flex-wrap items-center justify-between gap-3 p-3"
                  data-testid={`unmanaged-row-${person.userId}`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{person.displayName}</p>
                    <p className="text-muted-foreground truncate text-xs" dir="ltr">
                      {[person.userName, person.email].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <ConfirmButton
                    testId={`limit-${person.userId}`}
                    label={t("staff.limit")}
                    title={t("staff.limit")}
                    description={t("staff.confirmLimit", { name: person.displayName })}
                    confirmLabel={t("staff.limit")}
                    cancelLabel={t("role.cancel")}
                    disabled={pending}
                    onConfirm={() =>
                      run(() => manageAdminAction(person.userId), {
                        success: t("staff.limited", { name: person.displayName }),
                      })
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
