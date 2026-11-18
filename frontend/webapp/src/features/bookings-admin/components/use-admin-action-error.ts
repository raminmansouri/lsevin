"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import type { AdminActionErrorCode } from "../actions/action-result";

/** Specific reasons the server reports, mapped to their message keys. */
const REASON_KEYS: Record<string, string> = {
  SERVICE_NOT_OF_PROVIDER: "bookingAdminErrorServiceNotOfProvider",
  ROOM_NOT_OF_HOTEL: "bookingAdminErrorRoomNotOfHotel",
  HOTEL_NOT_FOUND: "bookingAdminErrorHotelNotFound",
  ROUTE_NOT_FOUND: "bookingAdminErrorRouteNotFound",
  HOTEL_HAS_NO_PROVIDER_TYPE: "bookingAdminErrorProviderHasNoType",
  ROUTE_PROVIDER_HAS_NO_TYPE: "bookingAdminErrorProviderHasNoType",
};

const CODE_KEYS: Record<AdminActionErrorCode, string> = {
  VALIDATION: "bookingAdminErrorValidation",
  UNAUTHENTICATED: "bookingAdminErrorUnauthenticated",
  FORBIDDEN: "bookingAdminErrorForbidden",
  NOT_FOUND: "bookingAdminErrorNotFound",
  CONFLICT: "bookingAdminErrorConflict",
  INFRASTRUCTURE: "bookingAdminErrorServer",
  UNEXPECTED: "bookingAdminErrorServer",
};

/** Field-level messages the schemas emit. */
export const FIELD_MESSAGE_KEYS: Record<string, string> = {
  END_BEFORE_START: "bookingAdminErrorEndBeforeStart",
  CHECKOUT_BEFORE_CHECKIN: "bookingAdminErrorCheckoutBeforeCheckin",
};

export function useAdminActionErrorMessage() {
  const tAdmin = useTranslations("AdminGenerated");
  return useCallback(
    (error: { code: AdminActionErrorCode; reason?: string }) => {
      const key = (error.reason && REASON_KEYS[error.reason]) || CODE_KEYS[error.code] || "bookingAdminErrorServer";
      return tAdmin(key);
    },
    [tAdmin],
  );
}

export function useFieldMessage() {
  const tAdmin = useTranslations("AdminGenerated");
  return useCallback(
    (message?: string) => (message && FIELD_MESSAGE_KEYS[message] ? tAdmin(FIELD_MESSAGE_KEYS[message]) : message),
    [tAdmin],
  );
}
