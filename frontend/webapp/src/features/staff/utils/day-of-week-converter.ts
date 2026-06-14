import { DayOfWeek } from "../types";

/**
 * Converts frontend DayOfWeek enum (string) to .NET DayOfWeek enum (integer)
 * .NET mapping: Sunday = 0, Monday = 1, Tuesday = 2, Wednesday = 3, Thursday = 4, Friday = 5, Saturday = 6
 */
export function convertDayOfWeekToInteger(dayOfWeek: DayOfWeek): number {
  const dayMapping: Record<DayOfWeek, number> = {
    [DayOfWeek.Sunday]: 0,
    [DayOfWeek.Monday]: 1,
    [DayOfWeek.Tuesday]: 2,
    [DayOfWeek.Wednesday]: 3,
    [DayOfWeek.Thursday]: 4,
    [DayOfWeek.Friday]: 5,
    [DayOfWeek.Saturday]: 6,
  };

  return dayMapping[dayOfWeek];
}

/**
 * Converts .NET DayOfWeek enum (integer) to frontend DayOfWeek enum (string)
 */
export function convertIntegerToDayOfWeek(dayOfWeekNumber: number): DayOfWeek {
  const dayMapping: Record<number, DayOfWeek> = {
    0: DayOfWeek.Sunday,
    1: DayOfWeek.Monday,
    2: DayOfWeek.Tuesday,
    3: DayOfWeek.Wednesday,
    4: DayOfWeek.Thursday,
    5: DayOfWeek.Friday,
    6: DayOfWeek.Saturday,
  };

  return dayMapping[dayOfWeekNumber] || DayOfWeek.Monday;
}
