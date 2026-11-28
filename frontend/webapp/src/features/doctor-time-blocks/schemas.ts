import { z } from "zod";

import { MAX_RANGE_DAYS, expandDates, isIsoDate, timeToMinutes } from "./lib/ranges";

const uuid = z.string().uuid();
const isoDate = z.string().refine((value) => isIsoDate(value), "invalid date");
const time = z.string().refine((value) => timeToMinutes(value) !== null, "invalid time");

export const DoctorSearchSchema = z.object({ q: z.string().max(100).default("") });

export const DoctorDaySchema = z.object({
  staffId: uuid,
  providerId: uuid,
  serviceId: uuid,
  date: isoDate,
});

export const SlotToggleSchema = DoctorDaySchema.extend({
  start: time,
  end: time,
}).refine((v) => (timeToMinutes(v.start) ?? 0) < (timeToMinutes(v.end) ?? 0), { message: "end before start", path: ["end"] });

export const BlockRangeSchema = z
  .object({
    staffId: uuid,
    fromDate: isoDate,
    toDate: isoDate,
    wholeDay: z.boolean(),
    startsAt: time.nullable().optional(),
    endsAt: time.nullable().optional(),
    reason: z.string().trim().max(300).optional().nullable(),
  })
  .refine((v) => v.fromDate <= v.toDate, { message: "toDate before fromDate", path: ["toDate"] })
  .refine((v) => expandDates(v.fromDate, v.toDate).length <= MAX_RANGE_DAYS, { message: "range too long", path: ["toDate"] })
  .refine(
    (v) =>
      v.wholeDay ||
      (v.startsAt != null && v.endsAt != null && (timeToMinutes(v.startsAt) ?? 0) < (timeToMinutes(v.endsAt) ?? 0)),
    { message: "times required", path: ["endsAt"] }
  );

export const DeleteBlockGroupSchema = z.object({
  staffId: uuid,
  ruleIds: z.array(uuid).min(1).max(400),
});

export const DoctorIdSchema = z.object({ staffId: uuid });

export type BlockRangeInput = z.infer<typeof BlockRangeSchema>;
export type SlotToggleInput = z.infer<typeof SlotToggleSchema>;
export type DoctorDayInput = z.infer<typeof DoctorDaySchema>;
