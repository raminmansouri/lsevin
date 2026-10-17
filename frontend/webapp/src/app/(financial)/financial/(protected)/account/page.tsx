import { getPanelUser } from "@/accounting/server/panel-auth";
import { PANEL_ROLE_LABEL } from "@/accounting/server/permissions";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PasswordForm } from "./password-form";

/** Every panel user's own account: who they are signed in as, and their password. */
export default async function MyAccountPage() {
  const user = await getPanelUser();

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <PageHeader title="حساب من" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {user && (
          <p className="text-sm">
            {user.displayName} · <span dir="ltr" className="font-mono">{user.username}</span> · {PANEL_ROLE_LABEL[user.role]}
          </p>
        )}
        <PasswordForm />
      </CardContent>
    </Card>
  );
}
