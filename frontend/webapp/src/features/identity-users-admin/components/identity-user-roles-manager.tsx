"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { setUserRolesAction } from "../actions/set-user-roles";

type Role = { id: string; name: string };
type AssignedRole = { roleId: string; name: string };

// Human labels for the known roles; unknown roles fall back to their raw name.
const ROLE_LABELS: Record<string, string> = {
  superadmin: "سوپرادمین",
  admin: "ادمین",
  user: "کاربر",
};

const roleLabel = (name: string) => ROLE_LABELS[name] ?? name;

export function IdentityUserRolesManager({
  userId,
  allRoles,
  assignedRoles,
  canManage,
}: {
  userId: string;
  allRoles: Role[];
  assignedRoles: AssignedRole[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(assignedRoles.map((r) => r.roleId))
  );

  // Read-only view for non-super-admins.
  if (!canManage) {
    return (
      <Card>
        <CardHeader><CardTitle>نقش‌ها (سطح دسترسی)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {assignedRoles.length ? (
            <div className="flex flex-wrap gap-2">
              {assignedRoles.map((r) => (
                <Badge key={r.roleId} variant="secondary">{roleLabel(r.name)}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">بدون نقش</p>
          )}
          <p className="text-xs text-muted-foreground">فقط سوپرادمین می‌تواند نقش‌ها را تغییر دهد.</p>
        </CardContent>
      </Card>
    );
  }

  const toggle = (roleId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(roleId);
      else next.delete(roleId);
      return next;
    });
  };

  const save = () =>
    startTransition(async () => {
      try {
        await setUserRolesAction({ userId, roleIds: [...selected] });
        toast.success("نقش‌های کاربر ذخیره شد.");
        router.refresh();
      } catch (error: any) {
        toast.error(error?.message ?? "خطا در ذخیرهٔ نقش‌ها");
      }
    });

  return (
    <Card>
      <CardHeader><CardTitle>نقش‌ها (سطح دسترسی)</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {allRoles.map((role) => (
            <div key={role.id} className="flex items-center gap-3 rounded-md border p-3">
              <Checkbox
                id={`role-${role.id}`}
                checked={selected.has(role.id)}
                onCheckedChange={(checked) => toggle(role.id, checked === true)}
                disabled={isPending}
              />
              <Label htmlFor={`role-${role.id}`} className="cursor-pointer">
                {roleLabel(role.name)}
                <span className="ms-2 text-xs text-muted-foreground">{role.name}</span>
              </Label>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          تغییر نقش‌ها پس از ورود مجددِ کاربر اعمال می‌شود.
        </p>
        <Button type="button" onClick={save} disabled={isPending}>
          {isPending ? "در حال ذخیره..." : "ذخیرهٔ نقش‌ها"}
        </Button>
      </CardContent>
    </Card>
  );
}
