"use server";

import { revalidatePath } from "next/cache";
import {
  profileFormSchema,
  type EditProfileInitialData,
  type ProfileFormValues,
} from "../schemas/profile.schema";
import sql from "@/config/database/db";
import { getSession } from "@/lib/auth/session";

type ActionResult = {
  ok: boolean;
  message: string;
};

type DbUserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  normalized_email: string;
  phone_number_country_code: string;
  phone_number: string;
  user_name: string;
  normalized_user_name: string;
  birth_date: string | Date | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  profile_image_url: string | null;
  is_profile_confirmed: boolean;
};

async function getCurrentUserId(): Promise<string> {
  // replace with your real auth/session logic
//   const userId = "REPLACE_WITH_AUTH_USER_ID";

  const session=await getSession();
  const userId=session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

function normalizeEmail(email: string) {
  return email.trim().toUpperCase();
}

function isPgError(error: unknown): error is {
  code?: string;
  constraint_name?: string;
  constraint?: string;
} {
  return typeof error === "object" && error !== null;
}

function getConstraintName(error: unknown) {
  if (!isPgError(error)) return undefined;
  return error.constraint_name ?? error.constraint;
}

export async function getProfileForEdit(): Promise<EditProfileInitialData> {
  const userId = await getCurrentUserId();

  const rows = await sql<DbUserRow[]>`
  SELECT
    id,
    first_name,
    last_name,
    email,
    normalized_email,
    phone_number_country_code,
    phone_number,
    user_name,
    normalized_user_name,
    birth_date,
    gender,
    address,
    city,
    country,
    profile_image_url,
    is_profile_confirmed
  FROM identity.asp_net_users
  WHERE id = ${userId}
  LIMIT 1
`;

  const user = rows[0];

  if (!user) {
    throw new Error("User not found");
  }

  return {
  firstName: user.first_name ?? "",
  lastName: user.last_name ?? "",
  email: user.email ?? "",
  phoneCountryCode: user.phone_number_country_code
    ? `+${user.phone_number_country_code}`
    : "",
  phoneNumber: user.phone_number ?? "",
  dateOfBirth: user.birth_date
    ? new Date(user.birth_date).toISOString().slice(0, 10)
    : "",
  gender:
    user.gender === "female" ||
    user.gender === "male" ||
    user.gender === "other" ||
    user.gender === "prefer-not-to-say"
      ? user.gender
      : "",
  address: user.address ?? "",
  city: user.city ?? "",
  country: user.country ?? "",
  profileImageUrl: user.profile_image_url ?? null,
  isProfileConfirmed: user.is_profile_confirmed,
};
}

export async function updateProfileAction(
  input: ProfileFormValues
): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  const parsed = profileFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid profile data",
    };
  }

  const data = parsed.data;
  const normalizedEmail = normalizeEmail(data.email);

  try {
    const result = await sql.begin(async (tx) => {
      const lockRows = await tx<{ is_profile_confirmed: boolean }[]>`
        SELECT is_profile_confirmed
        FROM identity.asp_net_users
        WHERE id = ${userId}
        FOR UPDATE
      `;

      const current = lockRows[0];

      if (!current) {
        return { ok: false, message: "User not found." };
      }

      if (current.is_profile_confirmed) {
        return {
          ok: false,
          message: "Your profile is already confirmed and cannot be changed.",
        };
      }

      await tx`
        UPDATE identity.asp_net_users
        SET
          first_name = ${data.firstName},
          last_name = ${data.lastName},
          email = ${data.email.toLowerCase()},
          normalized_email = ${normalizedEmail},
          phone_number_country_code = ${data.phoneCountryCode},
          phone_number = ${data.phoneNumber},
          birth_date = ${data.dateOfBirth || null},
          gender = ${data.gender || null},
          address = ${data.address},
          city = ${data.city},
          country = ${data.country}
        WHERE id = ${userId}
      `;

      return {
        ok: true,
        message: "Profile updated successfully.",
      };
    });

    revalidatePath("/profile");
    revalidatePath("/profile/edit");

    return result;
  } catch (error) {
    if (isPgError(error) && error.code === "23505") {
      const constraint = getConstraintName(error);

      if (constraint === "ix_asp_net_users_email" || constraint === "EmailIndex") {
        return { ok: false, message: "This email is already in use." };
      }

      if (constraint === "ix_asp_net_users_phone_number_country_code_phone_number") {
        return { ok: false, message: "This phone number is already in use." };
      }

      if (constraint === "UserNameIndex") {
        return { ok: false, message: "This username is already in use." };
      }

      return { ok: false, message: "Duplicate data detected." };
    }

    return {
      ok: false,
      message: "Something went wrong while saving your profile.",
    };
  }
}

export async function confirmProfileAction(): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  try {
    const result = await sql.begin(async (tx) => {
      const rows = await tx<
        {
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone_number_country_code: string | null;
          phone_number: string | null;
          birth_date: string | Date | null;
          gender: string | null;
          address: string | null;
          city: string | null;
          country: string | null;
          is_profile_confirmed: boolean;
        }[]
      >`
        SELECT
          first_name,
          last_name,
          email,
          phone_number_country_code,
          phone_number,
          birth_date,
          gender,
          address,
          city,
          country,
          is_profile_confirmed
        FROM identity.asp_net_users
        WHERE id = ${userId}
        FOR UPDATE
      `;

      const user = rows[0];

      if (!user) {
        return { ok: false, message: "User not found." };
      }

      if (user.is_profile_confirmed) {
        return { ok: true, message: "Profile is already confirmed." };
      }

      const missing: string[] = [];

      if (!user.first_name?.trim()) missing.push("first name");
      if (!user.last_name?.trim()) missing.push("last name");
      if (!user.email?.trim()) missing.push("email");
      if (!user.phone_number_country_code?.trim()) missing.push("country code");
      if (!user.phone_number?.trim()) missing.push("phone number");
      if (!user.birth_date) missing.push("date of birth");
      if (!user.gender?.trim()) missing.push("gender");
      if (!user.address?.trim()) missing.push("address");
      if (!user.city?.trim()) missing.push("city");
      if (!user.country?.trim()) missing.push("country");

      if (missing.length > 0) {
        return {
          ok: false,
          message: `Complete your profile before confirming: ${missing.join(", ")}.`,
        };
      }

      await tx`
        UPDATE identity.asp_net_users
        SET
          is_profile_confirmed = TRUE,
          profile_confirmed_at = NOW()
        WHERE id = ${userId}
      `;

      return {
        ok: true,
        message: "Profile confirmed. It is now locked.",
      };
    });

    revalidatePath("/profile");
    revalidatePath("/profile/edit");

    return result;
  } catch {
    return {
      ok: false,
      message: "Something went wrong while confirming your profile.",
    };
  }
}