'use client';
import { useLocale } from 'next-intl';
import { Button, Calendar, CalendarCell, CalendarGrid, DateInput, DatePicker, DateSegment, Dialog, Group, Heading, I18nProvider, Popover } from 'react-aria-components';
import { parseDate, toCalendar } from '@internationalized/date';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { bookingCalendarSystem, calendarIdentifier, isReasonableBookingIsoDate, type BookingCalendar } from '../lib/calendar';

export function BookingDatePicker({ value, onChange, calendar, label }: {
  value?: string | null; onChange: (value: string) => void; calendar: BookingCalendar; label: string;
}) {
  const locale = useLocale();
  const calendarLocale = new Intl.Locale(locale, { calendar: calendarIdentifier(calendar) }).toString();
  const selected = value && isReasonableBookingIsoDate(value) ? toCalendar(parseDate(value), bookingCalendarSystem(calendar)) : null;
  return <I18nProvider locale={calendarLocale}>
    <DatePicker key={calendar} aria-label={label} value={selected} onChange={date => onChange(date?.toString() || '')}
      minValue={parseDate('1900-01-01')} maxValue={parseDate('2200-12-31')} className="w-full">
      <Group className="flex min-h-12 items-center rounded-2xl border border-slate-200 bg-white px-3 focus-within:ring-2 focus-within:ring-[#083f30]">
        <DateInput className="flex flex-1 gap-0.5 text-sm">{segment => <DateSegment segment={segment} className="rounded px-0.5 py-2 outline-none focus:bg-[#083f30] focus:text-white data-[placeholder]:text-slate-400" />}</DateInput>
        <Button className="flex h-11 w-11 items-center justify-center rounded-xl text-[#083f30] outline-none focus-visible:ring-2"><CalendarDays size={20} /></Button>
      </Group>
      <Popover className="z-[100] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
        <Dialog className="outline-none">
          <Calendar createCalendar={() => bookingCalendarSystem(calendar)}>
            <header className="mb-3 flex items-center justify-between gap-3">
              <Button slot="previous" className="h-11 w-11 rounded-lg p-3 hover:bg-slate-100"><ChevronLeft className="h-5 w-5 rtl:rotate-180" /></Button>
              <Heading className="text-sm font-semibold" />
              <Button slot="next" className="h-11 w-11 rounded-lg p-3 hover:bg-slate-100"><ChevronRight className="h-5 w-5 rtl:rotate-180" /></Button>
            </header>
            <CalendarGrid>{date => <CalendarCell date={date} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-sm outline-none hover:bg-slate-100 focus-visible:ring-2 data-[selected]:bg-[#083f30] data-[selected]:text-white data-[disabled]:opacity-30 data-[outside-month]:text-slate-400" />}</CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </DatePicker>
  </I18nProvider>;
}
