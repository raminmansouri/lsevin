function dateTimeParts(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const get = (type: "year" | "month" | "day" | "hour" | "minute" | "second") => Number(parts.find((part) => part.type === type)?.value || 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

export function dateTimeInZone(value: string | Date, timeZone: string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return dateTimeParts(date, assertTimeZone(timeZone));
}

export function assertTimeZone(timeZone?: string | null) {
  const candidate = String(timeZone || "Asia/Tehran").trim();
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date(0));
    return candidate;
  } catch {
    return "Asia/Tehran";
  }
}

export function zonedLocalDateTimeToUtc(value: string, timeZone: string) {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute, second || 0);
  const zone = assertTimeZone(timeZone);
  let candidate = new Date(wallClockUtc);
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const actual = dateTimeParts(candidate, zone);
    const actualWallClockUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    candidate = new Date(candidate.getTime() + wallClockUtc - actualWallClockUtc);
  }
  const confirmed = dateTimeParts(candidate, zone);
  if (confirmed.year !== year || confirmed.month !== month || confirmed.day !== day || confirmed.hour !== hour || confirmed.minute !== minute) return null;
  return candidate.toISOString();
}

export function nextGregorianDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error("Expected Gregorian date in YYYY-MM-DD format.");
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + 1));
  return date.toISOString().slice(0, 10);
}

export function zonedDateRangeToUtc(from: string, to: string, timeZone: string) {
  const start = zonedLocalDateTimeToUtc(`${from}T00:00`, timeZone);
  const endExclusive = zonedLocalDateTimeToUtc(`${nextGregorianDate(to)}T00:00`, timeZone);
  if (!start || !endExclusive || new Date(start) >= new Date(endExclusive)) throw new Error("Invalid local date range.");
  return { start, endExclusive };
}
