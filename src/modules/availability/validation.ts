import type { AvailabilityCopy } from "./i18n/copy";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const RESOURCE_TYPES = new Set(["generic", "room", "bed", "seat", "table", "vehicle", "equipment", "unit"]);
const PROVIDER_TARGET_TYPES = new Set(["provider", "staff", "bookable_resource"]);

function requiredUuid(copy: AvailabilityCopy, value: string | undefined) {
  const normalized = String(value || "").trim();
  if (!UUID_PATTERN.test(normalized)) throw new Error(copy.invalidIdentifier);
  return normalized;
}

function optionalUuid(copy: AvailabilityCopy, value: string | undefined) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (!UUID_PATTERN.test(normalized)) throw new Error(copy.invalidIdentifier);
  return normalized;
}

function boundedText(copy: AvailabilityCopy, value: string | undefined, maxLength: number, message = copy.invalidResource) {
  const normalized = String(value || "").trim();
  if (normalized.length > maxLength) throw new Error(message);
  return normalized;
}

function validateTranslations(copy: AvailabilityCopy, values: Record<string, string>, maxLength: number, requireOne = false) {
  const entries = Object.entries(values || {}).map(([key, value]) => [key, String(value || "").trim()] as const);
  if (entries.some(([key, value]) => key.length > 20 || value.length > maxLength)) throw new Error(copy.invalidResource);
  if (requireOne && !entries.some(([, value]) => Boolean(value))) throw new Error(copy.invalidResource);
  return Object.fromEntries(entries.filter(([, value]) => Boolean(value)));
}

function validDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function timeMinutes(value: string) {
  const parts = value.split(":").map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  const seconds = parts[2] ?? 0;
  return hours * 60 + minutes + seconds / 60;
}

export function validateAvailabilityIdentifiers(copy: AvailabilityCopy, input: { providerId?: string; resourceId?: string; ruleId?: string; operatingHourId?: string; providerServiceId?: string; staffId?: string; targetId?: string }) {
  return {
    providerId: input.providerId === undefined ? "" : requiredUuid(copy, input.providerId),
    resourceId: optionalUuid(copy, input.resourceId),
    ruleId: optionalUuid(copy, input.ruleId),
    operatingHourId: optionalUuid(copy, input.operatingHourId),
    providerServiceId: optionalUuid(copy, input.providerServiceId),
    staffId: optionalUuid(copy, input.staffId),
    targetId: optionalUuid(copy, input.targetId),
  };
}

export function validateOperatingHourInput(copy: AvailabilityCopy, input: { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean; slotIntervalMinutes: number }) {
  const dayOfWeek = Number(input.dayOfWeek);
  const opensAt = boundedText(copy, input.opensAt, 8, copy.invalidOperatingHour);
  const closesAt = boundedText(copy, input.closesAt, 8, copy.invalidOperatingHour);
  const slotIntervalMinutes = Number(input.slotIntervalMinutes);
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) throw new Error(copy.invalidOperatingHour);
  if (!Number.isInteger(slotIntervalMinutes) || slotIntervalMinutes < 5 || slotIntervalMinutes > 1440) throw new Error(copy.invalidCapacity);
  if (!input.isClosed) {
    if (!TIME_PATTERN.test(opensAt) || !TIME_PATTERN.test(closesAt) || timeMinutes(opensAt) >= timeMinutes(closesAt)) throw new Error(copy.invalidOperatingHour);
  } else if ((opensAt && !TIME_PATTERN.test(opensAt)) || (closesAt && !TIME_PATTERN.test(closesAt))) {
    throw new Error(copy.invalidOperatingHour);
  }
  return { dayOfWeek, opensAt: input.isClosed ? "" : opensAt, closesAt: input.isClosed ? "" : closesAt, isClosed: Boolean(input.isClosed), slotIntervalMinutes };
}

export function validateBookableResourceInput(copy: AvailabilityCopy, input: { resourceType: string; code: string; nameTranslations: Record<string, string>; descriptionTranslations: Record<string, string>; totalCapacity: number; isActive: boolean }) {
  const resourceType = String(input.resourceType || "").trim();
  const totalCapacity = Number(input.totalCapacity);
  if (!RESOURCE_TYPES.has(resourceType)) throw new Error(copy.invalidResource);
  if (!Number.isInteger(totalCapacity) || totalCapacity < 1 || totalCapacity > 100000) throw new Error(copy.invalidCapacity);
  return {
    resourceType,
    code: boundedText(copy, input.code, 100),
    nameTranslations: validateTranslations(copy, input.nameTranslations, 200, true),
    descriptionTranslations: validateTranslations(copy, input.descriptionTranslations, 4000),
    totalCapacity,
    isActive: Boolean(input.isActive),
  };
}

export function validateAvailabilityRuleInput(copy: AvailabilityCopy, input: { targetType: string; dayOfWeek?: number; specificDate?: string; startsAt?: string; endsAt?: string; isAvailable: boolean; capacity?: number; slotIntervalMinutes?: number; isActive: boolean }) {
  const targetType = String(input.targetType || "").trim();
  if (!PROVIDER_TARGET_TYPES.has(targetType)) throw new Error(copy.targetRequired);
  const dayOfWeek = Number(input.dayOfWeek || 0);
  const specificDate = boundedText(copy, input.specificDate, 10, copy.invalidRuleSchedule);
  const hasDay = Number.isInteger(dayOfWeek) && dayOfWeek >= 1 && dayOfWeek <= 7;
  const hasDate = Boolean(specificDate);
  if (hasDay === hasDate || (hasDate && !validDate(specificDate))) throw new Error(copy.invalidRuleSchedule);

  const startsAt = boundedText(copy, input.startsAt, 8, copy.invalidRuleTime);
  const endsAt = boundedText(copy, input.endsAt, 8, copy.invalidRuleTime);
  if (Boolean(startsAt) !== Boolean(endsAt)) throw new Error(copy.invalidRuleTime);
  if (startsAt && (!TIME_PATTERN.test(startsAt) || !TIME_PATTERN.test(endsAt) || timeMinutes(startsAt) >= timeMinutes(endsAt))) throw new Error(copy.invalidRuleTime);

  const capacity = input.capacity ? Number(input.capacity) : undefined;
  const slotIntervalMinutes = input.slotIntervalMinutes ? Number(input.slotIntervalMinutes) : undefined;
  if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1 || capacity > 100000)) throw new Error(copy.invalidCapacity);
  if (slotIntervalMinutes !== undefined && (!Number.isInteger(slotIntervalMinutes) || slotIntervalMinutes < 5 || slotIntervalMinutes > 1440)) throw new Error(copy.invalidCapacity);

  return { targetType, dayOfWeek: hasDay ? dayOfWeek : undefined, specificDate: hasDate ? specificDate : "", startsAt, endsAt, isAvailable: Boolean(input.isAvailable), capacity, slotIntervalMinutes, isActive: Boolean(input.isActive) };
}

export function validateAdminReason(copy: AvailabilityCopy, reason: string, requiredMessage?: string) {
  const normalized = String(reason || "").trim();
  if (requiredMessage && !normalized) throw new Error(requiredMessage);
  if (normalized.length > 1000) throw new Error(copy.invalidResource);
  return normalized;
}
