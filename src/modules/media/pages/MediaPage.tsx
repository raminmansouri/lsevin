import { PageHeader } from "@core/ui/PageHeader";
import type { ModulePageProps } from "@core/modules/types";
import { MediaManager } from "../components/MediaManager";
import { listGallery } from "../repository";

export async function MediaPage({ params }: ModulePageProps) {
  const providerId = params.providerId;
  const items = await listGallery(providerId);
  return <div><PageHeader title="Media" description="Manage gallery photos and videos used in LSevin provider pages." /><MediaManager providerId={providerId} items={items} /></div>;
}
