/**
 * Migration 0083 (showcase catalog) against a REAL Postgres migrated with
 * scripts/migrate.mjs. Guards the seed that production customers see first:
 * every tour must stay publishable, readable in fa + en, bookable as a request
 * (no charge until accepted), and reference image files that actually ship.
 *
 *   TOURS_TEST_DATABASE_URL=postgres://lsevin:lsevin@localhost:5432/lsevin_tours_test npx vitest run src/features/tours
 *
 * Skipped when TOURS_TEST_DATABASE_URL is not set.
 */
import { existsSync } from "node:fs";
import path from "node:path";

import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { assertLocalDatabase, idemKey, sampleBuyer, sampleParticipants, seedUser } from "../../testing/fixtures";

const URL_ = process.env.TOURS_TEST_DATABASE_URL;
const suite = URL_ ? describe : describe.skip;

vi.mock("@/app/[locale]/n/app/mobile/notifications/notification-service", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createNotification: vi.fn(async () => "00000000-0000-0000-0000-000000000000"),
}));

const SEEDED = [
  { slug: "persepolis-naqsh-e-rustam-day-trip", destination: "shiraz" },
  { slug: "isfahan-naqsh-e-jahan-and-bridges-evening", destination: "isfahan" },
  { slug: "yazd-old-town-and-dowlat-abad-garden", destination: "yazd" },
  { slug: "kish-island-beaches-and-sunset", destination: "kish" },
];
const publicFile = (url: string) => existsSync(path.join(process.cwd(), "public", url));

let sql: postgres.Sql;
let catalog: typeof import("./catalog");
let booking: typeof import("./booking");

suite("0083 showcase catalog (real database)", () => {
  beforeAll(async () => {
    assertLocalDatabase(URL_!);
    sql = postgres(URL_!, { max: 4 });
    catalog = await import("./catalog");
    booking = await import("./booking");
  });
  afterAll(async () => {
    await sql?.end();
  });

  it("every seeded tour is published with no publish errors and an inactive booking anchor", async () => {
    const rows = await sql<{ slug: string; status: string; errors: string | null; anchor_active: boolean; future: number }[]>`
      select t.slug, t.status,
             (select string_agg(r.code, ',') from tour.publish_requirements(t.id) r where r.severity = 'error') as errors,
             ps.is_active as anchor_active,
             (select count(*)::int from tour.departures d where d.tour_id = t.id and d.starts_at > now() and d.is_active) as future
        from tour.tours t
        join category.provider_services ps on ps.id = t.provider_service_id
       where t.slug in ${sql(SEEDED.map((s) => s.slug))}`;
    expect(rows.map((r) => r.slug).sort()).toEqual(SEEDED.map((s) => s.slug).sort());
    for (const r of rows) {
      expect(r, r.slug).toMatchObject({ status: "published", errors: null, anchor_active: false });
      expect(r.future, r.slug).toBeGreaterThan(10);
    }
  });

  it("customers read real fa and en content, captions credit the photographer, and every image file ships", async () => {
    for (const s of SEEDED) {
      for (const locale of ["fa-IR", "en-US"]) {
        const d = await catalog.getTourDetail(s.slug, locale);
        expect(d, `${s.slug} ${locale}`).not.toBeNull();
        expect(d!.text.title?.value).toBeTruthy();
        expect(d!.text.title?.locale).toBe(locale);
        expect(d!.text.description?.value?.length ?? 0).toBeGreaterThan(80);
        expect(d!.destination?.slug).toBe(s.destination);
        expect(d!.media.length).toBeGreaterThan(0);
        for (const m of d!.media) {
          expect(publicFile(m.url), m.url).toBe(true);
          if (m.thumbnailUrl) expect(publicFile(m.thumbnailUrl), m.thumbnailUrl).toBe(true);
          expect(m.caption).toMatch(locale === "fa-IR" ? /عکس: .+, CC BY/ : /Photo: .+, CC BY/);
        }
        // Approximate meeting point until a booking is confirmed (pins are not exact-surveyed).
        expect(d!.location.meeting).toMatchObject({ exact: false });
        expect(d!.policy?.version).toBe(1);
      }
    }
  });

  it("all four destinations are listed with a cover image that ships", async () => {
    const dests = await catalog.listDestinations("en-US", { featuredOnly: true });
    for (const s of SEEDED) {
      const d = dests.find((x) => x.slug === s.destination);
      expect(d, s.destination).toBeDefined();
      expect(d!.tourCount).toBeGreaterThan(0);
      expect(publicFile(d!.coverUrl!), d!.coverUrl!).toBe(true);
    }
  });

  it("booking a seeded tour creates a request without charging the customer", async () => {
    const customer = await seedUser(sql, { walletIrr: 500_000_000 });
    const [dep] = await sql<{ id: string; option_id: string }[]>`
      select d.id::text, o.id::text as option_id
        from tour.departures d
        join tour.tours t on t.id = d.tour_id
        join tour.options o on o.tour_id = t.id and o.code = 'standard'
       where t.slug = ${SEEDED[0].slug} and d.starts_at > now() + interval '2 days' and d.is_active
       order by d.starts_at limit 1`;
    const sel = { departureId: dep.id, optionId: dep.option_id, travelers: { adult: 2 } };
    const started = await booking.startCheckout(customer.id, { ...sel, idempotencyKey: idemKey() });
    expect(started.quote.total).toBe(90_000_000);
    const res = await booking.confirmCheckout(customer.id, {
      ...sel, holdId: started.holdId, idempotencyKey: idemKey(), expectedTotal: started.quote.total,
      acceptedPolicyVersion: started.policy.version, policyLocale: "fa-IR", uiLocale: "fa", displayCalendar: "persian",
      buyer: sampleBuyer, participants: sampleParticipants(2),
    });
    expect(res.status).toBe("requested");
    const [wallet] = await sql<{ debits: number }[]>`
      select count(*)::int as debits from customer.wallet_transactions where user_id = ${customer.id} and direction = 'debit'`;
    expect(wallet.debits).toBe(0);
  });
});
