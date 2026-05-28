export interface BookingListItem {
  id: string;
  bookingStatus: string | null;
  paymentStatus: string | null;
  paymentMethod: string;
  selectedDate: string | null;
  selectedTime: string | null;
  totalAmount: string | null;
  currencyCode: string | null;
  providerName: string | null;
  serviceName: string | null;
  specialistName: string | null;
  customerName: string | null;
  customerEmail: string | null;
  createDate: string;
}

export interface BookingDetail extends BookingListItem {
  providerId: string | null;
  serviceId: string | null;
  specialistId: string | null;
  userId: string | null;
  selectedTimeFrom: string | null;
  selectedTimeTo: string | null;
  selectedDateFrom: string | null;
  selectedDateTo: string | null;
  paidAmount: string | null;
  appliedCouponId?: string | null;
  providerNotes?: string | null;
  providerUpdatedAt?: string | null;
  bookingUiMode?: string | null;
  formSubmissionId?: string | null;
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  rooms?: number | null;
  metadata?: Record<string, unknown>;
  addOns: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
  childBookings: Array<Record<string, unknown>>;
}

export interface BookingFormValues {
  bookingId?: string;
  providerId: string;
  serviceId: string;
  specialistId?: string;
  userId?: string;
  selectedDate?: string;
  selectedTime?: string;
  selectedTimeFrom?: string;
  selectedTimeTo?: string;
  paymentMethod: string;
  bookingStatus: string;
  paymentStatus?: string;
  currencyCode?: string;
  totalAmount?: number;
  paidAmount?: number;
  providerNotes?: string;
  bookingUiMode?: string;
  adults?: number;
  children?: number;
  infants?: number;
  rooms?: number;
}
