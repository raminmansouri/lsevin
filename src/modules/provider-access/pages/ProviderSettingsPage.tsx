import { Trash2 } from "lucide-react";
import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import type { ModulePageProps } from "@core/modules/types";
import { assignExistingProviderAction, removeProviderMemberAction } from "../actions";
import { listProviderMembers } from "../repository";

export async function ProviderSettingsPage({ params }: ModulePageProps) {
  const providerId = params.providerId;
  const members = await listProviderMembers(providerId);
  return <div><PageHeader title="Settings" description="Assign existing LSevin users to this provider workspace and manage roles." /><div className="grid gap-5 lg:grid-cols-[1fr_420px]"><Card><CardHeader><CardTitle>Members</CardTitle></CardHeader><CardContent className="space-y-3">{members.map((member) => <div key={member.id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto_auto] md:items-center"><div><div className="font-bold">{member.fullName || member.email}</div><div className="text-xs text-muted-foreground">{member.email}</div></div><Badge>{member.role}</Badge><form action={removeProviderMemberAction}><input type="hidden" name="providerId" value={providerId} /><input type="hidden" name="memberId" value={member.id} /><Button type="submit" variant="ghost" className="text-red-600" disabled={member.role === "owner"}><Trash2 size={15} /></Button></form></div>)}</CardContent></Card><form action={assignExistingProviderAction}><input type="hidden" name="providerId" value={providerId} /><Card><CardHeader><CardTitle>Assign user</CardTitle></CardHeader><CardContent className="space-y-4"><Field label="User ID" help="Use direct identity.asp_net_users.id when available."><Input name="userId" placeholder="uuid" /></Field><Field label="Or exact email" help="The action resolves this email to an existing LSevin user."><Input name="email" type="email" placeholder="user@example.com" /></Field><Field label="Role"><Select name="role" defaultValue="manager"><option value="owner">Owner</option><option value="admin">Admin</option><option value="manager">Manager</option><option value="editor">Editor</option><option value="viewer">Viewer</option><option value="staff">Staff</option></Select></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isDefault" /> Default provider</label><Button type="submit">Assign user</Button></CardContent></Card></form></div></div>;
}
