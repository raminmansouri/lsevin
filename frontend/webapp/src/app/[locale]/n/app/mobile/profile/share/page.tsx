import { getShareFriendsPageDataAction } from "./actions";
import { ShareFriendsPageClient } from "./ShareFriendsPageClient";

export const dynamic = "force-dynamic";

export default async function ShareFriendsPage() {
  const data = await getShareFriendsPageDataAction();

  return <ShareFriendsPageClient initialData={data} />;
}
