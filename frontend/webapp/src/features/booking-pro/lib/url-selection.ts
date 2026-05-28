export type BookingUrlSelection = {
  providerId: string | null;
  serviceId: string | null;
  specialistId: string | null;
};

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function readUuid(searchParams: URLSearchParams, key: string) {
  const value = String(searchParams.get(key) || "").trim();
  return UUID_RE.test(value) ? value : null;
}

export function parseBookingUrlSelection(searchParams: URLSearchParams): BookingUrlSelection {
  return {
    providerId: readUuid(searchParams, "providerId"),
    serviceId: readUuid(searchParams, "serviceId"),
    specialistId: readUuid(searchParams, "specialistId"),
  };
}

export function buildBookingUrl(locale: string, selection: Partial<BookingUrlSelection>) {
  const params = new URLSearchParams();
  if (selection.providerId) params.set("providerId", selection.providerId);
  if (selection.serviceId) params.set("serviceId", selection.serviceId);
  if (selection.specialistId) params.set("specialistId", selection.specialistId);

  const query = params.toString();
  return `/${locale}/n/app/mobile/booking${query ? `?${query}` : ""}`;
}
