'use client';

import React, { useMemo, useState } from 'react';
import { AlertCircle, MapPin, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { BookingDraftState, ProviderCardItem, ServiceCardItem, SpecialistCardItem } from '../../types';
import { deriveSlots, firstOpenSlot, type SlotKey } from '../../lib/decision-stack';
import { cascadeFor, cascadeImpact, type CascadeLoss } from '../../lib/cascade';
import { providerMeta, serviceMeta } from '../EntityCard';
import { ConfirmedRow } from './ConfirmedRow';
import { OptionRow } from './OptionRow';
import { OpenQuestion } from './OpenQuestion';
import { CascadeConfirmSheet } from './CascadeConfirmSheet';
import { EntityDetailsSheet } from './EntityDetailsSheet';

type AnyItem = ProviderCardItem | ServiceCardItem | SpecialistCardItem;

export interface SlotData<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onLoadMore: () => void;
  /** The resolved entity, independent of whatever page the list is showing. */
  resolved?: T | null;
}

interface Props {
  draft: BookingDraftState;
  entryResolved: boolean;
  entryFailed: boolean;
  onRetryEntry: () => void;
  seeded: { providerId?: string | null; serviceId?: string | null; specialistId?: string | null };
  provider: SlotData<ProviderCardItem>;
  service: SlotData<ServiceCardItem>;
  specialist: SlotData<SpecialistCardItem>;
  onPick: (slot: SlotKey, patch: Partial<BookingDraftState>) => void;
  onSlotTouched: (slot: SlotKey) => void;
  formatMoney: (value?: number | null, currency?: string | null) => string;
  formatDate: (iso: string) => string;
}

/**
 * Step 1 as a stack of decisions rather than three catalogs.
 *
 * Anything decided collapses to a ~64px ConfirmedRow; exactly one open question renders
 * as a picker. A user arriving from a service link sees three rows and a Continue button
 * — one viewport, no scroll — instead of three full-bleed cards and three dead search boxes.
 */
export function DecisionStack({
  draft,
  entryResolved,
  entryFailed,
  onRetryEntry,
  seeded,
  provider,
  service,
  specialist,
  onPick,
  onSlotTouched,
  formatMoney,
  formatDate,
}: Props) {
  const tBooking = useTranslations('Booking');
  const [openSlot, setOpenSlot] = useState<SlotKey | null>(null);
  const [pending, setPending] = useState<{ slot: SlotKey; item: AnyItem; losing: CascadeLoss[] } | null>(null);
  const [details, setDetails] = useState<{ slot: SlotKey; item: AnyItem } | null>(null);

  const slots = useMemo(
    () =>
      deriveSlots({
        draft,
        entryResolved,
        seeded,
        totals: { provider: provider.total, service: service.total, specialist: specialist.total },
        loading: { provider: provider.loading, service: service.loading, specialist: specialist.loading },
        openSlot,
      }),
    [draft, entryResolved, seeded, provider.total, provider.loading, service.total, service.loading, specialist.total, specialist.loading, openSlot],
  );

  // One source of truth for "which question is open": an explicit تغییر tap wins,
  // otherwise it is the first slot still needing an answer.
  const activeSlot = openSlot ?? firstOpenSlot(slots);

  const dataFor = (key: SlotKey): SlotData<any> => (key === 'provider' ? provider : key === 'service' ? service : specialist);

  const resolvedFor = (key: SlotKey): AnyItem | null | undefined => dataFor(key).resolved;

  function requestPick(slot: SlotKey, item: AnyItem) {
    const currentId = slot === 'provider' ? draft.providerId : slot === 'service' ? draft.serviceId : draft.specialistId;

    // Re-tapping the current choice must not run the cascade — today's handlers wipe
    // the schedule when a user taps "yes, this one".
    if (currentId === item.id) {
      setOpenSlot(null);
      return;
    }

    const losing = cascadeImpact({
      slot,
      next: item,
      draft,
      names: {
        service: (resolvedFor('service') as ServiceCardItem | null)?.name,
        specialist: (resolvedFor('specialist') as SpecialistCardItem | null)?.name,
      },
      labels: {
        service: tBooking('service'),
        specialist: tBooking('specialist'),
        schedule: tBooking('stepSchedule'),
        formAnswers: tBooking('formAnswers'),
        addOns: tBooking('stepAddOns'),
      },
      formatDate,
    });

    if (losing.length > 0) {
      setPending({ slot, item, losing });
      return;
    }
    commit(slot, item);
  }

  function commit(slot: SlotKey, item: AnyItem) {
    onPick(slot, cascadeFor(slot, item, draft));
    setOpenSlot(null);
    setPending(null);
  }

  function openPicker(slot: SlotKey) {
    onSlotTouched(slot);
    setOpenSlot(slot);
  }

  const invalidatedBy = (slot: SlotKey): boolean => {
    if (!pending) return false;
    return pending.losing.some((l) => l.label === (slot === 'service' ? tBooking('service') : tBooking('specialist')));
  };

  if (entryFailed) {
    return (
      <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <div className="font-bold text-slate-900">{tBooking('entryResolveFailedTitle')}</div>
            <p className="mt-1 text-sm text-slate-600">{tBooking('entryResolveFailedSubtitle')}</p>
            <button type="button" onClick={onRetryEntry} className="mt-4 rounded-2xl bg-[#083f30] px-5 py-2.5 text-sm font-bold text-white">
              {tBooking('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderSlot(key: SlotKey) {
    const slot = slots.find((s) => s.key === key)!;
    const data = dataFor(key);
    const resolved = resolvedFor(key);

    if (slot.status === 'na') return null;

    // Decided, but the entity itself has not arrived yet — e.g. a service just carried over
    // to a new provider, whose row the catalog has not refetched. Hold the row's shape rather
    // than falling through and flashing a picker for a question that is already answered.
    const awaitingEntity = slot.status === 'confirmed' && !resolved;

    if (slot.status === 'loading' || awaitingEntity) {
      return (
        <div key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100" />
            <div className="h-3.5 w-2/5 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      );
    }

    if (slot.status === 'confirmed' && resolved && activeSlot !== key) {
      const label = key === 'provider' ? tBooking('provider') : key === 'service' ? tBooking('service') : tBooking('specialist');
      const subtitle =
        key === 'provider'
          ? [(resolved as ProviderCardItem).city, (resolved as ProviderCardItem).country].filter(Boolean).join(', ')
          : key === 'service'
            ? // Price stays on the row: it is the one fact a collapsed step must not hide.
              formatMoney((resolved as ServiceCardItem).value, (resolved as ServiceCardItem).currency)
            : (resolved as SpecialistCardItem).title || (resolved as SpecialistCardItem).specialty;

      return (
        <ConfirmedRow
          key={key}
          label={label}
          title={resolved.name}
          subtitle={subtitle}
          imageUrl={resolved.imageUrl}
          soleOption={slot.total <= 1}
          invalidating={invalidatedBy(key)}
          hasDetails={key !== 'specialist' || Boolean((resolved as SpecialistCardItem).title)}
          onChange={slot.total > 1 ? () => openPicker(key) : undefined}
          onDetails={() => setDetails({ slot: key, item: resolved })}
        />
      );
    }

    if (slot.status === 'blocked') return null;

    if (slot.status === 'empty') {
      return (
        <div key={key} className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
          <div>{key === 'provider' ? tBooking('noProvidersFound') : key === 'service' ? tBooking('noServicesFound') : tBooking('noSpecialistsFound')}</div>
          {key !== 'provider' ? (
            <button type="button" onClick={() => openPicker(key === 'specialist' ? 'service' : 'provider')} className="mt-2 text-xs font-bold text-[#155e75]">
              {tBooking('changeSelection')}
            </button>
          ) : null}
        </div>
      );
    }

    // status === 'open'
    const question = key === 'provider' ? tBooking('chooseProvider') : key === 'service' ? tBooking('chooseService') : tBooking('chooseSpecialist');
    const selectedId = key === 'provider' ? draft.providerId : key === 'service' ? draft.serviceId : draft.specialistId;

    return (
      <OpenQuestion
        key={key}
        question={question}
        helper={key === 'provider' && draft.serviceDefinitionId ? tBooking('providersOfferingThisService') : null}
        items={data.items}
        total={data.total}
        hasMore={data.hasMore}
        loading={data.loading}
        search={data.search}
        onSearchChange={data.onSearchChange}
        onLoadMore={data.onLoadMore}
        emptyText={key === 'provider' ? tBooking('noProvidersFound') : key === 'service' ? tBooking('noServicesFound') : tBooking('noSpecialistsFound')}
        renderRow={(item: AnyItem) => (
          <OptionRow
            title={item.name}
            subtitle={
              key === 'provider'
                ? [(item as ProviderCardItem).city, (item as ProviderCardItem).country].filter(Boolean).join(', ')
                : key === 'service'
                  ? null
                  : (item as SpecialistCardItem).title || (item as SpecialistCardItem).specialty
            }
            trailing={key === 'service' ? formatMoney((item as ServiceCardItem).value, (item as ServiceCardItem).currency) : null}
            imageUrl={item.imageUrl}
            selected={selectedId === item.id}
            badge={
              key === 'provider' && ((item as ProviderCardItem).featuredScore || (item as ProviderCardItem).isSponsored)
                ? tBooking('featured')
                : key === 'service' && (item as ServiceCardItem).isPopular
                  ? tBooking('featured')
                  : null
            }
            hasDetails={Boolean((item as any).description || (item as any).city || item.imageUrl)}
            onSelect={() => requestPick(key, item)}
            onDetails={() => setDetails({ slot: key, item })}
          />
        )}
      />
    );
  }

  const detailsMeta = () => {
    if (!details) return [];
    if (details.slot === 'provider') return providerMeta(details.item as ProviderCardItem, tBooking);
    if (details.slot === 'service') return serviceMeta(details.item as ServiceCardItem, tBooking);
    const s = details.item as SpecialistCardItem;
    return [
      s.specialty ? { icon: <MapPin className="h-3.5 w-3.5" />, label: s.specialty } : null,
      s.rating ? { icon: <Star className="h-3.5 w-3.5" />, label: tBooking('starsValue', { rating: s.rating }) } : null,
    ].filter(Boolean) as Array<{ icon: React.ReactNode; label: string }>;
  };

  return (
    <div className="space-y-2.5">
      {(['provider', 'service', 'specialist'] as const).map((key) => renderSlot(key))}

      <CascadeConfirmSheet
        open={Boolean(pending)}
        losing={pending?.losing ?? []}
        onConfirm={() => pending && commit(pending.slot, pending.item)}
        onCancel={() => setPending(null)}
      />

      <EntityDetailsSheet
        open={Boolean(details)}
        title={details?.item.name ?? ''}
        subtitle={
          details?.slot === 'service'
            ? formatMoney((details.item as ServiceCardItem).value, (details.item as ServiceCardItem).currency)
            : details?.slot === 'provider'
              ? [(details.item as ProviderCardItem).city, (details.item as ProviderCardItem).country].filter(Boolean).join(', ')
              : (details?.item as SpecialistCardItem | undefined)?.title
        }
        description={(details?.item as any)?.description}
        imageUrl={details?.item.imageUrl}
        meta={detailsMeta()}
        onClose={() => setDetails(null)}
      />
    </div>
  );
}
