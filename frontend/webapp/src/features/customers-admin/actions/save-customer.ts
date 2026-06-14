"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { db } from "@/features/booking-admin-shared/server/db";

const schema = z.object({
  customerId: z.guid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  phoneNumberCountryCode: z.string().min(1),
  phoneNumber: z.string().min(1),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  profileImageUrl: z.string().optional().nullable(),
});

export async function saveCustomerAction(input: unknown) {
  const values = schema.parse(input);
  if (values.customerId) {
    await db`
      update customer.customers
      set first_name = ${values.firstName},
          last_name = ${values.lastName},
          email = ${values.email},
          phone_number_country_code = ${values.phoneNumberCountryCode},
          phone_number = ${values.phoneNumber},
          city = ${values.city ?? null},
          country = ${values.country ?? null},
          zip_code = ${values.zipCode ?? null},
          gender = ${values.gender ?? null},
          is_active = ${values.isActive},
          last_modified_date = now()
      where id = ${values.customerId}
    `;
  } else {
    await db`
      insert into customer.customers (
        id, first_name, last_name, email, phone_number_country_code, phone_number, city, country, zip_code, gender, is_active
      ) values (
        public.uuid_generate_v4(),
        ${values.firstName}, ${values.lastName}, ${values.email}, ${values.phoneNumberCountryCode}, ${values.phoneNumber}, ${values.city ?? null}, ${values.country ?? null}, ${values.zipCode ?? null}, ${values.gender ?? null}, ${values.isActive}
      )
    `;
  }
  revalidatePath('/admin/customers');
  return { success: true };
}
