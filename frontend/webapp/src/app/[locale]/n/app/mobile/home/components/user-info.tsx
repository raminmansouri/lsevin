"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Link } from "@/i18n/navigation";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { Skeleton } from "../../../design-system/components";
import { useCurrentSession } from "@/hooks/use-current-session";

type Props = {
  profile?: { profileImageUrl?: string | null } | null;
};

/**
 * Greeting row at the top of the home canopy. Renders on the dark pine surface,
 * so every colour here is a tint of white rather than a gray from the page scale.
 */
export default function UserInfoSubBar({ profile }: Props) {
  // required:false — guests browse the home page; a missing session must not
  // force a redirect. The component already renders nothing for guests below.
  const { user, status } = useCurrentSession(false);
  const homeT = useTranslations("Home.userInfo");

  const resolvedImageUrl = useMemo(
    () => resolveHomeMediaUrl(profile?.profileImageUrl),
    [profile?.profileImageUrl]
  );

  if (status === "loading") {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16 bg-white/15" />
          <Skeleton className="h-5 w-36 bg-white/15" />
        </div>
        <Skeleton className="size-11 rounded-full bg-white/15" />
      </div>
    );
  }

  // Guests used to render nothing here, which left a band of empty pine between the
  // app bar and the destination pill. Give them the same row shape with the one
  // action they actually need.
  if (!user) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-white/60">{homeT("guestEyebrow")}</p>
          <h1 className="truncate text-xl font-bold text-white">{homeT("guestTitle")}</h1>
        </div>

        <Link
          href="/sign-in"
          className="shrink-0 rounded-full bg-[#eacb7f] px-4 py-2 text-sm font-bold text-[#083f30] transition hover:bg-[#f0d795]"
        >
          {homeT("signIn")}
        </Link>
      </div>
    );
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-white/60">{homeT("goodMorning")}</p>
        <h1 className="truncate text-xl font-bold text-white">{fullName}</h1>
      </div>

      <Link
        href="/n/app/mobile/profile"
        className="size-11 shrink-0 overflow-hidden rounded-full ring-2 ring-[#eacb7f]/60 ring-offset-2 ring-offset-[#083f30]"
      >
        <ImageWithFallback
          width={100}
          height={100}
          src={resolvedImageUrl}
          alt={homeT("profileAlt")}
          className="h-full w-full object-cover"
        />
      </Link>
    </div>
  );
}
