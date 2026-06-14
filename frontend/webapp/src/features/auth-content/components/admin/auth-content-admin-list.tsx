import { useTranslations } from "next-intl";
import { Plus, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

import { type AuthContentAdminListItem } from "@/features/auth-content/types/auth-content.types";

type Props = {
  items: AuthContentAdminListItem[];
};

export function AuthContentAdminList({ items }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{tAdmin("authContent")}</h1>
          <p className="text-muted-foreground text-sm">
            Configure sign-in, sign-up, forgot-password, OTP, and onboarding content without code changes.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/auth-content/new">
            <Plus className="mr-2 size-4" />
            New content
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tAdmin("configuredItems")}</CardTitle>
          <CardDescription>
            Use item keys: sign-in, sign-up, forgot-password, otp, or step keys like step-1.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">{tAdmin("type")}</th>
                  <th className="py-3 pr-4 font-medium">{tAdmin("key")}</th>
                  <th className="py-3 pr-4 font-medium">{tAdmin("title")}</th>
                  <th className="py-3 pr-4 font-medium">{tAdmin("order")}</th>
                  <th className="py-3 pr-4 font-medium">{tAdmin("status")}</th>
                  <th className="py-3 pr-4 font-medium">{tAdmin("image")}</th>
                  <th className="py-3 text-right font-medium">{tAdmin("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{item.typeCode}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{item.itemKey}</td>
                    <td className="py-3 pr-4">
                      <div className="max-w-xs">
                        <div className="font-medium">{item.title}</div>
                        {item.subtitle ? (
                          <div className="text-muted-foreground line-clamp-1 text-xs">
                            {item.subtitle}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 pr-4">{item.displayOrder}</td>
                    <td className="py-3 pr-4">
                      <span className={item.isActive ? "text-emerald-600" : "text-muted-foreground"}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {item.mediaUrl ? (
                        <span className="text-muted-foreground line-clamp-1 max-w-[180px] text-xs">
                          {item.mediaUrl}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/auth-content/${item.id}`}>
                          <Pencil className="mr-2 size-3.5" />
                          Edit
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {!items.length ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-muted-foreground">
                      No auth content has been configured yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
