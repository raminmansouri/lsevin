/**
 * Test fixtures for stays, shared by the Vitest integration suite and the
 * Playwright E2E seed (e2e/stays/*). Writes real rows through the production
 * schema; every fixture gets unique slugs so suites can rerun against one
 * database without cleanup. Never point it at a non-local database.
 */
import type postgres from "postgres";

import { addMember, assertLocalDatabase, idemKey, seedUser, suffix, uid, type SeededUser } from "@/features/tours/testing/fixtures";

export { addMember, assertLocalDatabase, idemKey, seedUser, suffix, uid, type SeededUser };

type Sql = postgres.Sql<Record<string, unknown>>;

export async function accommodationProviderTypeId(sql: Sql): Promise<string> {
  const [pt] = await sql<{ id: string }[]>`
    select id::text from category.provider_types where name_translations->>'en-US' ilike 'accommodation%' order by create_date limit 1`;
  if (pt) return pt.id;
  const id = uid();
  await sql`insert into category.provider_types (id, name_translations, description_translations, is_active) values (${id}, '{"en-US":"Accommodations","fa-IR":"اقامتگاه"}', '{}', true)`;
  return id;
}

export async function seedStayProvider(sql: Sql, ownerUserId: string | null, opts: { name?: string } = {}) {
  const id = uid();
  const name = opts.name ?? `Caravan Hotels ${suffix()}`;
  const typeId = await accommodationProviderTypeId(sql);
  await sql`
    insert into category.service_providers (id, name_translations, description_translations, is_active, provider_type_id, city, country, email,
      phone_number_country_code, phone_number, accredited, timezone_id)
    values (${id}, ${sql.json({ "en-US": name, "fa-IR": `هتل‌های ${name}` })}, ${sql.json({ "en-US": "A family-run hotel group.", "fa-IR": "گروه هتل خانوادگی." })},
            true, ${typeId}, 'SHIRAZ', 'IR', ${`stay-${suffix()}@example.test`}, '+98', '9120000001', true, 'Asia/Tehran')`;
  if (ownerUserId) await addMember(sql, id, ownerUserId, "owner");
  return { id, name };
}

export async function seedStayCity(sql: Sql, opts: { slug?: string; name?: Record<string, string> } = {}) {
  const slug = opts.slug ?? `shiraz-${suffix()}`;
  const [c] = await sql<{ id: string }[]>`
    insert into stay.cities (slug, name, region, intro, cover_url, cover_alt, latitude, longitude, is_published, is_featured, sort_order)
    values (${slug}, ${sql.json(opts.name ?? { "fa-IR": "شیراز", "en-US": "Shiraz" })}, ${sql.json({ "fa-IR": "استان فارس", "en-US": "Fars" })},
            ${sql.json({ "fa-IR": "شیراز شهر باغ‌ها و شعر است.", "en-US": "Shiraz is the city of gardens and poetry." })},
            '/images/tours/shiraz-nasir-al-mulk-sm.webp', ${sql.json({ "fa-IR": "مسجد نصیرالملک", "en-US": "Nasir al-Mulk Mosque" })},
            29.5918, 52.5837, true, true, 1)
    returning id::text`;
  return { id: c.id, slug };
}

/**
 * A hotel exactly as Lsevin providers are stored today (the shape stay.import_provider reads):
 * free-text attributes ("ستاره": "4", "امکانات ویژه": "پارکینگ، استخر ..."), nightly
 * (date_range) services named in Persian, one implausibly cheap room, and gallery photos.
 */
export async function seedLegacyHotelProvider(sql: Sql, opts: { lat?: number; lng?: number; category?: string } = {}) {
  const provider = await seedStayProvider(sql, null, { name: `Legacy Hotel ${suffix()}` });
  await sql`update category.service_providers set latitude = ${opts.lat ?? 36.2881}, longitude = ${opts.lng ?? 59.6158},
              slug = ${`legacy-hotel-${suffix()}`}, image_url = 'Categories/services/legacy-cover.webp' where id = ${provider.id}::uuid`;
  const typeId = await accommodationProviderTypeId(sql);
  let [at] = await sql<{ id: number }[]>`select id from category.attribute_types order by id limit 1`;
  if (!at) [at] = await sql<{ id: number }[]>`insert into category.attribute_types (id, name) values ((select coalesce(max(id), 0) + 1 from category.attribute_types), 'text') returning id`;
  const attributeType = at.id;
  const attrs: [string, string][] = [
    ["ستاره", "4"],
    ["دسته بندی", opts.category ?? "هتل آپارتمان"],
    ["امکانات ویژه", "پارکینگ، لاندری، صبحانه، صرافی"],
    ["مجموعه ورزشی", "استخر ،سونا"],
  ];
  for (const [name, value] of attrs) {
    const defId = uid();
    await sql`insert into category.provider_attribute_definitions (id, name_translations, description_translations, attribute_type_id, is_required, validation_rules, provider_type_id, create_date)
              values (${defId}, ${sql.json({ "fa-IR": name })}, '{}', ${attributeType}, false, '{}', ${typeId}, now())`;
    await sql`insert into category.provider_attributes (id, attribute_definition_id, value_translations, service_provider_id, create_date)
              values (${uid()}, ${defId}, ${sql.json({ "en-US": value })}, ${provider.id}, now())`;
  }
  const [cat] = await sql<{ id: string }[]>`select id::text from category.categories order by id limit 1`;
  const defId = uid();
  await sql`insert into category.service_definitions (id, name_translations, description_translations, category_id, duration_minutes, pricing_model, is_active, currency, value, booking_ui_mode, requires_specialist)
            values (${defId}, ${sql.json({ "fa-IR": "اقامت شبانه", "en-US": "Nightly stay" })}, '{}', ${cat.id}, 1440, 'Fixed', true, 'IRR', 0, 'date_range', false)`;
  const rooms: [string, number, string | null][] = [
    ["اتاق دو تخته دبل", 2_000_000, null], // data-entry slip: a tenth of the others → must be skipped
    ["اتاق دو تخته رو به حرم", 40_000_000, "Categories/services/room-haram.webp"],
    ["اتاق سه تخته", 55_000_000, "Categories/services/room-triple.webp"],
    ["سوئیت خانواده چهار نفره", 70_000_000, null],
  ];
  for (const [name, value, image] of rooms) {
    const serviceId = uid();
    await sql`insert into category.provider_services (id, service_definition_id, display_name_translations, description_translations, is_active, service_provider_id, currency, value, image_url, create_date)
              values (${serviceId}, ${defId}, ${sql.json({ "fa-IR": name })}, '{}', true, ${provider.id}, 'IRR', ${value}, ${image}, now())`;
    if (image === "Categories/services/room-haram.webp") {
      await sql`insert into category.provider_service_gallery_items (title_translations, description_translations, url, media_type, display_order, is_primary, provider_service_id)
                values ('{}', '{}', 'Categories/services/room-haram-2.webp', 'image', 1, false, ${serviceId})`;
    }
  }
  for (let i = 0; i < 3; i++) {
    await sql`insert into category.provider_gallery_items (title_translations, description_translations, url, media_type, display_order, service_provider_id, create_date)
              values ('{}', '{}', ${`Categories/services/legacy-${i}.webp`}, 'image', ${i}, ${provider.id}, now())`;
  }
  return provider;
}

export type SeedStayOptions = {
  providerId: string;
  cityId: string;
  slug?: string;
  name?: Record<string, string>;
  kind?: string;
  inventoryModel?: "rooms" | "entire_place";
  confirmationMode?: "instant" | "request";
  status?: "draft" | "published";
  units?: number;
  basePrice?: number;
  taxPercent?: number;
  rules?: { hoursBefore: number; refundPercent: number }[];
  nonRefundablePlan?: boolean;
  approximate?: boolean;
  amenities?: string[];
};

export type SeededStay = { id: string; slug: string; roomTypeId: string; ratePlanId: string; nonRefundablePlanId: string | null; policyId: string; name: Record<string, string> };

/** A bookable property: one room type, a refundable breakfast rate (+ optional non-refundable rate), a policy and a photo. */
export async function seedStay(sql: Sql, o: SeedStayOptions): Promise<SeededStay> {
  const slug = o.slug ?? `zand-hotel-${suffix()}`;
  const name = o.name ?? { "fa-IR": `هتل زند ${slug.slice(-4)}`, "en-US": `Zand Hotel ${slug.slice(-4)}` };
  const entire = o.inventoryModel === "entire_place";
  const [p] = await sql<{ id: string }[]>`
    insert into stay.properties (service_provider_id, city_id, slug, status, kind, inventory_model, star_rating, name, summary, description, address,
      latitude, longitude, location_privacy, amenity_codes, confirmation_mode, currency_code, tax_percent, contact_phone, published_at, nearby, step_free_access, medical_friendly)
    values (${o.providerId}::uuid, ${o.cityId}::uuid, ${slug}, ${o.status ?? "published"}, ${o.kind ?? (entire ? "villa" : "hotel")},
      ${entire ? "entire_place" : "rooms"}, ${entire ? null : 4}, ${sql.json(name)},
      ${sql.json({ "fa-IR": "اقامتی آرام نزدیک باغ ارم.", "en-US": "A quiet stay near Eram Garden." })},
      ${sql.json({ "fa-IR": "اتاق‌های روشن، صبحانه محلی و پذیرش شبانه‌روزی.", "en-US": "Bright rooms, a local breakfast and a 24-hour front desk." })},
      ${sql.json({ "fa-IR": "شیراز، خیابان ارم، پلاک ۱۲", "en-US": "12 Eram St, Shiraz" })},
      29.6363, 52.5258, ${o.approximate ? "approximate" : "exact"}, ${o.amenities ?? ["wifi", "parking", "breakfast", "elevator"]}::text[],
      ${o.confirmationMode ?? "instant"}, 'IRR', ${o.taxPercent ?? 0}, '+987132220000', now(),
      ${sql.json([{ kind: "hospital", name: { "fa-IR": "بیمارستان نمازی", "en-US": "Namazi Hospital" }, distanceM: 850 }])}, true, true)
    returning id::text`;
  const [pol] = await sql<{ id: string }[]>`
    insert into stay.policies (property_id, version, rules, no_show_refund_percent, texts)
    values (${p.id}::uuid, 1, ${sql.json(o.rules ?? [{ hoursBefore: 72, refundPercent: 100 }, { hoursBefore: 24, refundPercent: 50 }])}, 0,
            ${sql.json({ "fa-IR": "پس از ۲۴ ساعت مانده به ورود، لغو بازپرداخت ندارد.", "en-US": "No refund within 24 hours of check-in." })})
    returning id::text`;
  await sql`update stay.properties set current_policy_id = ${pol.id}::uuid where id = ${p.id}::uuid`;
  const [rt] = await sql<{ id: string }[]>`
    insert into stay.room_types (property_id, code, name, units, base_occupancy, max_adults, max_children, max_occupancy, bed_config, size_m2, amenity_codes)
    values (${p.id}::uuid, 'double', ${sql.json(entire ? { "fa-IR": "کل ویلا", "en-US": "Entire villa" } : { "fa-IR": "اتاق دو تخته", "en-US": "Double room" })},
            ${entire ? 1 : (o.units ?? 3)}, 2, ${entire ? 6 : 3}, ${entire ? 4 : 2}, ${entire ? 8 : 4},
            ${sql.json([{ type: "double", count: 1 }])}, 28, '{tv,air_conditioning}'::text[])
    returning id::text`;
  const [rp] = await sql<{ id: string }[]>`
    insert into stay.rate_plans (property_id, room_type_id, code, name, meal_plan, refundable, base_price, extra_adult_price, child_price, min_nights, max_nights, long_stay_nights, long_stay_percent)
    values (${p.id}::uuid, ${rt.id}::uuid, 'flex-bb', ${sql.json({ "fa-IR": "قابل استرداد با صبحانه", "en-US": "Flexible with breakfast" })}, 'breakfast', true,
            ${o.basePrice ?? 4_500_000}, 1_500_000, 750_000, 1, 30, 7, 10)
    returning id::text`;
  let nonRefundablePlanId: string | null = null;
  if (o.nonRefundablePlan) {
    const [nr] = await sql<{ id: string }[]>`
      insert into stay.rate_plans (property_id, room_type_id, code, name, meal_plan, refundable, base_price, min_nights, max_nights, sort_order)
      values (${p.id}::uuid, ${rt.id}::uuid, 'saver', ${sql.json({ "fa-IR": "اقتصادی غیرقابل استرداد", "en-US": "Saver, non-refundable" })}, 'room_only', false,
              ${Math.round((o.basePrice ?? 4_500_000) * 0.8)}, 1, 30, 2)
      returning id::text`;
    nonRefundablePlanId = nr.id;
  }
  await sql`
    insert into stay.media (property_id, url, alt, credit, sort_order, is_cover)
    values (${p.id}::uuid, '/images/stays/yazd-traditional-courtyard-sm.webp', ${sql.json({ "fa-IR": "حیاط اقامتگاه", "en-US": "Courtyard" })}, 'Julia Maudlin · CC BY 2.0', 1, true)`;
  await sql`select stay.ensure_booking_anchor(${p.id}::uuid)`;
  return { id: p.id, slug, roomTypeId: rt.id, ratePlanId: rp.id, nonRefundablePlanId, policyId: pol.id, name };
}

/**
 * A booking written the way checkout writes it (booking.bookings + stay.bookings,
 * nights sold through stay.lock_nights), for tests that start after a booking exists.
 */
export async function seedStayBooking(
  sql: Sql,
  stay: SeededStay,
  userId: string,
  opts: { checkIn: string; checkOut: string; status?: "confirmed" | "pending_payment" | "requested" | "completed"; total?: number; paid?: boolean },
) {
  const bookingId = uid();
  const status = opts.status ?? "confirmed";
  const total = opts.total ?? 9_000_000;
  const [p] = await sql<{ provider_id: string; anchor: string }[]>`
    select service_provider_id::text as provider_id, provider_service_id::text as anchor from stay.properties where id = ${stay.id}::uuid`;
  await sql`
    insert into booking.bookings (id, provider_id, service_id, selected_date, payment_method, add_ons, upload_files, additional_services, payment_status, booking_status,
      user_id, currency_code, total_amount, paid_amount, booking_ui_mode, adults, children, infants, metadata)
    values (${bookingId}::uuid, ${p.provider_id}::uuid, ${p.anchor}::uuid, ${opts.checkIn}::date, 'wallet', '[]', '[]', '[]',
      ${opts.paid || status === "confirmed" || status === "completed" ? "Paid" : "Pending"}, ${status === "confirmed" || status === "completed" ? "Confirmed" : "Pending"},
      ${userId}::uuid, 'IRR', ${total}, ${opts.paid || status === "confirmed" || status === "completed" ? total : 0}, 'custom_form', 2, 0, 0,
      ${sql.json({ kind: "stay", propertyId: stay.id, checkIn: opts.checkIn, checkOut: opts.checkOut, rooms: 1 })})`;
  await sql`select 1 from stay.lock_nights(${stay.roomTypeId}::uuid, ${opts.checkIn}::date, ${opts.checkOut}::date)`;
  await sql`update stay.inventory set sold = sold + 1 where room_type_id = ${stay.roomTypeId}::uuid and stay_date >= ${opts.checkIn}::date and stay_date < ${opts.checkOut}::date`;
  const nights = Math.round((Date.parse(opts.checkOut) - Date.parse(opts.checkIn)) / 86_400_000);
  const quote = { currency: "IRR", checkIn: opts.checkIn, checkOut: opts.checkOut, nights, rooms: 1, adults: 2, childAges: [], lines: [], nightly: [], roomsSubtotal: total, discount: 0, tax: 0, fees: 0, total, perNight: Math.round(total / nights) };
  await sql`
    insert into stay.bookings (booking_id, property_id, room_type_id, rate_plan_id, user_id, service_provider_id, status, confirmation_mode, check_in, check_out, nights,
      rooms, adults, children, child_ages, currency_code, total_amount, price_snapshot, policy_id, policy_snapshot, policy_accepted_at, content_snapshot, ui_locale,
      display_calendar, buyer, guests, voucher_code, idempotency_key, confirmed_at, request_expires_at, payment_deadline_at)
    values (${bookingId}::uuid, ${stay.id}::uuid, ${stay.roomTypeId}::uuid, ${stay.ratePlanId}::uuid, ${userId}::uuid, ${p.provider_id}::uuid, ${status},
      ${status === "requested" ? "request" : "instant"}, ${opts.checkIn}::date, ${opts.checkOut}::date, ${nights}, 1, 2, 0, '{}'::smallint[], 'IRR', ${total}, ${sql.json(quote)},
      ${stay.policyId}::uuid, ${sql.json({ version: 1, rules: [{ hoursBefore: 72, refundPercent: 100 }, { hoursBefore: 24, refundPercent: 50 }], refundable: true, noShowRefundPercent: 0, texts: {} })},
      now(), ${sql.json({ propertyName: stay.name, roomName: { "fa-IR": "اتاق دو تخته", "en-US": "Double room" }, cityName: { "fa-IR": "شیراز" }, address: { "fa-IR": "شیراز، خیابان ارم، پلاک ۱۲" }, contactPhone: "+987132220000", latitude: 29.6363, longitude: 52.5258, checkInTime: "14:00", checkOutTime: "12:00", timezone: "Asia/Tehran", mealPlan: "breakfast", refundable: true })},
      'fa-IR', 'persian', ${sql.json({ firstName: "Reza", lastName: "Karimi", phone: "+989121112233", email: null })}, ${sql.json([{ firstName: "Reza", lastName: "Karimi" }])},
      ${`ST-E2E${suffix().toUpperCase()}`}, ${`seed_${uid().replace(/-/g, "")}`}, ${status === "confirmed" || status === "completed" ? sql`now()` : null},
      ${status === "requested" ? sql`now() + interval '24 hours'` : null}, ${status === "pending_payment" ? sql`now() + interval '30 minutes'` : null})`;
  return { bookingId };
}

/** ISO date `days` from today in Asia/Tehran. */
export function isoInDays(days: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const sampleStayBuyer = { firstName: "Sara", lastName: "Tester", phone: "+989121234567", email: "sara@example.test" };
