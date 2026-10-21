import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import postgres from 'postgres';
import { randomUUID } from 'node:crypto';

/**
 * Real-Postgres checks for add-on (child) bookings in a draft: several children of the same
 * provider type (migration 0078), update-by-id, server-side pricing, and the "admin-linked
 * add-on types only" and ownership rules. Needs a LOCAL database with 0078 applied; skipped
 * otherwise. Fixtures use fresh ids and are deleted afterwards.
 */

// The repository imports the session helper (next-auth), which cannot load outside Next; the
// functions under test take the user id explicitly, so it is never called here.
vi.mock('../utils/auth', () => ({ resolveCurrentUserId: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({}));
vi.mock('@/features/finance/lib/server/iranian-visitor', () => ({ resolveIsIranianVisitor: vi.fn(async () => false) }));

// Opt-in only: it needs a local database that already has migration 0078, which the default
// test database (setup-env's port 5442 fallback) is not guaranteed to have.
const url = process.env.ACCOUNTING_TEST_DATABASE_URL;
const host = url ? new URL(url).hostname : '';
const LOCAL = ['localhost', '127.0.0.1', '::1'].includes(host);
const sql = LOCAL ? postgres(url as string, { max: 2, prepare: false }) : null;
const d = LOCAL ? describe : describe.skip;

const id = () => randomUUID();
const ids = {
  category: id(), typeMain: id(), typeAddon: id(), typeUnlinked: id(),
  defMain: id(), defAddon: id(), defOther: id(),
  providerMain: id(), providerAddon: id(), providerAddon2: id(), providerOther: id(),
  serviceMain: id(), serviceAddon: id(), serviceAddon2: id(), serviceOther: id(),
  user: id(), otherUser: id(), draft: id(), otherDraft: id(),
};

type Repo = typeof import('./repository');
let repo: Repo;

d('booking-pro child bookings (real database)', () => {
  beforeAll(async () => {
    const s = sql!;
    await s`insert into finance.currencies (code) values ('USD') on conflict do nothing`.catch(() => undefined);
    await s`insert into category.categories (id, name_translations, description_translations, is_active) values (${ids.category}, '{"en":"IT"}', '{}', true)`;
    for (const [typeId, name] of [[ids.typeMain, 'Clinic'], [ids.typeAddon, 'Transfer'], [ids.typeUnlinked, 'Pharmacy']]) {
      await s`insert into category.provider_types (id, name_translations, description_translations, is_active) values (${typeId}, ${s.json({ en: name })}, '{}', true)`;
    }
    for (const [defId, mode] of [[ids.defMain, 'default_slot'], [ids.defAddon, 'default_slot'], [ids.defOther, 'default_slot']]) {
      await s`insert into category.service_definitions (id, name_translations, description_translations, category_id, duration_minutes, pricing_model, is_active, currency, value, booking_ui_mode)
              values (${defId}, '{"en":"Def"}', '{}', ${ids.category}, 90, 'fixed', true, 'USD', 1, ${mode})`;
    }
    await s`insert into category.service_definition_addon_provider_types (service_definition_id, provider_type_id, is_required, display_order) values (${ids.defMain}, ${ids.typeAddon}, false, 1)`;
    for (const [providerId, typeId, name] of [[ids.providerMain, ids.typeMain, 'Main clinic'], [ids.providerAddon, ids.typeAddon, 'Easy Transfer'], [ids.providerAddon2, ids.typeAddon, 'Other Transfer'], [ids.providerOther, ids.typeUnlinked, 'Pharmacy']]) {
      await s`insert into category.service_providers (id, provider_type_id, name_translations, description_translations, is_active, city, country, email, phone_number_country_code, phone_number)
              values (${providerId}, ${typeId}, ${s.json({ en: name })}, '{}', true, 'Tehran', 'Iran', 'it@example.com', '+98', '9120000000')`;
    }
    const services: Array<[string, string, string, number]> = [
      [ids.serviceMain, ids.providerMain, ids.defMain, 100],
      [ids.serviceAddon, ids.providerAddon, ids.defAddon, 30],
      [ids.serviceAddon2, ids.providerAddon2, ids.defAddon, 45],
      [ids.serviceOther, ids.providerOther, ids.defOther, 5],
    ];
    for (const [serviceId, providerId, defId, value] of services) {
      await s`insert into category.provider_services (id, service_provider_id, service_definition_id, display_name_translations, description_translations, is_active, currency, value, create_date)
              values (${serviceId}, ${providerId}, ${defId}, ${s.json({ en: `Service ${value}` })}, '{}', true, 'USD', ${value}, now())`;
    }
    for (const [draftId, userId] of [[ids.draft, ids.user], [ids.otherDraft, ids.otherUser]]) {
      await s`insert into booking.booking_drafts (id, user_id, provider_id, service_id, current_step, status, currency, use_lsevin)
              values (${draftId}, ${userId}, ${ids.providerMain}, ${ids.serviceMain}, 3, 'Draft', 'USD', true)`;
    }
    repo = await import('./repository');
  });

  afterAll(async () => {
    if (!sql) return;
    await sql`delete from booking.booking_draft_child_bookings where parent_draft_id in (${ids.draft}, ${ids.otherDraft})`;
    await sql`delete from booking.booking_drafts where id in (${ids.draft}, ${ids.otherDraft})`;
    await sql`delete from category.provider_services where id in (${ids.serviceMain}, ${ids.serviceAddon}, ${ids.serviceAddon2}, ${ids.serviceOther})`;
    await sql`delete from category.service_providers where id in (${ids.providerMain}, ${ids.providerAddon}, ${ids.providerAddon2}, ${ids.providerOther})`;
    await sql`delete from category.service_definition_addon_provider_types where service_definition_id = ${ids.defMain}`;
    await sql`delete from category.service_definitions where id in (${ids.defMain}, ${ids.defAddon}, ${ids.defOther})`;
    await sql`delete from category.provider_types where id in (${ids.typeMain}, ${ids.typeAddon}, ${ids.typeUnlinked})`;
    await sql`delete from category.categories where id = ${ids.category}`;
    await sql.end({ timeout: 5 });
  });

  const transfer = (over: Record<string, unknown> = {}) => ({
    providerTypeId: ids.typeAddon, providerId: ids.providerAddon, serviceId: ids.serviceAddon,
    bookingUiMode: 'default_slot' as const, requiresSpecialist: false,
    selectedDate: '2026-11-03', selectedDateFrom: '2026-11-03', selectedDateTo: '2026-11-03',
    selectedTime: '15:00', selectedTimeFrom: '15:00', selectedTimeTo: '16:30', adults: 2, ...over,
  });

  let inbound = '';
  let outbound = '';

  it('keeps two add-ons of the same provider type in one draft (airport in, airport out)', async () => {
    inbound = (await repo.saveChildDraft(ids.user, ids.draft, transfer())).id;
    outbound = (await repo.saveChildDraft(ids.user, ids.draft, transfer({ selectedDate: '2026-11-07', selectedDateFrom: '2026-11-07', selectedDateTo: '2026-11-07', selectedTimeFrom: '12:00', selectedTimeTo: '13:30' }))).id;
    expect(inbound).not.toBe(outbound);
    const draft = await repo.getActiveDraft(ids.user, ids.draft);
    expect(draft?.childBookings).toHaveLength(2);
    const first = draft!.childBookings.find((child) => child.id === inbound)!;
    expect(first.providerNameTranslations).toEqual({ en: 'Easy Transfer' });
    expect(first.serviceNameTranslations).toEqual({ en: 'Service 30' });
    expect(first.durationMinutes).toBe(90);
  });

  it('prices from the listing, never from the client', async () => {
    const saved = await repo.saveChildDraft(ids.user, ids.draft, { ...transfer(), subtotalAmount: 1, currency: 'XXX' } as any);
    const [row] = await sql!`select subtotal_amount::float as amount, currency from booking.booking_draft_child_bookings where id = ${saved.id}`;
    expect(row).toEqual({ amount: 30, currency: 'USD' });
    await repo.deleteChildDraft(ids.user, ids.draft, saved.id);
  });

  it('updates a saved add-on in place by its id', async () => {
    await repo.saveChildDraft(ids.user, ids.draft, transfer({ id: inbound, providerId: ids.providerAddon2, serviceId: ids.serviceAddon2, selectedTimeFrom: '17:00', selectedTimeTo: '18:00' }));
    const [{ count }] = await sql!`select count(*)::int as count from booking.booking_draft_child_bookings where parent_draft_id = ${ids.draft}`;
    expect(count).toBe(2);
    const [row] = await sql!`select provider_id::text, selected_time_from::text, subtotal_amount::float as amount from booking.booking_draft_child_bookings where id = ${inbound}`;
    expect(row).toEqual({ provider_id: ids.providerAddon2, selected_time_from: '17:00:00', amount: 45 });
  });

  it('rejects provider types the admin did not link to the main service', async () => {
    await expect(repo.saveChildDraft(ids.user, ids.draft, transfer({ providerTypeId: ids.typeUnlinked, providerId: ids.providerOther, serviceId: ids.serviceOther })))
      .rejects.toMatchObject({ code: 'ADDON_NOT_ALLOWED' });
  });

  it('rejects a service that does not belong to the chosen provider', async () => {
    await expect(repo.saveChildDraft(ids.user, ids.draft, transfer({ serviceId: ids.serviceAddon2 })))
      .rejects.toMatchObject({ code: 'INVALID_SELECTION' });
  });

  it('cannot touch another customer\'s draft or rows', async () => {
    await expect(repo.saveChildDraft(ids.otherUser, ids.draft, transfer())).rejects.toThrow('BOOKING_DRAFT_NOT_EDITABLE');
    await expect(repo.deleteChildDraft(ids.otherUser, ids.draft, inbound)).rejects.toThrow('BOOKING_DRAFT_NOT_EDITABLE');
    // A row id from my draft, sent against the other customer's own draft, is not found there.
    await expect(repo.saveChildDraft(ids.otherUser, ids.otherDraft, transfer({ id: inbound }))).rejects.toMatchObject({ code: 'CHILD_NOT_FOUND' });
    const [row] = await sql!`select parent_draft_id::text from booking.booking_draft_child_bookings where id = ${inbound}`;
    expect(row.parent_draft_id).toBe(ids.draft);
  });

  it('removes one add-on and leaves the other', async () => {
    await repo.deleteChildDraft(ids.user, ids.draft, outbound);
    await expect(repo.deleteChildDraft(ids.user, ids.draft, outbound)).rejects.toMatchObject({ code: 'CHILD_NOT_FOUND' });
    const draft = await repo.getActiveDraft(ids.user, ids.draft);
    expect(draft?.childBookings.map((child) => child.id)).toEqual([inbound]);
  });
});
