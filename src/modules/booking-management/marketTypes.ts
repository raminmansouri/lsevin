export const BOOKING_MARKET_WINDOW_DAYS = 30;
export const BOOKING_ATTENTION_THRESHOLD_MINUTES = 120;

export type BookingAttentionItem = {
  bookingId: string;
  confirmationCode: string | null;
  bookingStatus: string;
  paymentStatus: string | null;
  createdAt: string;
  selectedDate: string | null;
  selectedTime: string | null;
  ageMinutes: number;
};

export type ProviderBookingResponsePulse = {
  windowDays: number;
  attentionThresholdMinutes: number;
  bookings30d: number;
  providerTouched30d: number;
  completed30d: number;
  cancelledOrNoShow30d: number;
  responseCoveragePercent: number;
  averageResponseProxyMinutes: number | null;
  awaitingProviderAction: number;
  overdueProviderAttention: number;
  attentionQueue: BookingAttentionItem[];
};
