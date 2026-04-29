"use server";

import { getSpecialistPageFromDb } from "../../server/specialist-page.repository";

export async function getSpecialistPageAction(input: {
  specialistId: string;
  locale?: string | null;
  userId?: string | null;
  explicitCurrencyCode?: string | null;
  selectedCountryCode?: string | null;
  browserCountryCode?: string | null;
}) {
  return getSpecialistPageFromDb(input);
}
