import type { BookingManagementCopy } from "./i18n/copy";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = new Set(["Confirmed", "InProgress", "Completed", "Cancelled", "NoShow", "ProviderReview"]);

export function bookingUuid(copy: BookingManagementCopy, value: string, required = true) {
  const normalized = String(value || "").trim();
  if (!normalized && !required) return "";
  if (!UUID.test(normalized)) throw new Error(copy.invalidIdentifier);
  return normalized;
}

export function bookingNote(copy: BookingManagementCopy, value: string, required = false) {
  const normalized = String(value || "").trim();
  if (required && !normalized) throw new Error(copy.noteRequired);
  if (normalized.length > 2000) throw new Error(copy.noteTooLong);
  return normalized;
}

export function bookingStatus(copy: BookingManagementCopy, value: string) {
  const normalized = String(value || "").trim();
  if (!STATUSES.has(normalized)) throw new Error(copy.invalidStatus);
  return normalized;
}
