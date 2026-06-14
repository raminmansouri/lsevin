"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

import { STAFF_TRANSLATION_KEY } from "../constants";

interface TimePickerProps {
  value: string; // Time in HH:mm:ss format
  onChange: (time: string) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  // Time validation props
  type?: "start" | "end" | "standalone";
  referenceTime?: string; // For start/end validation - opposite time value
  minTime?: string; // Minimum allowed time
  maxTime?: string; // Maximum allowed time
}

export function TimePicker({
  value,
  onChange,
  label,
  id,
  disabled = false,
  placeholder,
  className,
  type = "standalone",
  referenceTime,
  minTime,
  maxTime,
}: TimePickerProps) {
  const t = useTranslations(STAFF_TRANSLATION_KEY);
  const defaultPlaceholder =
    placeholder || t("availability.timePicker.selectTime");

  // Move compareTimeStrings inside useMemo to avoid changing dependencies on every render
  // Generate time slots every 15 minutes from 06:00 to 23:45
  const timeSlots = useMemo(() => {
    // Helper function to compare times (HH:mm:ss format)
    const compareTimeStrings = (time1: string, time2: string): number => {
      const parts1 = time1.split(":");
      const parts2 = time2.split(":");

      const h1 = Number(parts1[0]);
      const m1 = Number(parts1[1]);
      const h2 = Number(parts2[0]);
      const m2 = Number(parts2[1]);

      if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;

      const minutes1 = h1 * 60 + m1;
      const minutes2 = h2 * 60 + m2;
      return minutes1 - minutes2;
    };

    // Helper function to check if a time slot should be disabled
    const isTimeSlotDisabled = (timeSlot: string): boolean => {
      // Check minimum time constraint
      if (minTime && compareTimeStrings(timeSlot, minTime) < 0) {
        return true;
      }

      // Check maximum time constraint
      if (maxTime && compareTimeStrings(timeSlot, maxTime) > 0) {
        return true;
      }

      // Start time validation: cannot be after end time
      if (type === "start" && referenceTime) {
        return compareTimeStrings(timeSlot, referenceTime) >= 0;
      }

      // End time validation: cannot be before or equal to start time
      if (type === "end" && referenceTime) {
        return compareTimeStrings(timeSlot, referenceTime) <= 0;
      }

      return false;
    };

    const slots = [];
    for (let hour = 6; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}:00`;
        const displayTime = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        const isDisabled = isTimeSlotDisabled(timeString);
        slots.push({
          value: timeString,
          display: displayTime,
          disabled: isDisabled,
        });
      }
    }
    return slots;
  }, [minTime, maxTime, type, referenceTime]);

  // Get current selected time for display
  const selectedTimeDisplay = useMemo(() => {
    if (!value) return null;
    const selected = timeSlots.find((slot) => slot.value === value);
    return selected?.display || value.substring(0, 5);
  }, [value, timeSlots]);

  const handleTimeSelect = (timeValue: string) => {
    if (disabled) return;
    onChange(timeValue);
  };

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {label}
        </Label>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {selectedTimeDisplay ? (
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("availability.timePicker.selected")}: {selectedTimeDisplay}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {defaultPlaceholder}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-48">
            <div className="grid grid-cols-4 gap-1 p-4">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.value}
                  variant={value === slot.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTimeSelect(slot.value)}
                  disabled={disabled || slot.disabled}
                  className={`h-8 text-xs shadow-none ${
                    slot.disabled ? "opacity-40" : ""
                  }`}
                >
                  {slot.display}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
