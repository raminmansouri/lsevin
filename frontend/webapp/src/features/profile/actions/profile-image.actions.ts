"use server";

import sql from "@/config/database/db";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
// import { sql } from "@/lib/db";

type ProfileImageActionResult = {
  ok: boolean;
  message: string;
  imageUrl: string | null;
  mediaId: string | null;
};

async function getCurrentUserId(): Promise<string> {
  // replace with your real auth/session logic
 
   const session=await getSession();
   const userId=session?.user?.id;
 
  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

export async function setProfileImageAction(input: {
  mediaId: string;
  imageUrl: string;
}): Promise<ProfileImageActionResult> {
  try {
    const userId = await getCurrentUserId();

    const rows = await sql<{
      is_profile_confirmed: boolean;
    }[]>`
      SELECT is_profile_confirmed
      FROM identity.asp_net_users
      WHERE id = ${userId}
      LIMIT 1
    `;

    const user = rows[0];

    if (!user) {
      return {
        ok: false,
        message: "User not found.",
        imageUrl: null,
        mediaId: null,
      };
    }

    if (user.is_profile_confirmed) {
      return {
        ok: false,
        message: "Your profile is already confirmed and cannot be changed.",
        imageUrl: null,
        mediaId: null,
      };
    }

    await sql`
      UPDATE identity.asp_net_users
      SET
        profile_image_url = ${input.imageUrl},
        profile_image_updated_at = NOW()
      WHERE id = ${userId}
    `;

    revalidatePath("/profile");
    revalidatePath("/profile/edit");

    return {
      ok: true,
      message: "Profile photo updated.",
      imageUrl: input.imageUrl,
      mediaId: input.mediaId,
    };
  } catch {
    return {
      ok: false,
      message: "Something went wrong while saving the profile photo.",
      imageUrl: null,
      mediaId: null,
    };
  }
}

export async function removeProfileImageAction(): Promise<ProfileImageActionResult> {
  try {
    const userId = await getCurrentUserId();

    const rows = await sql<{
      is_profile_confirmed: boolean;
    }[]>`
      SELECT is_profile_confirmed
      FROM identity.asp_net_users
      WHERE id = ${userId}
      LIMIT 1
    `;

    const user = rows[0];

    if (!user) {
      return {
        ok: false,
        message: "User not found.",
        imageUrl: null,
        mediaId: null,
      };
    }

    if (user.is_profile_confirmed) {
      return {
        ok: false,
        message: "Your profile is already confirmed and cannot be changed.",
        imageUrl: null,
        mediaId: null,
      };
    }

    await sql`
      UPDATE identity.asp_net_users
      SET
        profile_image_media_id = NULL,
        profile_image_url = NULL,
        profile_image_updated_at = NOW()
      WHERE id = ${userId}
    `;

    revalidatePath("/profile");
    revalidatePath("/profile/edit");

    return {
      ok: true,
      message: "Profile photo removed.",
      imageUrl: null,
      mediaId: null,
    };
  } catch {
    return {
      ok: false,
      message: "Something went wrong while removing the profile photo.",
      imageUrl: null,
      mediaId: null,
    };
  }
}