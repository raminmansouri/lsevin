"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

import type { CalendarId } from "../../domain/calendar";
import { savePrefsAction } from "../../server/actions/customer";

export type ToursPrefs = {
  calendar: CalendarId;
  /** Display currency for approximate conversions; null = tour currency only. */
  currency: string | null;
  currencies: string[];
  signedIn: boolean;
  userName: string | null;
  setCalendar: (calendar: CalendarId) => Promise<boolean>;
  setCurrency: (currency: string | null) => Promise<boolean>;
  /** Resolves once every preference save started so far has finished (call before navigating away). */
  flush: () => Promise<void>;
};

const Ctx = createContext<ToursPrefs | null>(null);

/**
 * Display preferences of the Tours app (C-018, C-118, S-053). Calendar and
 * currency are independent of the interface language and are persisted
 * server-side (account) or in a cookie (guest) by savePrefsAction.
 */
export function ToursPrefsProvider({
  initial,
  children,
}: {
  initial: { calendar: CalendarId; currency: string | null; currencies: string[]; signedIn: boolean; userName: string | null };
  children: ReactNode;
}) {
  const [calendar, setCal] = useState<CalendarId>(initial.calendar);
  const [currency, setCur] = useState<string | null>(initial.currency);

  const pending = useRef<Promise<unknown>>(Promise.resolve());
  const save = useCallback((patch: { calendar?: CalendarId; currency?: string | null }) => {
    const run = pending.current.then(() => savePrefsAction(patch).catch(() => null));
    pending.current = run;
    return run.then((res) => Boolean(res?.ok));
  }, []);
  const setCalendar = useCallback(
    async (next: CalendarId) => {
      setCal(next);
      return save({ calendar: next });
    },
    [save],
  );
  const setCurrency = useCallback(
    async (next: string | null) => {
      setCur(next);
      return save({ currency: next });
    },
    [save],
  );
  const flush = useCallback(() => pending.current.then(() => undefined), []);

  const value = useMemo<ToursPrefs>(
    () => ({ calendar, currency, currencies: initial.currencies, signedIn: initial.signedIn, userName: initial.userName, setCalendar, setCurrency, flush }),
    [calendar, currency, initial.currencies, initial.signedIn, initial.userName, setCalendar, setCurrency, flush],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useToursPrefs(): ToursPrefs {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToursPrefs must be used inside ToursPrefsProvider");
  return v;
}
