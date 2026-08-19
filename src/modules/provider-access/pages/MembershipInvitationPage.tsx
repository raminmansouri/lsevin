import { requireCurrentUser } from "@core/auth/session";
import { getPortalLocale } from "@core/i18n/server";
import { Badge } from "@core/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { EmptyState } from "@core/ui/EmptyState";
import { PageHeader } from "@core/ui/PageHeader";
import type { ModulePageProps } from "@core/modules/types";
import { ActionSubmitButton } from "../components/ActionSubmitButton";
import { acceptProviderInvitationAction, declineProviderInvitationAction } from "../actions";
import { providerAccessCopy } from "../i18n/copy";
import { getProviderMemberInvitation, invitationTokenMatches } from "../repository";

export async function MembershipInvitationPage({ params, searchParams }: ModulePageProps) {
  const locale = await getPortalLocale();
  const copy = providerAccessCopy(locale.header);
  const invitationId = params.invitationId;
  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  const returnTo = `/membership-invitations/${encodeURIComponent(invitationId)}?token=${encodeURIComponent(token)}`;
  const user = await requireCurrentUser(returnTo);
  const invitation = await getProviderMemberInvitation(invitationId);
  const allowed = invitation && invitation.status === "pending" && token && invitationTokenMatches(token, invitation.tokenHash)
    && (!invitation.intendedUserId || invitation.intendedUserId === user.id)
    && invitation.intendedEmail.trim().toLowerCase() === user.email.trim().toLowerCase();

  if (!allowed || !invitation) return <div dir={locale.direction}><EmptyState title={copy.invitationTitle} description={copy.invalidInvitation} /></div>;

  return <div className="space-y-5" dir={locale.direction}>
    <PageHeader title={copy.invitationTitle} description={copy.invitationDescription} />
    <Card className="max-w-2xl"><CardHeader><CardTitle>{invitation.providerName}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-2"><Badge>{copy[(invitation.role === "staff" ? "staffRole" : invitation.role) as "staffRole" | "owner" | "admin" | "manager" | "editor" | "viewer"]}</Badge><Badge variant="warning">{copy.pending}</Badge></div><div className="text-sm text-muted-foreground">{copy.invitedAs}: {copy[(invitation.role === "staff" ? "staffRole" : invitation.role) as "staffRole" | "owner" | "admin" | "manager" | "editor" | "viewer"]}</div><div className="text-sm text-muted-foreground">{copy.expires}: {new Intl.DateTimeFormat(locale.header, { dateStyle: "medium", timeStyle: "short" }).format(new Date(invitation.expiresAt))}</div><div className="flex gap-2"><form action={acceptProviderInvitationAction}><input type="hidden" name="invitationId" value={invitation.id} /><input type="hidden" name="token" value={token} /><ActionSubmitButton label={copy.acceptInvitation} pendingLabel={copy.processing} /></form><form action={declineProviderInvitationAction}><input type="hidden" name="invitationId" value={invitation.id} /><input type="hidden" name="token" value={token} /><ActionSubmitButton label={copy.declineInvitation} pendingLabel={copy.processing} variant="secondary" /></form></div></CardContent></Card>
  </div>;
}
