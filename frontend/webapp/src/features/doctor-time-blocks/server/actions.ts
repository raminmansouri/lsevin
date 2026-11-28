"use server";

import { getSpecialistSlotGridFromDb } from "@/features/booking-pro/server/booking-availability.repository";
import { assertAdmin } from "@/lib/auth/admin-guard";

import { expandDates, todayIso } from "../lib/ranges";
import {
  BlockRangeSchema,
  DeleteBlockGroupSchema,
  DoctorDaySchema,
  DoctorIdSchema,
  DoctorSearchSchema,
  SlotToggleSchema,
} from "../schemas";
import {
  TIME_BLOCKS_RESOURCE,
  type ActionResult,
  type BlockGroup,
  type ConflictingBooking,
  type DayView,
  type DoctorOption,
  type DoctorServiceOption,
} from "../types";
import {
  createBlocks,
  deleteBlockRules,
  findConflictingBookings,
  listDayBlocks,
  listDoctorServices,
  listUpcomingBlockGroups,
  searchDoctors,
  unblockRange,
} from "./repository";

/*
 * Every action re-checks access (an action id is callable without its page) and validates its
 * input. Bad input comes back as `invalid_input`; an unexpected failure is logged and comes back
 * as `unexpected`, never dressed up as a validation problem. A refusal throws (assertAdmin).
 */

const SUPPORTED_LOCALES = new Set(["fa-IR", "en-US", "ar-SA", "tr-TR", "de-DE", "fr-FR", "es-ES", "ku-KU"]);
const dbLocale = (locale: unknown) => {
  const raw = String(locale ?? "").trim();
  if (SUPPORTED_LOCALES.has(raw)) return raw;
  return raw.toLowerCase().startsWith("en") ? "en-US" : "fa-IR";
};

async function run<T>(label: string, fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[doctor-time-blocks] ${label} failed`, error instanceof Error ? error.message : error);
    return { ok: false, error: "unexpected" };
  }
}

export async function searchDoctorsAction(input: { q: string; locale: string }): Promise<ActionResult<DoctorOption[]>> {
  await assertAdmin(TIME_BLOCKS_RESOURCE, "manage");
  const parsed = DoctorSearchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  return run("search doctors", async () => ({ ok: true, data: await searchDoctors(parsed.data.q, dbLocale(input.locale)) }));
}

export async function loadDoctorAction(input: {
  staffId: string;
  locale: string;
}): Promise<ActionResult<{ services: DoctorServiceOption[]; groups: BlockGroup[]; today: string }>> {
  await assertAdmin(TIME_BLOCKS_RESOURCE, "manage");
  const parsed = DoctorIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  return run("load doctor", async () => {
    const today = todayIso();
    const [services, groups] = await Promise.all([
      listDoctorServices(parsed.data.staffId, dbLocale(input.locale)),
      listUpcomingBlockGroups(parsed.data.staffId, today),
    ]);
    return { ok: true, data: { services, groups, today } };
  });
}

export async function loadDoctorDayAction(input: {
  staffId: string;
  providerId: string;
  serviceId: string;
  date: string;
}): Promise<ActionResult<DayView>> {
  await assertAdmin(TIME_BLOCKS_RESOURCE, "manage");
  const parsed = DoctorDaySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  const { staffId, providerId, serviceId, date } = parsed.data;
  return run("load day", async () => {
    const [slots, blocks] = await Promise.all([
      getSpecialistSlotGridFromDb({ selectedDate: date, providerId, serviceId, specialistId: staffId }),
      listDayBlocks(staffId, date),
    ]);
    return { ok: true, data: { date, slots, blocks } };
  });
}

/** Blocks or unblocks exactly one slot of the grid. */
export async function toggleSlotAction(input: {
  staffId: string;
  providerId: string;
  serviceId: string;
  date: string;
  start: string;
  end: string;
  block: boolean;
}): Promise<ActionResult<{ recurringBlock: boolean; conflicts: ConflictingBooking[] }>> {
  const ctx = await assertAdmin(TIME_BLOCKS_RESOURCE, "manage");
  const parsed = SlotToggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  const { staffId, date, start, end } = parsed.data;
  if (date < todayIso()) return { ok: false, error: "past" };
  return run("toggle slot", async () => {
    if (input.block) {
      await createBlocks({ staffId, dates: [date], startsAt: start, endsAt: end, reason: null, createdBy: ctx.userId ?? null });
      const conflicts = await findConflictingBookings({ staffId, dates: [date], startsAt: start, endsAt: end });
      return { ok: true, data: { recurringBlock: false, conflicts } };
    }
    const outcome = await unblockRange({ staffId, date, start, end });
    return { ok: true, data: { recurringBlock: outcome.recurringBlock, conflicts: [] } };
  });
}

export async function blockRangeAction(input: {
  staffId: string;
  fromDate: string;
  toDate: string;
  wholeDay: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  reason?: string | null;
}): Promise<ActionResult<{ days: number; conflicts: ConflictingBooking[] }>> {
  const ctx = await assertAdmin(TIME_BLOCKS_RESOURCE, "manage");
  const parsed = BlockRangeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  const v = parsed.data;
  if (v.toDate < todayIso()) return { ok: false, error: "past" };
  // Days already gone are skipped; a range that starts in the past still blocks from today.
  const dates = expandDates(v.fromDate < todayIso() ? todayIso() : v.fromDate, v.toDate);
  const startsAt = v.wholeDay ? null : (v.startsAt ?? null);
  const endsAt = v.wholeDay ? null : (v.endsAt ?? null);
  return run("block range", async () => {
    await createBlocks({ staffId: v.staffId, dates, startsAt, endsAt, reason: v.reason || null, createdBy: ctx.userId ?? null });
    const conflicts = await findConflictingBookings({ staffId: v.staffId, dates, startsAt, endsAt });
    return { ok: true, data: { days: dates.length, conflicts } };
  });
}

export async function deleteBlockGroupAction(input: { staffId: string; ruleIds: string[] }): Promise<ActionResult<{ deleted: number }>> {
  await assertAdmin(TIME_BLOCKS_RESOURCE, "manage");
  const parsed = DeleteBlockGroupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  return run("delete block group", async () => ({
    ok: true,
    data: { deleted: await deleteBlockRules(parsed.data.staffId, parsed.data.ruleIds) },
  }));
}
