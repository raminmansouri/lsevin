import type { BookingDraftState } from '../types';

export type SlotKey = 'provider' | 'service' | 'specialist';

/**
 * How a slot came to be filled. Drives what the row is allowed to say:
 * only `user` and `seed` picks are safe to present as "you chose this".
 */
export type ConfirmedBy = 'seed' | 'implied' | 'sole' | 'user';

export type SlotStatus =
  | 'loading' // entry/service-mode still in flight — say nothing yet
  | 'confirmed' // decided; collapses to a one-line row
  | 'open' // the one question being asked
  | 'blocked' // upstream not decided yet, so this is unanswerable
  | 'empty' // upstream decided but the catalog has nothing to offer
  | 'na'; // not applicable (service does not require a specialist)

export interface SlotView {
  key: SlotKey;
  status: SlotStatus;
  confirmedBy?: ConfirmedBy;
  /** Exact server-side count of what could fill this slot, ignoring pagination. */
  total: number;
}

/** Above this many options the picker earns a search box. Below it, scanning beats typing. */
export const SEARCH_THRESHOLD = 8;

/**
 * A list narrowed to one row is not evidence of a sole option: catalog queries are
 * paginated, so `items.length` is capped by `take`, and a search narrows results
 * without narrowing reality. Only an exact server `total` can prove it.
 */
export function isSoleOption(input: {
  total: number;
  hasMore: boolean;
  search: string;
  offset: number;
  loading: boolean;
}): boolean {
  if (input.loading) return false;
  if (input.hasMore) return false;
  if (input.offset !== 0) return false;
  if (input.search.trim() !== '') return false;
  return input.total === 1;
}

/**
 * Returns the id to auto-select, or null to leave the question open.
 *
 * Deliberately paranoid: money is involved, and a wrong default costs more than a tap.
 * Never fires on a search result, a paginated tail, a slot the user has opened, or
 * anything short of a provable single option.
 */
export function autoSelectId<T extends { id: string }>(input: {
  ready: boolean;
  loading: boolean;
  search: string;
  offset: number;
  touched: boolean;
  options: T[];
  total: number;
  hasMore: boolean;
  selectedId?: string | null;
}): string | null {
  if (!input.ready) return null;
  if (input.selectedId) return null;
  if (input.touched) return null; // they opened the picker — the choice is theirs now
  if (!isSoleOption(input)) return null;
  if (input.options.length !== 1) return null;
  return input.options[0]!.id;
}

/**
 * The search box is worth its space only when the list is too long to scan — but once
 * the user has typed, it must stay mounted even as results narrow, or it vanishes
 * under their finger and strands the query.
 */
export function shouldShowSearch(input: { total: number; search: string }): boolean {
  return input.total > SEARCH_THRESHOLD || input.search.length > 0;
}

/**
 * `requiresSpecialist` arrives in a third async wave (/draft -> /entry -> /service-mode).
 * Until it is defined, "does this need a specialist?" is unanswered, not answered "no" —
 * the difference between a booking that can proceed and one that skips a required pick.
 */
export function isServiceModeResolved(draft: Pick<BookingDraftState, 'serviceId' | 'requiresSpecialist'>): boolean {
  if (!draft.serviceId) return false;
  return draft.requiresSpecialist !== undefined;
}

export function deriveSlots(input: {
  draft: Pick<BookingDraftState, 'providerId' | 'serviceId' | 'specialistId' | 'requiresSpecialist'>;
  entryResolved: boolean;
  seeded: { providerId?: string | null; serviceId?: string | null; specialistId?: string | null };
  totals: Record<SlotKey, number>;
  loading: Record<SlotKey, boolean>;
  openSlot: SlotKey | null;
}): SlotView[] {
  const { draft, entryResolved, seeded, totals, loading, openSlot } = input;

  const confirmedBy = (key: SlotKey): ConfirmedBy => {
    if (key === 'provider') {
      if (seeded.providerId && seeded.providerId === draft.providerId) return 'seed';
      // Entry derives the provider from a seeded service; a provider_services row
      // belongs to exactly one provider, so this is an implication, not a guess.
      if (seeded.serviceId && seeded.serviceId === draft.serviceId) return 'implied';
    }
    if (key === 'service' && seeded.serviceId && seeded.serviceId === draft.serviceId) return 'seed';
    if (key === 'specialist' && seeded.specialistId && seeded.specialistId === draft.specialistId) return 'seed';
    return totals[key] === 1 ? 'sole' : 'user';
  };

  const build = (key: SlotKey, selectedId: string | null | undefined, blocked: boolean): SlotView => {
    const total = totals[key] ?? 0;
    if (!entryResolved) return { key, status: 'loading', total };
    if (selectedId) return { key, status: 'confirmed', confirmedBy: confirmedBy(key), total };
    if (blocked) return { key, status: 'blocked', total };
    if (loading[key]) return { key, status: 'loading', total };
    if (total === 0) return { key, status: 'empty', total };
    return { key, status: openSlot === key || openSlot === null ? 'open' : 'blocked', total };
  };

  const provider = build('provider', draft.providerId, false);
  const service = build('service', draft.serviceId, !draft.providerId);

  let specialist: SlotView;
  if (!isServiceModeResolved(draft)) {
    specialist = { key: 'specialist', status: draft.serviceId ? 'loading' : 'blocked', total: totals.specialist ?? 0 };
  } else if (draft.requiresSpecialist !== true) {
    specialist = { key: 'specialist', status: 'na', total: 0 };
  } else {
    specialist = build('specialist', draft.specialistId, !draft.serviceId);
  }

  return [provider, service, specialist];
}

/** The first slot still needing an answer — the default open question. */
export function firstOpenSlot(slots: SlotView[]): SlotKey | null {
  return slots.find((s) => s.status === 'open' || s.status === 'blocked' || s.status === 'empty')?.key ?? null;
}

export function canContinueService(input: {
  draft: Pick<BookingDraftState, 'providerId' | 'serviceId' | 'specialistId' | 'requiresSpecialist'>;
}): boolean {
  const { draft } = input;
  if (!draft.providerId || !draft.serviceId) return false;
  // Never let the user past a specialist requirement that has not loaded yet.
  if (!isServiceModeResolved(draft)) return false;
  if (draft.requiresSpecialist === true && !draft.specialistId) return false;
  return true;
}
