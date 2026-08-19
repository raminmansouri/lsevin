import { requireCurrentUser } from "@core/auth/session";
import { PageHeader } from "@core/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { LinkButton } from "@core/ui/Button";
import { listStaffFinanceProfilesForUser } from "../repository";

export async function StaffFinanceHubPage() {
  const user = await requireCurrentUser();
  const profiles = await listStaffFinanceProfilesForUser(user.id);
  return <div className="space-y-5"><PageHeader title="My earnings" description="Your approved staff profiles and provider-defined booking compensation."/><div className="grid gap-4 md:grid-cols-2">{profiles.map(profile=><Card key={`${profile.providerId}:${profile.staffId}`}><CardHeader><CardTitle>{profile.staffName}</CardTitle></CardHeader><CardContent><div className="mb-3 text-sm text-muted-foreground">{profile.providerName}</div><LinkButton href={`/staff/${profile.staffId}/finance`}>Open earnings</LinkButton></CardContent></Card>)}{!profiles.length?<Card><CardContent className="p-6 text-sm text-muted-foreground">No approved active staff profile is linked to this LSevin account.</CardContent></Card>:null}</div></div>;
}
