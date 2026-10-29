import "server-only";

import { z } from "zod";

import sql from "@/config/database/db";
import { getServicePageByIdFromDb } from "@/features/service-providers/server/service-page.repository";

export const GET_SERVICE_DETAILS_DESCRIPTION =
  "Get full details of one LSevin service (a treatment at a specific clinic), by the service id from search_services results (type: service). " +
  "Returns price in the clinic's currency, duration, recovery time, anesthesia, whether a stay is needed, success rate, " +
  "what is included, the treatment steps, FAQs, the doctors who perform it (with consultation fee), other clinics offering it, " +
  "and the clinic's city and coordinates. Use it when the user is interested in a specific service, asks about price, recovery, " +
  "steps or doctors, or when planning a stay/transfer around a treatment. Never invent or convert prices.";

export const getServiceDetailsInputSchema = z.object({
  serviceId: z.string().uuid().describe("The service id from a search_services result whose type is 'service'."),
});

export type GetServiceDetailsInput = z.infer<typeof getServiceDetailsInputSchema>;

/** Rich-text fields may hold Lexical JSON; keep only the readable text, shortened. */
function plainText(value: string | null | undefined, max = 600): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  let text = raw;
  if (raw.startsWith("{")) {
    const parts = [...raw.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g)].map((match) => {
      try {
        return JSON.parse(`"${match[1]}"`) as string;
      } catch {
        return match[1];
      }
    });
    text = parts.join(" ");
  }
  text = text.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export async function getServiceDetails(input: GetServiceDetailsInput, storedLocale: string) {
  const page = await getServicePageByIdFromDb({ serviceId: input.serviceId, locale: storedLocale });
  if (!page) return { found: false as const };

  const { service } = page;

  // Clinic coordinates, so the assistant can suggest hotels and transfers near the clinic.
  const [coords] = await sql<{ lat: number | null; lng: number | null }[]>`
    select latitude::float8 as lat, longitude::float8 as lng
    from category.service_providers
    where id = ${service.clinicId}::uuid
  `.catch(() => []);

  return {
    found: true as const,
    id: service.id,
    name: service.name,
    category: service.categoryName,
    description: plainText(service.definitionDescription),
    clinic: { id: service.clinicId, name: service.clinic, city: service.city, country: service.country, location: service.location },
    coordinates: coords?.lat != null && coords?.lng != null ? { latitude: coords.lat, longitude: coords.lng } : null,
    price: service.price,
    originalPrice: service.originalPrice,
    currency: service.currency,
    duration: service.duration,
    recovery: service.recovery,
    anesthesia: service.anesthesia,
    stayRequired: service.stayRequired,
    successRate: service.successRate,
    satisfaction: service.satisfaction,
    rating: service.rating,
    reviews: service.reviews,
    requiresSpecialist: service.requiresSpecialist,
    included: page.included.slice(0, 10),
    steps: page.process.slice(0, 8).map((step) => ({ step: step.step, title: step.title, duration: step.duration })),
    faqs: page.faqs.slice(0, 5).map((faq) => ({ q: faq.q, a: plainText(faq.a, 300) })),
    doctors: page.specialists.slice(0, 5).map((doctor) => ({
      id: doctor.staffId,
      name: doctor.name,
      title: doctor.title,
      specialty: doctor.specialty,
      experienceYears: doctor.experienceYears,
      languages: doctor.languages,
      consultationFee: doctor.consultationFee,
      consultationCurrency: doctor.consultationCurrency,
      href: `/n/app/mobile/specialist/${doctor.staffId}`,
    })),
    otherClinics: page.providers.slice(0, 5).map((offer) => ({
      id: offer.id,
      clinic: offer.provider,
      rating: offer.rating,
      reviews: offer.reviewCount,
    })),
    href: `/n/app/mobile/service/${service.id}`,
  };
}