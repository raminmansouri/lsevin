import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function IdentityUserDetailCard({ user }: { user: any }) {
  const tAdmin = useTranslations("AdminGenerated");
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>{tAdmin("preferences")}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Info label={tAdmin("preferredLocale")} value={user.preferred_locale} />
          <Info label={tAdmin("preferredCurrency")} value={user.preferred_currency_code} />
          <Info label={tAdmin("theme")} value={user.preferred_theme} />
          <Info label={tAdmin("notifications")} value={String(user.notifications_enabled)} />
          <Info label={tAdmin("marketingNotifications")} value={String(user.marketing_notifications_enabled)} />
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="font-medium">{value || '-'}</div></div>;
}
