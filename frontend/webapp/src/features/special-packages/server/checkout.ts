import "server-only";

import sql from "@/config/database/db";

export type ReserveSpecialPackageInput = {
    packageId: string;
    userId: string;
};

/**
 * Books a special package directly — no provider/service/time/specialist
 * picker, because the package itself already fixes all of that. Mirrors
 * checkoutDraft's booking.bookings insert shape (see booking-pro/server/
 * repository.ts) but every scheduling column is left out entirely: a package
 * has no slot to conflict over, so ex_bookings_no_overlap_per_specialist
 * never applies here (that constraint only fires when specialist_id/date/
 * time are all set).
 *
 * Deliberately does NOT create a booking.payments row or touch payment terms
 * — that's exactly what createBookingPaymentIntent (called via
 * /api/booking-pro/payments/create-intent) already does for every other
 * booking in the app. Reusing it here means package checkout gets the same
 * tested wallet/gateway logic for free instead of a second, divergent copy.
 */
export async function reserveSpecialPackage(
    input: ReserveSpecialPackageInput
): Promise<{ bookingId: string; currency: string; amount: number }> {
    const [pkg] = await sql<{
        id: string;
        providerId: string | null;
        providerServiceId: string | null;
        priceAmount: number | null;
        currencyCode: string | null;
        title: string;
    }[]>`
        select
            sp.id::text,
            sp.provider_id::text as "providerId",
            sp.provider_service_id::text as "providerServiceId",
            sp.price_amount as "priceAmount",
            sp.currency_code as "currencyCode",
            coalesce(sp.title_translations->>'fa-IR', sp.title_translations->>'en-US', 'Package') as title
        from marketing.special_packages sp
        where sp.id = ${input.packageId}::uuid
      and sp.is_active = true
    limit 1
    `;

    if (!pkg) throw new Error("Package not found.");
    if (!pkg.providerServiceId) throw new Error("PACKAGE_NOT_BOOKABLE_YET");
    if (!pkg.priceAmount || !pkg.currencyCode) throw new Error("Package has no price configured.");

    const [service] = await sql<{ serviceProviderId: string }[]>`
        select service_provider_id::text as "serviceProviderId"
        from category.provider_services
        where id = ${pkg.providerServiceId}::uuid
      and is_active = true
    limit 1
    `;
    if (!service) throw new Error("The service linked to this package is no longer available.");

    const [booking] = await sql<{ id: string }[]>`
    insert into booking.bookings (
      id, provider_id, service_id,
      add_ons, upload_files, additional_services,
      payment_status, booking_status, user_id,
      currency_code, total_amount, paid_amount,
      booking_ui_mode, metadata,
      source_currency_code, display_currency_code, payment_currency_code, settlement_currency_code,
      source_subtotal_amount, source_addons_amount, source_total_amount,
      display_subtotal_amount, display_addons_amount, display_total_amount
    ) values (
      public.uuid_generate_v4(),
      ${service.serviceProviderId}::uuid,
      ${pkg.providerServiceId}::uuid,
      '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
      'Pending',
      'Pending',
      ${input.userId}::uuid,
      ${pkg.currencyCode}, ${pkg.priceAmount}, 0,
      'package',
      ${sql.json({ specialPackageId: pkg.id, specialPackageTitle: pkg.title })},
      ${pkg.currencyCode}, ${pkg.currencyCode}, ${pkg.currencyCode}, ${pkg.currencyCode},
      ${pkg.priceAmount}, 0, ${pkg.priceAmount},
      ${pkg.priceAmount}, 0, ${pkg.priceAmount}
    )
    returning id
  `;

    return { bookingId: booking.id, currency: pkg.currencyCode, amount: pkg.priceAmount };
}