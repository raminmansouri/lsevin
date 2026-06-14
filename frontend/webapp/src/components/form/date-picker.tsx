"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Matcher } from "react-day-picker";

import { ArabicCalendar } from "@/components/ui/arabic-calendar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { PersianCalendar } from "@/components/ui/persian-calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DEFAULT_LOCALE,
  getDirection,
  isSupportedLocale,
  shouldUseHijriCalendar,
  shouldUsePersianCalendar,
} from "@/config/locales";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  disableFuture?: boolean;
  disablePast?: boolean;
  minDate?: Date;
  maxDate?: Date;
  ref?: React.Ref<HTMLButtonElement>;
  // New props for month/year selection
  enableMonthYearSelect?: boolean;
  enableMonthSelect?: boolean;
  enableYearSelect?: boolean;
  // Date range for navigation (updated to new API)
  startMonth?: Date;
  endMonth?: Date;
  hidden?: {
    before?: Date;
    after?: Date;
  };
  // Calendar display options
  showOutsideDays?: boolean;
  fixedWeeks?: boolean;
  numberOfMonths?: number;
  // Selection mode
  mode?: "single" | "multiple" | "range";
  // Multiple selection support
  multiple?: boolean;
  values?: string[];
  onMultipleChange?: (values: string[]) => void;
  // Range selection support
  range?: boolean;
  startValue?: string;
  endValue?: string;
  onRangeChange?: (start: string | undefined, end: string | undefined) => void;
}

// Helper function to format date based on locale
const formatDateForLocale = (date: Date, locale: string): string => {
  // Validate and use the locale, fallback to default if invalid
  const validLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;

  if (shouldUsePersianCalendar(validLocale)) {
    // For Persian locale, format using Persian calendar
    return date.toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      calendar: "persian",
    });
  }

  if (shouldUseHijriCalendar(validLocale)) {
    // For Arabic locale, format using Hijri calendar with moment-hijri
    // Note: moment-hijri needs to be imported at the top
    // Import will be: import momentHijri from "moment-hijri";
    try {
      // Dynamically import to avoid SSR issues
      const momentHijri = require("moment-hijri");
      const hijriDate = momentHijri(date);
      return hijriDate.format("iD iMMMM iYYYY");
    } catch {
      // Fallback to Gregorian if moment-hijri is not available
      return date.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }

  // For other locales, use date-fns format
  return format(date, "PPP");
};

// Helper function to convert string date to Date object
const parseDate = (dateString: string | undefined): Date | undefined => {
  if (!dateString) return undefined;
  try {
    // Parse as local date to avoid timezone issues
    const parts = dateString.split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return undefined;

    const [year, month, day] = parts;
    return new Date(year!, month! - 1, day!); // month is 0-indexed
  } catch {
    return undefined;
  }
};

// Helper function to parse multiple dates
const parseMultipleDates = (dateStrings: string[] | undefined): Date[] => {
  if (!dateStrings) return [];
  return dateStrings
    .map(parseDate)
    .filter((date): date is Date => date !== undefined);
};

// Helper function to format date as local string
const formatDateAsString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DatePicker = ({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  disableFuture = false,
  disablePast = false,
  minDate,
  maxDate,
  ref,
  // Month/year selection props
  enableMonthYearSelect = false,
  enableMonthSelect = false,
  enableYearSelect = false,
  // Date range navigation props (updated to new API)
  startMonth,
  endMonth,
  hidden,
  // Display options
  showOutsideDays = true,
  fixedWeeks = false,
  numberOfMonths = 1,
  // Selection mode props
  mode = "single",
  multiple = false,
  values,
  onMultipleChange,
  range = false,
  startValue,
  endValue,
  onRangeChange,
}: DatePickerProps) => {
  const locale = useLocale();
  // Validate locale and provide fallback
  const validLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const direction = getDirection(validLocale);
  const isPersian = shouldUsePersianCalendar(validLocale);
  const isHijri = shouldUseHijriCalendar(validLocale);

  // State for controlling popover open/close behavior
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("Common.DatePicker");

  // Internal state for range selection to maintain start date between clicks
  const [internalRangeStart, setInternalRangeStart] = useState<
    string | undefined
  >(startValue);
  const [internalRangeEnd, setInternalRangeEnd] = useState<string | undefined>(
    endValue
  );

  // Determine caption layout based on props
  const getCaptionLayout = () => {
    if (enableMonthYearSelect) return "dropdown";
    if (enableMonthSelect && enableYearSelect) return "dropdown";
    if (enableMonthSelect) return "dropdown-months";
    if (enableYearSelect) return "dropdown-years";
    return "label";
  };

  // Determine actual mode
  const actualMode = multiple ? "multiple" : range ? "range" : mode;

  // Handle different selection modes
  const selectedDate = parseDate(value);
  const selectedDates = parseMultipleDates(values);

  // For range mode, use internal state to maintain range selection
  const selectedRange =
    range && internalRangeStart
      ? {
          from: parseDate(internalRangeStart),
          to: parseDate(internalRangeEnd), // to can be undefined
        }
      : undefined;

  const handleSelect = (
    date: Date | Date[] | { from?: Date; to?: Date } | undefined
  ) => {
    if (actualMode === "single") {
      const singleDate = date as Date | undefined;
      if (singleDate) {
        const localDateString = formatDateAsString(singleDate);
        onChange?.(localDateString);
        setIsOpen(false); // Close popover after single selection
      }
    } else if (actualMode === "multiple") {
      const multipleDates = date as Date[] | undefined;
      if (multipleDates) {
        const dateStrings = multipleDates.map(formatDateAsString);
        onMultipleChange?.(dateStrings);
        // Keep popover open for multiple selection
      }
    } else if (actualMode === "range") {
      const rangeData = date as { from?: Date; to?: Date } | undefined;

      // Handle range selection logic

      if (!rangeData) {
        // Range was cleared
        onRangeChange?.(undefined, undefined);
        setIsOpen(false); // Close popover when range is cleared
      } else {
        const startString = rangeData.from
          ? formatDateAsString(rangeData.from)
          : undefined;
        const endString = rangeData.to
          ? formatDateAsString(rangeData.to)
          : undefined;

        // Check if both dates are the same (initial single click)
        const isSameDate =
          rangeData.from &&
          rangeData.to &&
          rangeData.from.getTime() === rangeData.to.getTime();

        if (isSameDate) {
          // Single date clicked - set as start, clear end, keep popover open
          setInternalRangeStart(startString);
          setInternalRangeEnd(undefined);
          // Don't call parent callback yet - wait for end date
        } else if (rangeData.from && rangeData.to) {
          // Range with different dates - complete selection
          setInternalRangeStart(startString);
          setInternalRangeEnd(endString);
          onRangeChange?.(startString, endString);
          setIsOpen(false);
        } else if (rangeData.from && !rangeData.to) {
          // Only start date from react-day-picker
          setInternalRangeStart(startString);
          setInternalRangeEnd(undefined);
          // Don't call parent callback yet
        }
      }
    }
  };

  // Calculate disabled dates
  const getDisabledDates = (): Matcher[] | undefined => {
    const today = new Date();
    const disabledConditions: Matcher[] = [];

    if (disablePast) {
      disabledConditions.push({ before: today });
    }
    if (disableFuture) {
      disabledConditions.push({ after: today });
    }
    if (minDate) {
      disabledConditions.push({ before: minDate });
    }
    if (maxDate) {
      disabledConditions.push({ after: maxDate });
    }

    return disabledConditions.length > 0 ? disabledConditions : undefined;
  };

  // Calculate hidden dates (updated API)
  const getHiddenDates = (): Matcher[] | undefined => {
    const hiddenConditions: Matcher[] = [];

    if (hidden?.before) {
      hiddenConditions.push({ before: hidden.before });
    }
    if (hidden?.after) {
      hiddenConditions.push({ after: hidden.after });
    }

    return hiddenConditions.length > 0 ? hiddenConditions : undefined;
  };

  // Calculate default month to show based on selected date
  const getDefaultMonth = (): Date => {
    // For single mode, use the selected date
    if (actualMode === "single" && selectedDate) {
      return selectedDate;
    }

    // For range mode, use the start date if available
    if (actualMode === "range" && internalRangeStart) {
      const startDate = parseDate(internalRangeStart);
      if (startDate) return startDate;
    }

    // For multiple mode, use the first selected date
    if (actualMode === "multiple" && selectedDates.length > 0) {
      return selectedDates[0]!;
    }

    // Fall back to today
    return new Date();
  };

  // Generate placeholder text
  const getPlaceholderText = () => {
    if (actualMode === "multiple") {
      if (selectedDates.length > 0) {
        return t("multiple", { count: selectedDates.length });
      }
      return t("multiple");
    }
    if (actualMode === "range") {
      if (selectedRange?.from && selectedRange?.to) {
        return `${formatDateForLocale(selectedRange.from, locale)} - ${formatDateForLocale(selectedRange.to, locale)}`;
      }
      if (selectedRange?.from) {
        return `${formatDateForLocale(selectedRange.from, locale)} - ...`;
      }
      return t("range");
    }
    return placeholder;
  };

  // Generate button content
  const getButtonContent = () => {
    if (actualMode === "single" && selectedDate) {
      return formatDateForLocale(selectedDate, locale);
    }
    if (actualMode === "multiple" && selectedDates.length > 0) {
      if (selectedDates.length === 1) {
        return formatDateForLocale(selectedDates[0]!, locale);
      }
      return t("multiple", { count: selectedDates.length });
    }
    if (actualMode === "range") {
      if (internalRangeStart && internalRangeEnd) {
        const startDate = parseDate(internalRangeStart);
        const endDate = parseDate(internalRangeEnd);
        if (startDate && endDate) {
          return `${formatDateForLocale(startDate, locale)} - ${formatDateForLocale(endDate, locale)}`;
        }
      }
      if (internalRangeStart) {
        const startDate = parseDate(internalRangeStart);
        if (startDate) {
          return `${formatDateForLocale(startDate, locale)} - ...`;
        }
      }
    }
    return <span>{getPlaceholderText()}</span>;
  };

  const hasSelection =
    (actualMode === "single" && selectedDate) ||
    (actualMode === "multiple" && selectedDates.length > 0) ||
    (actualMode === "range" && internalRangeStart);

  // Select calendar component based on locale
  const CalendarComponent = isPersian
    ? PersianCalendar
    : isHijri
      ? ArabicCalendar
      : Calendar;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          className={cn(
            "flex w-full justify-start gap-2 text-start font-normal",
            !hasSelection && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="size-4" />
          {getButtonContent()}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-auto p-0", numberOfMonths > 1 && "w-fit")}
        align="start"
        dir={direction}
      >
        {actualMode === "single" && (
          <CalendarComponent
            mode="single"
            captionLayout={getCaptionLayout()}
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={getDisabledDates()}
            showOutsideDays={showOutsideDays}
            fixedWeeks={fixedWeeks}
            numberOfMonths={numberOfMonths}
            startMonth={startMonth}
            endMonth={endMonth}
            hidden={getHiddenDates()}
            defaultMonth={getDefaultMonth()}
            autoFocus
            dir={direction}
          />
        )}
        {actualMode === "multiple" && (
          <CalendarComponent
            mode="multiple"
            captionLayout={getCaptionLayout()}
            selected={selectedDates}
            onSelect={handleSelect}
            disabled={getDisabledDates()}
            showOutsideDays={showOutsideDays}
            fixedWeeks={fixedWeeks}
            numberOfMonths={numberOfMonths}
            startMonth={startMonth}
            endMonth={endMonth}
            hidden={getHiddenDates()}
            defaultMonth={getDefaultMonth()}
            autoFocus
            dir={direction}
          />
        )}
        {actualMode === "range" && (
          <CalendarComponent
            mode="range"
            captionLayout={getCaptionLayout()}
            selected={selectedRange}
            onSelect={handleSelect}
            disabled={getDisabledDates()}
            showOutsideDays={showOutsideDays}
            fixedWeeks={fixedWeeks}
            numberOfMonths={numberOfMonths}
            startMonth={startMonth}
            endMonth={endMonth}
            hidden={getHiddenDates()}
            defaultMonth={getDefaultMonth()}
            autoFocus
            dir={direction}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};

DatePicker.displayName = "DatePicker";

export default DatePicker;
