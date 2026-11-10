"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod/v4";

import type { BookingSource } from "../patient-booking-types";
import type { ConsultationActionResult, ConsultationPackageOption } from "../types";
import { loadOfferContext, providerDoctors, staffDoctors, summarizePackages } from "./doctor-offers";
import { getProviderService } from "./provider-consultation-repository";

/** Where the "consult before treatment" button takes the patient when the provider has paid video consultation. */
export type ProviderVideoOffer = {
  /** The booking page of the provider's only doctor, or the provider's doctors to pick from. */
  href: string;
  /** Lengths on offer with their lowest price, shortest first. */
  packages: ConsultationPackageOption[];
};

// z.guid(): provider, staff and service ids in the LSevin database are not all RFC 4122 v1-5 UUIDs,
// which z.uuid() rejects (and the button then silently fell back to the free form).
const OfferSchema = z.object({
  providerId: z.guid().nullish(),
  serviceId: z.guid().nullish(),
  staffId: z.guid().nullish(),
  source: z.enum(["provider", "service", "specialist", "booking"]),
});

/**
 * Whether this provider (or the provider of this service) gives paid video consultations, and
 * where the button should go. `null` means it does not, and the free consultation form stays.
 */
export async function getProviderVideoOfferAction(input: {
  providerId?: string | null;
  serviceId?: string | null;
  staffId?: string | null;
  source: Exclude<BookingSource, "home_card" | "doctors_page">;
}): Promise<ConsultationActionResult<ProviderVideoOffer | null>> {
  const parsed = OfferSchema.safeParse(input);
  if (!parsed.success) return { ok: true, data: null };
  const { staffId, source } = parsed.data;
  let { providerId, serviceId } = parsed.data;

  try {
    const locale = await getLocale();
    const ctx = await loadOfferContext(locale);
    if (!ctx.enabled || ctx.portal.size === 0) return { ok: true, data: null };

    if (serviceId) {
      const service = await getProviderService(serviceId, locale);
      if (!service || (providerId && service.providerId !== providerId)) serviceId = null;
      else providerId = service.providerId;
    }
    // A specialist's own consultation counts wherever it was set up (their own page or a clinic's).
    const own = staffId ? await staffDoctors(ctx, staffId) : [];
    if (own.length) providerId = ctx.portal.get(own[0].id)?.providerId ?? providerId;
    if (!providerId) return { ok: true, data: null };

    const doctors = own.length ? own : await providerDoctors(ctx, providerId, staffId);
    if (doctors.length === 0) return { ok: true, data: null };

    const query = new URLSearchParams({ source });
    if (serviceId) query.set("service", serviceId);
    let href: string;
    if (doctors.length === 1) {
      href = `/n/app/mobile/consultation/doctors/${doctors[0].id}/book?${query}`;
    } else {
      query.set("provider", providerId);
      if (staffId) query.set("staff", staffId);
      href = `/n/app/mobile/consultation/doctors?${query}`;
    }
    return { ok: true, data: { href, packages: summarizePackages(ctx, doctors) } };
  } catch (error) {
    // The button falls back to the free form; it must never break the page it sits on.
    console.error("[consultation] provider video offer failed", error);
    return { ok: true, data: null };
  }
}
