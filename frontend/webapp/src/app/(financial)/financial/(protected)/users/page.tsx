import { formatDateTime } from "@/accounting/lib/format";
import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";
import { requirePagePermission } from "@/accounting/server/access";
import { getPanelUser } from "@/accounting/server/panel-auth";
import { listPanelUsers, MANAGEABLE_ROLES } from "@/accounting/server/panel-users.service";
import { canManageRole, PANEL_ROLE_LABEL } from "@/accounting/server/permissions";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { NewUserForm, UserRowActions } from "./user-forms";

/**
 * Who can sign in to the financial panel. The manager adds and removes accounting
 * managers and accountants; an accounting manager adds and removes accountants.
 */
export default async function PanelUsersPage() {
  await requirePagePermission("users.manage");
  const [viewer, users] = await Promise.all([getPanelUser(), listPanelUsers()]);
  const addable = viewer ? [...MANAGEABLE_ROLES[viewer.role]] : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>
            <PageHeader title="کاربران پنل مالی" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <p className="text-muted-foreground text-sm">
            {viewer?.role === "manager"
              ? "شما می‌توانید «مدیر حسابداری» و «حسابدار» اضافه یا حذف کنید."
              : "شما می‌توانید «حسابدار» اضافه یا حذف کنید."}{" "}
            حذف، دسترسی را می‌گیرد و کاربر فوراً از پنل خارج می‌شود؛ نام او روی اسنادی که ثبت کرده باقی می‌ماند.
          </p>
          {addable.length > 0 && <NewUserForm roles={addable} />}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto pt-4">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b text-xs">
              <tr>
                <th className="p-2 text-start">نام</th>
                <th className="p-2 text-start">نام کاربری</th>
                <th className="p-2 text-start">نقش</th>
                <th className="p-2 text-start">وضعیت</th>
                <th className="p-2 text-start">آخرین ورود</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-b align-top ${u.isActive ? "" : "text-muted-foreground"}`}>
                  <td className="p-2">
                    {u.displayName}
                    {viewer?.id === u.id && <span className="text-muted-foreground ms-1 text-xs">(شما)</span>}
                  </td>
                  <td className="p-2 font-mono text-xs" dir="ltr">
                    {u.username}
                  </td>
                  <td className="p-2 text-xs">{PANEL_ROLE_LABEL[u.role] ?? u.role}</td>
                  <td className="p-2 text-xs">
                    {u.isActive ? (u.mustChangePassword ? "فعال · منتظر تغییر رمز" : "فعال") : "غیرفعال"}
                  </td>
                  <td className="p-2 text-xs">{u.lastLoginAt ? formatDateTime(u.lastLoginAt, PANEL_LOCALE) : "—"}</td>
                  <td className="p-2">
                    {viewer && viewer.id !== u.id && canManageRole(viewer.role, u.role) && (
                      <UserRowActions userId={u.id} isActive={u.isActive} name={u.displayName} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
