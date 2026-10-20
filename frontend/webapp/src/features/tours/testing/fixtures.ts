/**
 * Test fixtures for the Tours platform, shared by the Vitest integration suite
 * and the Playwright E2E seed (e2e/tours/*). Writes real rows through the same
 * schema production uses; every fixture gets unique ids/slugs so suites can run
 * repeatedly against one database without cleanup.
 *
 * Takes a raw postgres.js client so it can run outside Next.js. Never point it
 * at a non-local database: callers assert that (see assertLocalDatabase).
 */
import { randomUUID } from "node:crypto";

import type postgres from "postgres";

type Sql = postgres.Sql<Record<string, unknown>>;

export function assertLocalDatabase(url: string) {
  const host = new URL(url).hostname;
  if (!["localhost", "127.0.0.1", "::1", "host.docker.internal"].includes(host)) {
    throw new Error(`Refusing to seed tour fixtures into a non-local database (${host}).`);
  }
}

export const uid = () => randomUUID();
export const suffix = () => randomUUID().slice(0, 8);
export const idemKey = () => `k_${randomUUID().replace(/-/g, "")}`;

export type SeededUser = { id: string; phone: string; email: string; firstName: string; lastName: string };

export async function seedUser(sql: Sql, opts: { firstName?: string; lastName?: string; walletIrr?: number; countryCode?: string } = {}): Promise<SeededUser> {
  const id = uid();
  const s = suffix();
  const phone = `912${Math.floor(1_000_000 + Math.random() * 8_999_999)}`;
  const email = `tours-${s}@example.test`;
  const firstName = opts.firstName ?? "Sara";
  const lastName = opts.lastName ?? `Tester${s}`;
  await sql`
    insert into identity.asp_net_users (id, first_name, last_name, phone_number_country_code, user_name, normalized_user_name, email, normalized_email,
      email_confirmed, phone_number, phone_number_confirmed, two_factor_enabled, lockout_enabled, access_failed_count)
    values (${id}, ${firstName}, ${lastName}, ${opts.countryCode ?? "+98"}, ${`u${s}`}, ${`U${s}`.toUpperCase()}, ${email}, ${email.toUpperCase()},
      true, ${phone}, true, false, false, 0)`;
  // Production creates the customer profile with the account (same id); the
  // booking/payment notifiers rely on it.
  await sql`
    insert into customer.customers (id, phone_number, phone_number_country_code, email, first_name, last_name)
    values (${id}, ${phone}, ${opts.countryCode ?? "+98"}, ${email}, ${firstName}, ${lastName})`;
  if (opts.walletIrr && opts.walletIrr > 0) await fundWallet(sql, id, "IRR", opts.walletIrr);
  return { id, phone, email, firstName, lastName };
}

export async function fundWallet(sql: Sql, userId: string, currency: string, amount: number) {
  const [acc] = await sql<{ id: string }[]>`
    insert into customer.wallet_accounts (user_id, default_currency) values (${userId}, ${currency}) returning id::text`;
  await sql`
    insert into customer.wallet_transactions (wallet_account_id, user_id, transaction_type, direction, status, title, currency_code, amount)
    values (${acc.id}, ${userId}, 'topup', 'credit', 'completed', 'E2E fixture top-up', ${currency}, ${amount})`;
}

export async function tourismProviderTypeId(sql: Sql): Promise<string> {
  const [pt] = await sql<{ id: string }[]>`
    select id::text from category.provider_types where name_translations->>'en-US' ilike 'tourism' order by create_date limit 1`;
  if (pt) return pt.id;
  const id = uid();
  await sql`insert into category.provider_types (id, name_translations, description_translations, is_active) values (${id}, '{"en-US":"Tourism","fa-IR":"گردشگری"}', '{}', true)`;
  return id;
}

export type SeededProvider = { id: string; name: string };

export async function seedProvider(sql: Sql, ownerUserId: string, opts: { name?: string; role?: string; active?: boolean } = {}): Promise<SeededProvider> {
  const id = uid();
  const name = opts.name ?? `Persia Trails ${suffix()}`;
  const typeId = await tourismProviderTypeId(sql);
  await sql`
    insert into category.service_providers (id, name_translations, description_translations, is_active, provider_type_id, city, country, email,
      phone_number_country_code, phone_number, accredited, timezone_id)
    values (${id}, ${sql.json({ "en-US": name, "fa-IR": `سفرهای ${name}` })}, '{}', ${opts.active ?? true}, ${typeId}, 'SHIRAZ', 'IR',
      ${`ops-${suffix()}@example.test`}, '+98', '9120000000', true, 'Asia/Tehran')`;
  await addMember(sql, id, ownerUserId, opts.role ?? "owner");
  return { id, name };
}

export async function addMember(sql: Sql, serviceProviderId: string, userId: string, role: string, status = "active") {
  await sql`
    insert into provider_portal.provider_members (service_provider_id, user_id, role, status)
    values (${serviceProviderId}, ${userId}, ${role}::provider_portal.membership_role, ${status})
    on conflict (service_provider_id, user_id) do update set role = excluded.role, status = excluded.status`;
}

export async function seedDestination(sql: Sql, opts: { slug?: string; name?: Record<string, string>; lat?: number; lng?: number } = {}) {
  const slug = opts.slug ?? `shiraz-${suffix()}`;
  const [d] = await sql<{ id: string }[]>`
    insert into tour.destinations (slug, name_translations, region_translations, country_code, latitude, longitude, timezone, cover_url, is_published, is_featured)
    values (${slug}, ${sql.json(opts.name ?? { "en-US": "Shiraz", "fa-IR": "شیراز", "ar-SA": "شيراز" })}, ${sql.json({ "en-US": "Fars, Iran", "fa-IR": "فارس، ایران" })},
            'IR', ${opts.lat ?? 29.5918}, ${opts.lng ?? 52.5837}, 'Asia/Tehran', '/images/tours/shiraz.jpg', true, true)
    returning id::text`;
  return { id: d.id, slug };
}

export type SeedTourOptions = {
  providerId: string;
  destinationId?: string | null;
  slug?: string;
  sourceLocale?: string;
  titles?: Record<string, string>;
  /** Locales other than the source that get a full translation. */
  translateTo?: string[];
  images?: number;
  days?: number;
  capacity?: number;
  departures?: number; // count, daily from `firstDepartureInDays`
  firstDepartureInDays?: number;
  localTime?: string;
  adultPrice?: number;
  childPrice?: number;
  currency?: string;
  confirmationMode?: "instant" | "request";
  cancellationRules?: { hoursBefore: number; refundPercent: number }[];
  status?: "draft" | "published";
  categories?: string[];
  timezone?: string;
  locationPrivacy?: "exact" | "approximate";
};

export type SeededTour = {
  id: string; slug: string; anchorId: string; optionId: string; privateOptionId: string;
  departureIds: string[]; stopIds: string[]; policyVersionId: string; sourceLocale: string;
};

const SOURCE_TEXT: Record<string, Record<string, string>> = {
  "fa-IR": {
    summary: "یک روز کامل در تخت جمشید و نقش رستم با راهنمای حرفه‌ای.",
    description: "بازدید از تخت جمشید، نقش رستم و پاسارگاد همراه با راهنمای مجرب. ناهار سنتی و حمل‌ونقل رفت و برگشت از شیراز.",
    meeting_instructions: "میدان ارم، مقابل در اصلی باغ ارم، ساعت ۷:۴۵ حاضر باشید.",
    cancellation_policy: "تا ۷۲ ساعت قبل از حرکت بازپرداخت کامل، تا ۲۴ ساعت قبل ۵۰٪.",
    safety_notes: "کفش راحت بپوشید و آب همراه داشته باشید. در روزهای گرم کلاه لازم است.",
    highlights: "تخت جمشید\nنقش رستم\nپاسارگاد",
    inclusions: "راهنما\nبلیت ورودی\nناهار\nحمل‌ونقل",
    exclusions: "انعام\nهزینه‌های شخصی",
    what_to_bring: "کلاه، کرم ضدآفتاب، آب",
  },
  "en-US": {
    summary: "A full day at Persepolis and Naqsh-e Rostam with a licensed guide.",
    description: "Visit Persepolis, Naqsh-e Rostam and Pasargadae with an experienced guide. Traditional lunch and return transport from Shiraz.",
    meeting_instructions: "Eram Square, in front of the main gate of Eram Garden. Be there at 07:45.",
    cancellation_policy: "Full refund up to 72 hours before departure, 50% up to 24 hours before.",
    safety_notes: "Wear comfortable shoes and carry water. A hat is needed on hot days.",
    highlights: "Persepolis\nNaqsh-e Rostam\nPasargadae",
    inclusions: "Guide\nAdmission tickets\nLunch\nTransport",
    exclusions: "Tips\nPersonal expenses",
    what_to_bring: "Hat, sunscreen, water",
  },
};

export async function seedTour(sql: Sql, o: SeedTourOptions): Promise<SeededTour> {
  const slug = o.slug ?? `persepolis-day-tour-${suffix()}`;
  const src = o.sourceLocale ?? "fa-IR";
  const tz = o.timezone ?? "Asia/Tehran";
  const titles = o.titles ?? { "fa-IR": "تور یک‌روزه تخت جمشید", "en-US": "Persepolis day tour" };
  const days = o.days ?? 1;
  const [t] = await sql<{ id: string }[]>`
    insert into tour.tours (service_provider_id, destination_id, slug, status, tour_type, category_codes, transport_modes, difficulty, activity_level,
      duration_minutes, duration_days, nights, min_participants, max_participants, guide_languages, confirmation_mode, booking_cutoff_minutes,
      timezone, currency_code, meeting_lat, meeting_lng, end_lat, end_lng, location_privacy, family_friendly, source_locale)
    values (${o.providerId}, ${o.destinationId ?? null}, ${slug}, 'draft', ${days > 1 ? "multi_day" : "single_day"},
      ${o.categories ?? ["culture", "city"]}, ${["van", "walk"]}, 'easy', 2, ${days > 1 ? null : 600}, ${days}, ${Math.max(days - 1, 0)}, 1, 12,
      ${["fa", "en"]}, ${o.confirmationMode ?? "instant"}, 60, ${tz}, ${o.currency ?? "IRR"},
      29.6365, 52.5260, 29.9355, 52.8916, ${o.locationPrivacy ?? "exact"}, true, ${src})
    returning id::text`;

  const locales = [src, ...(o.translateTo ?? [])];
  for (const loc of locales) {
    const fields: Record<string, string> = { ...(SOURCE_TEXT[loc] ?? SOURCE_TEXT["en-US"]), title: titles[loc] ?? `${titles[src]} (${loc})` };
    for (const [field, value] of Object.entries(fields)) {
      await sql`
        insert into tour.content (tour_id, entity_type, entity_id, field_key, locale, draft_value, published_value, status, is_source, source_revision)
        values (${t.id}, 'tour', ${t.id}, ${field}, ${loc}, ${value}, ${o.status === "draft" ? null : value},
                ${o.status === "draft" ? "draft" : "published"}, ${loc === src}, ${loc === src ? null : 1})`;
    }
  }

  for (let i = 0; i < (o.images ?? 6); i += 1) {
    await sql`
      insert into tour.media (tour_id, kind, url, sort_order, is_cover, width, height, alt_translations, caption_translations, moderation_status)
      values (${t.id}, 'image', ${`/images/tours/fixture-${(i % 6) + 1}.jpg`}, ${i}, ${i === 0}, 1600, 1067,
              ${sql.json({ "en-US": `Persepolis view ${i + 1}`, "fa-IR": `نمای تخت جمشید ${i + 1}` })},
              ${sql.json({ "en-US": `Photo ${i + 1}`, "fa-IR": `عکس ${i + 1}` })}, ${o.status === "draft" ? "pending" : "approved"})`;
  }

  const stopDefs = [
    { day: 1, type: "meeting", lat: 29.6365, lng: 52.526, title: { "fa-IR": "میدان ارم", "en-US": "Eram Square" }, time: "07:45", dur: 15 },
    { day: 1, type: "activity", lat: 29.9355, lng: 52.8916, title: { "fa-IR": "تخت جمشید", "en-US": "Persepolis" }, time: "09:00", dur: 180 },
    { day: 1, type: "activity", lat: 29.9886, lng: 52.8746, title: { "fa-IR": "نقش رستم", "en-US": "Naqsh-e Rostam" }, time: "13:00", dur: 60 },
  ];
  if (days > 1) {
    stopDefs.push({ day: 2, type: "activity", lat: 30.1939, lng: 53.1673, title: { "fa-IR": "پاسارگاد", "en-US": "Pasargadae" }, time: "09:30", dur: 120 });
    stopDefs.push({ day: 2, type: "finish", lat: 29.6365, lng: 52.526, title: { "fa-IR": "بازگشت به شیراز", "en-US": "Return to Shiraz" }, time: "16:00", dur: 0 });
  }
  const stopIds: string[] = [];
  const pos: Record<number, number> = {};
  for (const s of stopDefs) {
    pos[s.day] = (pos[s.day] ?? 0) + 1;
    const [row] = await sql<{ id: string }[]>`
      insert into tour.itinerary_stops (tour_id, day_number, position, stop_type, latitude, longitude, start_time, duration_minutes, transport_mode)
      values (${t.id}, ${s.day}, ${pos[s.day]}, ${s.type}, ${s.lat}, ${s.lng}, ${s.time}, ${s.dur}, 'van') returning id::text`;
    stopIds.push(row.id);
    for (const [loc, title] of Object.entries(s.title)) {
      if (!locales.includes(loc)) continue;
      await sql`
        insert into tour.content (tour_id, entity_type, entity_id, field_key, locale, draft_value, published_value, status, is_source)
        values (${t.id}, 'stop', ${row.id}, 'title', ${loc}, ${title}, ${o.status === "draft" ? null : title}, ${o.status === "draft" ? "draft" : "published"}, ${loc === src})`;
    }
  }

  const [opt] = await sql<{ id: string }[]>`
    insert into tour.options (tour_id, code, kind, min_group, max_group) values (${t.id}, 'standard', 'public', 1, 12) returning id::text`;
  await sql`insert into tour.price_tiers (option_id, traveler_class, amount) values (${opt.id}, 'adult', ${o.adultPrice ?? 12_000_000})`;
  await sql`insert into tour.price_tiers (option_id, traveler_class, amount, max_age) values (${opt.id}, 'child', ${o.childPrice ?? 6_000_000}, 11)`;
  const [priv] = await sql<{ id: string }[]>`
    insert into tour.options (tour_id, code, kind, min_group, max_group, private_group_price, sort_order) values (${t.id}, 'private', 'private', 1, 6, ${(o.adultPrice ?? 12_000_000) * 4}, 1) returning id::text`;
  await sql`update tour.tours set private_available = true, from_price = ${o.adultPrice ?? 12_000_000} where id = ${t.id}`;

  const rules = o.cancellationRules ?? [{ hoursBefore: 72, refundPercent: 100 }, { hoursBefore: 24, refundPercent: 50 }];
  const [pv] = await sql<{ id: string }[]>`
    insert into tour.policy_versions (tour_id, version, cancellation_rules, texts)
    values (${t.id}, 1, ${sql.json(rules)}, ${sql.json({
      "fa-IR": { cancellation: SOURCE_TEXT["fa-IR"].cancellation_policy, rules: "ورود حیوانات خانگی ممنوع است." },
      "en-US": { cancellation: SOURCE_TEXT["en-US"].cancellation_policy, rules: "No pets." },
    })})
    returning id::text`;
  await sql`update tour.tours set current_policy_version = 1 where id = ${t.id}`;

  await sql`select tour.ensure_booking_anchor(${t.id}::uuid)`;
  const departureIds: string[] = [];
  const time = o.localTime ?? "08:00";
  for (let i = 0; i < (o.departures ?? 5); i += 1) {
    const [d] = await sql<{ id: string }[]>`
      insert into tour.departures (tour_id, option_id, service_provider_id, provider_service_id, starts_on, ends_on, local_start_time, timezone, capacity)
      select ${t.id}::uuid, null, t.service_provider_id, t.provider_service_id,
             (now() at time zone ${tz})::date + ${(o.firstDepartureInDays ?? 3) + i}::int,
             (now() at time zone ${tz})::date + ${(o.firstDepartureInDays ?? 3) + i + days - 1}::int,
             ${time}::time, ${tz}, ${o.capacity ?? 10}
        from tour.tours t where t.id = ${t.id}::uuid
      returning id::text`;
    departureIds.push(d.id);
  }
  if (o.status !== "draft") {
    await sql`update tour.tours set status = 'published', published_at = now(), published_revision = draft_revision where id = ${t.id}`;
  }
  await sql`select tour.ensure_booking_anchor(${t.id}::uuid)`;
  await sql`select tour.refresh_search_text(${t.id}::uuid)`;
  const [anchor] = await sql<{ id: string }[]>`select provider_service_id::text as id from tour.tours where id = ${t.id}`;
  return { id: t.id, slug, anchorId: anchor.id, optionId: opt.id, privateOptionId: priv.id, departureIds, stopIds, policyVersionId: pv.id, sourceLocale: src };
}

export const sampleParticipants = (adults: number, children = 0) => [
  ...Array.from({ length: adults }, (_, i) => ({ travelerClass: "adult" as const, firstName: i === 0 ? "Sara" : "علی", lastName: i === 0 ? "Tester" : "رضایی", nationality: "IR", age: 30 + i })),
  ...Array.from({ length: children }, (_, i) => ({ travelerClass: "child" as const, firstName: "Mina", lastName: `Kid${i}`, nationality: "IR", age: 8 })),
];

export const sampleBuyer = { firstName: "Sara", lastName: "Tester", email: "sara@example.test", phone: "+989121234567" };
