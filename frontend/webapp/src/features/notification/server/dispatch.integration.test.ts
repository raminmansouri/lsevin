import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { assertLocalDatabase } from "@/features/tours/testing/fixtures";

/**
 * notify.* is replicated between sites A and B and both run the dispatch loop. A queued delivery
 * must be sent only by the site that created it, or every SMS/email would go out twice.
 * Opt-in: STAYS_TEST_DATABASE_URL (and DATABASE_URL, used by the app code) on a local database.
 */
const URL_ = process.env.STAYS_TEST_DATABASE_URL;
const suite = URL_ ? describe : describe.skip;

suite("notification dispatch across replicated sites (real database)", () => {
  let sql: postgres.Sql;
  let dispatch: typeof import("./dispatch");
  const ids: { mine: string; other: string; legacy: string; notifications: string[] } = { mine: "", other: "", legacy: "", notifications: [] };

  async function queued(originSite: string | null) {
    const payload = originSite ? { originSite } : {};
    const [n] = await sql<{ id: string }[]>`
      insert into notify.notifications (recipient_user_id, notification_type, title, body, payload, status)
      values (${randomUUID()}::uuid, 'booking', 'dispatch test', 'body', ${sql.json(payload)}, 'queued') returning id::text`;
    ids.notifications.push(n.id);
    const [d] = await sql<{ id: string }[]>`
      insert into notify.notification_deliveries (notification_id, channel, recipient_email, status)
      values (${n.id}::uuid, 'email', 'dispatch-test@example.test', 'queued') returning id::text`;
    return d.id;
  }
  const statusOf = async (id: string) => (await sql<{ status: string }[]>`select status::text from notify.notification_deliveries where id = ${id}::uuid`)[0]?.status;

  beforeAll(async () => {
    assertLocalDatabase(URL_!);
    process.env.NOTIFY_SITE_ID = "site-a.test";
    sql = postgres(URL_!, { max: 2, onnotice: () => {} });
    dispatch = await import("./dispatch");
    ids.mine = await queued("site-a.test");
    ids.other = await queued("site-b.test");
    ids.legacy = await queued(null);
  });

  afterAll(async () => {
    if (!sql) return;
    await sql`delete from notify.notification_deliveries where notification_id = any(${ids.notifications}::uuid[])`;
    await sql`delete from notify.notifications where id = any(${ids.notifications}::uuid[])`;
    await sql.end({ timeout: 5 });
  });

  it("claims only this site's deliveries (and untagged legacy ones), never the other site's", async () => {
    for (let i = 0; i < 20 && ((await statusOf(ids.mine)) === "queued" || (await statusOf(ids.legacy)) === "queued"); i += 1) {
      await dispatch.dispatchQueuedDeliveries(100);
    }
    expect(await statusOf(ids.mine)).not.toBe("queued");
    expect(await statusOf(ids.legacy)).not.toBe("queued");
    expect(await statusOf(ids.other)).toBe("queued");
  });

  it("tags every new notification with the site that created it", async () => {
    const service = await import("@/app/[locale]/n/app/mobile/notifications/notification-service");
    const id = await service.createNotification({ recipientUserId: randomUUID(), notificationType: "booking", title: "t", body: "b", channels: ["in_app"], data: { kind: "x" } });
    ids.notifications.push(id);
    const [n] = await sql<{ payload: Record<string, unknown> }[]>`select payload from notify.notifications where id = ${id}::uuid`;
    expect(n.payload).toMatchObject({ originSite: "site-a.test", kind: "x" });
  });
});
