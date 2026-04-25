import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function IdentityUserDetailCard({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Info label="Preferred locale" value={user.preferred_locale} />
          <Info label="Preferred currency" value={user.preferred_currency_code} />
          <Info label="Theme" value={user.preferred_theme} />
          <Info label="Notifications" value={String(user.notifications_enabled)} />
          <Info label="Marketing notifications" value={String(user.marketing_notifications_enabled)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Roles</CardTitle></CardHeader>
        <CardContent className="space-y-2">{user.roles?.length ? user.roles.map((item: any) => <div key={item.roleId} className="rounded-md border px-3 py-2 text-sm">{item.name}</div>) : <p className="text-sm text-muted-foreground">No roles.</p>}</CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="font-medium">{value || '-'}</div></div>;
}
