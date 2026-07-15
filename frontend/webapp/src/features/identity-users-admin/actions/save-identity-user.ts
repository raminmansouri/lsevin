"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { db } from "@/features/booking-admin-shared/server/db";
import { assertAdmin } from "../server/guard";

const schema = z.object({
  userId: z.guid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  userName: z.string().min(1),
  email: z.email(),
  phoneNumberCountryCode: z.string().min(1),
  phoneNumber: z.string().min(1),
  userState: z.string().default('Active'),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  profileImageUrl: z.string().optional().nullable(),
  emailConfirmed: z.boolean().default(false),
  phoneNumberConfirmed: z.boolean().default(false),
  twoFactorEnabled: z.boolean().default(false),
});

export async function saveIdentityUserAction(input: unknown) {
  await assertAdmin();
  const values = schema.parse(input);
  const normalizedUserName = values.userName.toUpperCase();
  const normalizedEmail = values.email.toUpperCase();

  if (values.userId) {
    await db`
      update identity.asp_net_users
      set first_name = ${values.firstName},
          last_name = ${values.lastName},
          user_name = ${values.userName},
          normalized_user_name = ${normalizedUserName},
          email = ${values.email},
          normalized_email = ${normalizedEmail},
          phone_number_country_code = ${values.phoneNumberCountryCode},
          phone_number = ${values.phoneNumber},
          user_state = ${values.userState},
          city = ${values.city ?? null},
          country = ${values.country ?? null},
          address = ${values.address ?? null},
          gender = ${values.gender ?? null},
          profile_image_url = ${values.profileImageUrl ?? null},
          email_confirmed = ${values.emailConfirmed},
          phone_number_confirmed = ${values.phoneNumberConfirmed},
          two_factor_enabled = ${values.twoFactorEnabled}
      where id = ${values.userId}
    `;
  } else {
    await db`
      insert into identity.asp_net_users (
        id, first_name, last_name, user_name, normalized_user_name,
        email, normalized_email, phone_number_country_code, phone_number,
        user_state, email_confirmed, phone_number_confirmed, two_factor_enabled,
        lockout_enabled, access_failed_count, city, country, address, gender, profile_image_url
      ) values (
        public.uuid_generate_v4(),
        ${values.firstName}, ${values.lastName}, ${values.userName}, ${normalizedUserName},
        ${values.email}, ${normalizedEmail}, ${values.phoneNumberCountryCode}, ${values.phoneNumber},
        ${values.userState}, ${values.emailConfirmed}, ${values.phoneNumberConfirmed}, ${values.twoFactorEnabled},
        false, 0, ${values.city ?? null}, ${values.country ?? null}, ${values.address ?? null}, ${values.gender ?? null}, ${values.profileImageUrl ?? null}
      )
    `;
  }
  revalidatePath('/admin/identity-users');
  return { success: true };
}
