import { createRoot } from "react-dom/client";

import { ProfileOverviewView } from "../../features/profile/components/profile-overview-view";
import {
  parseProfileProjection,
  profileProjectionKey,
} from "./profile-projection";

async function start() {
  const root = document.querySelector<HTMLElement>("[data-pwa-profile-root]");
  if (!root) return;
  const storagePath = profileProjectionKey(location.pathname);
  const value = await LsevinViewStore.read(storagePath).catch(() => null);
  const projection = parseProfileProjection(value);
  if (
    !projection ||
    !(await LsevinViewStore.validOwner(storagePath, projection.owner).catch(
      () => false
    ))
  ) {
    document.body.replaceChildren();
    location.replace(`/${document.documentElement.lang}/n/app/mobile/home`);
    return;
  }
  createRoot(root).render(
    <ProfileOverviewView
      data={projection.data}
      signOut={() => {
        // The document capture handler clears storage and redirects before this callback.
        void LsevinViewStore.clear();
      }}
    />
  );
}
void start();
