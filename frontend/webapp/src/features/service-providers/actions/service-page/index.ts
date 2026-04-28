'use server';

import { getUserId } from '@/lib/auth/session';

import { getServicePageByIdFromDb } from '../../server/service-page.repository';

async function getOptionalUserId() {
  try {
    return (await getUserId()) || null;
  } catch {
    return null;
  }
}

export async function getServicePageAction(input: {
  serviceId: string;
  locale?: string | null;
  preferredCurrencyCode?: string | null;
  selectedCountryCode?: string | null;
  browserCountryCode?: string | null;
}) {
  const userId = await getOptionalUserId();

  return getServicePageByIdFromDb({
    serviceId: input.serviceId,
    locale: input.locale,
    userId,
    preferredCurrencyCode: input.preferredCurrencyCode,
    selectedCountryCode: input.selectedCountryCode,
    browserCountryCode: input.browserCountryCode,
  });
}
