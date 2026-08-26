"use server";

import type { ShareFriendsPageData } from "./types";
import { getCurrentUserIdOrThrow } from "./auth";
import { createReferralSqlClient, getShareFriendsPageData } from "./queries";

export async function getShareFriendsPageDataAction(): Promise<ShareFriendsPageData> {
  const userId = await getCurrentUserIdOrThrow();
  const sql = createReferralSqlClient();
  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://lsevin.app";

  return await getShareFriendsPageData(sql, userId, appBaseUrl);
}
