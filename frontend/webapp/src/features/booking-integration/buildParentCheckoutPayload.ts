export interface ParentChildDraftSelection {
  providerTypeId: string;
  providerId?: string;
  serviceId?: string;
  specialistId?: string;
  bookingUiMode: "default_slot" | "date_range" | "custom_form";
  subtotalAmount: number;
  selectedDate?: string;
  selectedDateFrom?: string;
  selectedDateTo?: string;
  selectedTime?: string;
  selectedTimeFrom?: string;
  selectedTimeTo?: string;
  adults?: number;
  children?: number;
  infants?: number;
  rooms?: number;
  formSubmissionId?: string;
  metadata?: Record<string, unknown>;
}

export interface BuildParentCheckoutPayloadInput {
  draftId: string;
  providerId: string;
  serviceId: string;
  specialistId?: string;
  paymentMethod: string;
  currency: string;
  selectedDate?: string;
  selectedDateFrom?: string;
  selectedDateTo?: string;
  selectedTime?: string;
  selectedTimeFrom?: string;
  selectedTimeTo?: string;
  addons: Array<Record<string, unknown>>;
  uploadedFiles: Array<Record<string, unknown>>;
  childBookings: ParentChildDraftSelection[];
}

export function buildParentCheckoutPayload(input: BuildParentCheckoutPayloadInput) {
  const childrenTotal = input.childBookings.reduce(
    (sum, child) => sum + Number(child.subtotalAmount || 0),
    0
  );

  return {
    ...input,
    childBookings: input.childBookings,
    recalculationStrategy: "final_parent_checkout",
    childBookingsSubtotal: childrenTotal,
  };
}
