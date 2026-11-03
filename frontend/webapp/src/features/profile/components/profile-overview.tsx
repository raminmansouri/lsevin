"use client";

import { useMemo } from "react";
import { signOut } from "next-auth/react";
import { getImageProps } from "next/image";

import { ProfileViewCache } from "@/components/pwa/profile-view-cache";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { useNavigate } from "@/hooks/use-navigate";
import { clearOfflineProfile } from "@/lib/pwa/offline-profile";

import {
  ProfileOverviewView,
  type ProfileOverviewData,
} from "./profile-overview-view";
import { DesktopProfileView } from "@/features/web-desktop/profile/DesktopProfileView";

export function ProfileOverview({ data }: { data: ProfileOverviewData }) {
  const navigate = useNavigate();
  const resolved = useMemo(() => {
    const image = resolveHomeMediaUrl(data.image);
    return {
      ...data,
      image: image
        ? getImageProps({
            src: image,
            width: 100,
            height: 100,
            alt: `${data.firstName} ${data.lastName}`,
          }).props.src
        : "",
    };
  }, [data]);
  const handleSignOut = () => {
    clearOfflineProfile();
    void signOut();
  };
  return (
    <>
      <div className="xl:hidden">
        <ProfileOverviewView data={resolved} navigate={navigate} signOut={handleSignOut} />
      </div>
      <DesktopProfileView data={resolved} image={resolveHomeMediaUrl(data.image) || ""} signOut={handleSignOut} />
      <ProfileViewCache data={resolved} />
    </>
  );
}
