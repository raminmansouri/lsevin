'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Check, Loader2, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { listOpenDeparturesForServiceAction } from '@/features/tours/server/actions';

type Departure = {
  id: string;
  startsOn: string;
  endsOn: string;
  remainingCapacity: number;
};

function formatDeparture(startsOn: string, endsOn: string, locale: string): string {
  const start = new Date(`${startsOn}T00:00:00Z`);
  const end = new Date(`${endsOn}T00:00:00Z`);
  try {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  } catch {
    return `${startsOn} – ${endsOn}`;
  }
}

/**
 * Item 8 (tours): a fixed, explicit list of departures to pick from -- not a
 * calendar -- since a tour only runs on the dates the admin actually scheduled.
 * Rendered instead of the default_slot date/time picker when
 * chosenService.hasTourDepartures is true (see BookingWizard.tsx).
 */
export function TourDeparturePicker({
  serviceId,
  selectedDepartureId,
  onSelect,
}: {
  serviceId: string;
  selectedDepartureId?: string;
  onSelect: (departure: Departure) => void;
}) {
  const tBooking = useTranslations('Booking');
  const locale = useLocale();
  const [departures, setDepartures] = useState<Departure[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDepartures(null);
    listOpenDeparturesForServiceAction(serviceId)
      .then((result) => {
        if (!cancelled) setDepartures(result.ok ? (result.data as Departure[]) || [] : []);
      })
      .catch(() => {
        if (!cancelled) setDepartures([]);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  if (departures === null) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {tBooking('loadingDepartures')}
      </div>
    );
  }

  if (departures.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
        {tBooking('noUpcomingDepartures')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-900">{tBooking('chooseDeparture')}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {departures.map((departure) => {
          const selected = selectedDepartureId === departure.id;
          const full = departure.remainingCapacity <= 0;
          return (
            <button
              key={departure.id}
              type="button"
              disabled={full}
              onClick={() => onSelect(departure)}
              className={`rounded-2xl border p-4 text-start transition ${
                selected ? 'border-[#083f30] bg-[#083f30]/5 ring-1 ring-[#083f30]/20' : 'border-slate-200 bg-white'
              } ${full ? 'cursor-not-allowed opacity-40' : 'hover:border-[#155e75]'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  {formatDeparture(departure.startsOn, departure.endsOn, locale)}
                </div>
                {selected ? (
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[#083f30] bg-[#083f30]">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Users className="h-3.5 w-3.5" />
                {full ? tBooking('departureFull') : tBooking('spotsLeft', { count: departure.remainingCapacity })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
