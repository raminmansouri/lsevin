"use server";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireProviderPermission } from "@core/auth/permissions";
import { numberFromForm, stringFromForm } from "@core/lib/forms";
import { invokeModuleCapability } from "@core/modules/moduleBus";
import { portalLocaleHeader } from "@core/i18n/config";
import { requireReferenceValue } from "@core/reference-data/repository";
import { getBookingForInvoice, markBookingInvoiceIssued, updateBookingByProvider } from "./repository";

export async function updateBookingByProviderAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageBookings");
  await updateBookingByProvider({
    providerId,
    bookingId: stringFromForm(formData, "bookingId"),
    bookingStatus: stringFromForm(formData, "bookingStatus", "Confirmed"),
    providerNotes: stringFromForm(formData, "providerNotes"),
  });
  revalidatePath(`/providers/${providerId}/bookings`);
}


export async function issueBookingPaymentInvoiceAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  const bookingId = stringFromForm(formData, "bookingId");
  await requireProviderPermission(user.id, providerId, "manageFinance");
  const booking = await getBookingForInvoice(providerId, bookingId);
  if (!booking) throw new Error("Booking was not found for this provider.");

  const currencyCode = (await requireReferenceValue({ type: "currency", value: stringFromForm(formData, "currencyCode", booking.currencyCode ?? "IRR"), label: "Currency" })).toUpperCase();
  const amount = numberFromForm(formData, "amount", Number(booking.totalAmount ?? 0));
  const response = await invokeModuleCapability({
    capability: "billing.issue_invoice",
    requestedByUserId: user.id,
    source: { moduleCode: "bookings", entityType: "booking", entityId: booking.id },
    payload: {
      invoiceType: "standard",
      billTo: {
        moduleCode: "bookings",
        entityType: booking.userId ? "customer" : "guest-customer",
        entityId: booking.userId ?? "00000000-0000-0000-0000-000000000000",
        displayName: "Booking customer",
      },
      sourceDocument: { moduleCode: "bookings", entityType: "booking", entityId: booking.id },
      title: `Booking invoice - ${booking.serviceName}`,
      currencyCode,
      lines: [
        {
          description: booking.serviceName,
          quantity: 1,
          unitAmount: amount,
          currencyCode,
          metadata: { providerId, bookingId: booking.id },
        },
      ],
      locale: portalLocaleHeader(stringFromForm(formData, "locale", "fa-IR")),
      metadata: { integration: "bookings.booking-payment", providerId, bookingId: booking.id },
    },
  });

  if (!response.ok || !response.data) throw new Error(response.message ?? "PaymentBilling did not issue booking invoice.");
  const invoice = response.data as { invoiceId: string; invoiceNumber: string };
  await markBookingInvoiceIssued(providerId, booking.id, invoice.invoiceId, invoice.invoiceNumber);
  revalidatePath(`/providers/${providerId}/bookings`);
  revalidatePath(`/providers/${providerId}/billing`);
}
