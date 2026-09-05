import "server-only";

import { getShopContext } from "../lib/context";
import { sql } from "../lib/db";
import type { AddressInput } from "../schemas/checkout";

export type ShopAddress = AddressInput & { id: string; isDefault: boolean };

export async function listCustomerAddresses(): Promise<ShopAddress[]> {
  const ctx = await getShopContext();
  if (!ctx.customerId) return [];
  const rows = await sql<any[]>`
    select id::text as id, full_name as "fullName", phone_number_country_code as "phoneNumberCountryCode",
      phone_number as "phoneNumber", country, city, state_region as "stateRegion",
      address_line_1 as "addressLine1", address_line_2 as "addressLine2", postal_code as "postalCode",
      company, is_default as "isDefault"
    from shop.customer_addresses
    where customer_id = ${ctx.customerId}::uuid and deleted_at is null
    order by is_default desc, last_modified_date desc
  `;
  return rows as ShopAddress[];
}

export async function saveCustomerAddress(input: AddressInput & { id?: string; isDefault?: boolean }): Promise<string> {
  const ctx = await getShopContext();
  if (!ctx.customerId) throw new Error("Sign in to save an address.");

  if (input.isDefault) {
    await sql`update shop.customer_addresses set is_default = false where customer_id = ${ctx.customerId}::uuid`;
  }

  if (input.id) {
    const rows = await sql<{ id: string }[]>`
      update shop.customer_addresses set
        full_name = ${input.fullName},
        phone_number_country_code = ${input.phoneNumberCountryCode ?? null},
        phone_number = ${input.phoneNumber ?? null},
        country = ${input.country}, city = ${input.city}, state_region = ${input.stateRegion ?? null},
        address_line_1 = ${input.addressLine1}, address_line_2 = ${input.addressLine2 ?? null},
        postal_code = ${input.postalCode ?? null}, company = ${input.company ?? null},
        is_default = ${Boolean(input.isDefault)}, last_modified_date = now()
      where id = ${input.id}::uuid and customer_id = ${ctx.customerId}::uuid and deleted_at is null
      returning id::text as id
    `;
    if (!rows[0]) throw new Error("Address not found.");
    return rows[0].id;
  }

  const rows = await sql<{ id: string }[]>`
    insert into shop.customer_addresses
      (customer_id, address_type, full_name, phone_number_country_code, phone_number, country, city, state_region,
       address_line_1, address_line_2, postal_code, company, is_default)
    values
      (${ctx.customerId}::uuid, 'shipping', ${input.fullName}, ${input.phoneNumberCountryCode ?? null}, ${input.phoneNumber ?? null},
       ${input.country}, ${input.city}, ${input.stateRegion ?? null}, ${input.addressLine1}, ${input.addressLine2 ?? null},
       ${input.postalCode ?? null}, ${input.company ?? null}, ${Boolean(input.isDefault)})
    returning id::text as id
  `;
  return rows[0].id;
}

export async function deleteCustomerAddress(id: string): Promise<void> {
  const ctx = await getShopContext();
  if (!ctx.customerId) throw new Error("Sign in required.");
  await sql`
    update shop.customer_addresses set deleted_at = now()
    where id = ${id}::uuid and customer_id = ${ctx.customerId}::uuid
  `;
}
