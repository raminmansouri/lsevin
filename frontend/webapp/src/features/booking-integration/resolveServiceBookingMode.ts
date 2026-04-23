import type { BookingUiMode } from "../form-builder/types";

export interface ServiceBookingModeRecord {
  providerServiceId: string;
  serviceDefinitionId: string;
  requiresSpecialist: boolean;
  bookingUiMode: BookingUiMode;
  durationMinutes?: number | null;
  slotIntervalMinutes?: number | null;
}

export function resolveServiceBookingMode(service: Partial<ServiceBookingModeRecord>) {
  return {
    requiresSpecialist: service.requiresSpecialist ?? true,
    bookingUiMode: (service.bookingUiMode ?? "default_slot") as BookingUiMode,
    usesDefaultSlotUi: (service.bookingUiMode ?? "default_slot") === "default_slot",
    usesDateRangeUi: service.bookingUiMode === "date_range",
    usesCustomForm: service.bookingUiMode === "custom_form",
  };
}
