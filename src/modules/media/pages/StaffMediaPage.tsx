import { requireCurrentUser } from "@core/auth/session";
import { requireStaffProfilePermission } from "@core/auth/permissions";
import { listStaffWorkspaceMedia } from "@core/media/repository";
import { PageHeader } from "@core/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import type { ModulePageProps } from "@core/modules/types";

function MediaCard({item}:{item:Awaited<ReturnType<typeof listStaffWorkspaceMedia>>[number]}) {
  return <Card className="overflow-hidden">
    <div className="aspect-video bg-muted">{item.mediaType==='image'?<img src={item.fileUrl} alt={item.originalName} className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center text-sm text-muted-foreground">{item.mediaType}</div>}</div>
    <CardContent className="space-y-1"><div className="truncate font-bold">{item.originalName}</div><div className="text-xs text-muted-foreground">{item.sharedByProvider?'Shared by provider · read only':'Your upload'}</div></CardContent>
  </Card>;
}

export async function StaffMediaPage({params}:ModulePageProps) {
  const user=await requireCurrentUser();
  const staffId=params.staffId;
  const claim=await requireStaffProfilePermission(user.id,staffId,"manageOwnProfile");
  if(!claim.serviceProviderId) return <PageHeader title="Media unavailable" description="An active provider scope is required."/>;
  const items=await listStaffWorkspaceMedia({userId:user.id,providerId:claim.serviceProviderId,staffId,limit:80});
  const own=items.filter((item)=>!item.sharedByProvider);
  const shared=items.filter((item)=>item.sharedByProvider);
  return <div className="space-y-6">
    <PageHeader title="My media workspace" description="Your private uploads remain yours. Provider files appear here only when that provider explicitly shares them with this staff profile."/>
    <Card><CardHeader><CardTitle>Shared by provider</CardTitle></CardHeader><CardContent>{shared.length?<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{shared.map((item)=><MediaCard key={item.id} item={item}/>)}</div>:<p className="text-sm text-muted-foreground">No provider media has been shared with you.</p>}</CardContent></Card>
    <Card><CardHeader><CardTitle>My uploads</CardTitle></CardHeader><CardContent>{own.length?<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{own.map((item)=><MediaCard key={item.id} item={item}/>)}</div>:<p className="text-sm text-muted-foreground">Your staff-owned uploads will appear here.</p>}</CardContent></Card>
  </div>;
}
