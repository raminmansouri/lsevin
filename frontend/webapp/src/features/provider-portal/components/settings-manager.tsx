import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { tCommon, tLabel } from "../lib/i18n";

import type { ProviderWorkspace } from "../types";

export function SettingsManager({
  workspace,
}: {
  workspace: ProviderWorkspace;
}) {
  const t = useTranslations("ProviderPortal");

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {tCommon(t, "roleAndPermissions", "Role and permissions")}
          </CardTitle>
          <CardDescription>
            {tCommon(
              t,
              "rolePermissionsDescription",
              "Member invitation UI can be added once you decide whether providers invite by email or user id.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">
                {workspace.provider.displayName}
              </span>
              <Badge>{workspace.role}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {tCommon(
                t,
                "currentUserRoleDescription",
                "Current signed-in user's role for this provider.",
              )}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(workspace.permissions).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm"
              >
                <span>{key}</span>
                <Badge variant={value ? "default" : "secondary"}>
                  {value
                    ? tCommon(t, "allowed", "Allowed")
                    : tCommon(t, "blocked", "Blocked")}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>
            {tCommon(t, "adminControlledFields", "Admin-controlled fields")}
          </CardTitle>
          <CardDescription>
            {tCommon(
              t,
              "adminControlledFieldsDescription",
              "These fields intentionally do not appear in provider forms.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {[
            "Provider type",
            "Country/city",
            "Sponsored status",
            "Featured score",
            "Accredited/verified flags",
            "Commission policy",
            "Provider deletion",
          ].map((item) => (
            <Badge key={item} variant="outline">
              {tLabel(t, item)}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
