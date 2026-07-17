import type { BookingDraftState, ProviderCardItem, ServiceCardItem, SpecialistCardItem } from '../types';
import type { SlotKey } from './decision-stack';

/** Every schedule field a booking can carry. Changing anything upstream invalidates all of them. */
const DATE_RESET = {
  selectedDate: null,
  selectedDateFrom: null,
  selectedDateTo: null,
  selectedTime: null,
  selectedTimeFrom: null,
  selectedTimeTo: null,
} as const;

export interface CascadeLoss {
  label: string;
  value: string;
}

/**
 * The patch for picking `next` in `slot`.
 *
 * Changing the provider normally clears the service — but when the new provider offers
 * the same service definition, `matchingServiceId` carries the equivalent service across,
 * so "same treatment, different clinic" keeps the treatment.
 */
export function cascadeFor(
  slot: SlotKey,
  next: ProviderCardItem | ServiceCardItem | SpecialistCardItem,
  draft: Pick<BookingDraftState, 'serviceDefinitionId'>,
): Partial<BookingDraftState> {
  if (slot === 'provider') {
    const provider = next as ProviderCardItem;
    const carriedService = draft.serviceDefinitionId ? provider.matchingServiceId : null;
    return {
      providerId: provider.id,
      serviceId: (carriedService ?? null) as any,
      // Keep the definition when the service travels with us; it is what made this
      // provider list answerable in the first place.
      serviceDefinitionId: (carriedService ? draft.serviceDefinitionId : null) as any,
      specialistId: null as any,
      // Cleared, not left stale: these describe the *old* provider's service.
      requiresSpecialist: undefined as any,
      bookingUiMode: undefined as any,
      formSubmissionId: null as any,
      ...DATE_RESET,
      currentStep: 1,
    } as Partial<BookingDraftState>;
  }

  if (slot === 'service') {
    const service = next as ServiceCardItem;
    return {
      serviceId: service.id,
      serviceDefinitionId: service.serviceDefinitionId,
      specialistId: null as any,
      requiresSpecialist: service.requiresSpecialist,
      bookingUiMode: service.bookingUiMode,
      subtotalAmount: service.value,
      currency: service.currency,
      formSubmissionId: null as any, // answers belong to the service they were asked for
      ...DATE_RESET,
    } as Partial<BookingDraftState>;
  }

  return { specialistId: next.id, ...DATE_RESET } as Partial<BookingDraftState>;
}

/**
 * What the user is about to lose. Doubles as the confirm sheet's content and its trigger:
 * an empty result means the change costs nothing, so we never nag.
 */
export function cascadeImpact(input: {
  slot: SlotKey;
  next: ProviderCardItem | ServiceCardItem | SpecialistCardItem;
  draft: Pick<
    BookingDraftState,
    | 'providerId'
    | 'serviceId'
    | 'serviceDefinitionId'
    | 'specialistId'
    | 'selectedDate'
    | 'selectedDateFrom'
    | 'formSubmissionId'
    | 'childBookings'
  >;
  names: { service?: string | null; specialist?: string | null };
  labels: {
    service: string;
    specialist: string;
    schedule: string;
    formAnswers: string;
    addOns: string;
  };
  formatDate: (iso: string) => string;
}): CascadeLoss[] {
  const { slot, next, draft, names, labels, formatDate } = input;
  const losing: CascadeLoss[] = [];

  const serviceSurvives =
    slot === 'provider' && Boolean(draft.serviceDefinitionId) && Boolean((next as ProviderCardItem).matchingServiceId);

  if (slot === 'provider' && draft.serviceId && !serviceSurvives) {
    losing.push({ label: labels.service, value: names.service ?? '—' });
  }
  if (slot !== 'specialist' && draft.specialistId) {
    losing.push({ label: labels.specialist, value: names.specialist ?? '—' });
  }
  const scheduled = draft.selectedDate || draft.selectedDateFrom;
  if (scheduled) {
    losing.push({ label: labels.schedule, value: formatDate(scheduled) });
  }
  if (draft.formSubmissionId) {
    losing.push({ label: labels.formAnswers, value: labels.formAnswers });
  }
  if (slot === 'provider' && draft.childBookings?.length) {
    losing.push({ label: labels.addOns, value: String(draft.childBookings.length) });
  }

  return losing;
}
