import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./ui/utils";

interface DateSelectorProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date) => void;
  availableDates?: string[];
  isMultiDay?: boolean;
  numberOfDays?: number;
}

export function DateSelector({
  selectedDate,
  onSelectDate,
  availableDates,
  isMultiDay = false,
  numberOfDays = 1,
}: DateSelectorProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Generate next 30 days
  const today = startOfDay(new Date());
  const dates = Array.from({ length: 30 }, (_, i) => addDays(today, i));

  const isDateAvailable = (date: Date) => {
    if (!availableDates) return true;
    const dateStr = date.toISOString().split('T')[0];
    return availableDates.includes(dateStr);
  };

  const scrollLeft = () => {
    setScrollPosition(Math.max(0, scrollPosition - 1));
  };

  const scrollRight = () => {
    setScrollPosition(Math.min(dates.length - 7, scrollPosition + 1));
  };

  const visibleDates = dates.slice(scrollPosition, scrollPosition + 7);

  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {isMultiDay 
            ? t("booking.selectDates", { days: numberOfDays })
            : t("booking.selectDate")}
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {t("common.calendar")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onSelectDate(date)}
              disabled={(date) => !isDateAvailable(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Quick date selector row */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollLeft}
          disabled={scrollPosition === 0}
          className="flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-2 overflow-hidden flex-1">
          {visibleDates.map((date, idx) => {
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isAvailable = isDateAvailable(date);
            const isToday = isSameDay(date, today);

            return (
              <button
                key={idx}
                onClick={() => isAvailable && onSelectDate(date)}
                disabled={!isAvailable}
                className={cn(
                  "flex-1 min-w-0 rounded-lg border p-3 text-center transition-all",
                  "hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed",
                  isSelected && "border-black bg-black text-white",
                  !isSelected && isToday && "border-blue-500",
                  !isAvailable && "bg-gray-50"
                )}
              >
                <div className="text-xs font-medium">
                  {format(date, "EEE")}
                </div>
                <div className="text-lg font-semibold mt-1">
                  {format(date, "d")}
                </div>
                <div className="text-xs mt-1">
                  {format(date, "MMM")}
                </div>
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={scrollRight}
          disabled={scrollPosition >= dates.length - 7}
          className="flex-shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}