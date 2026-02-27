import { useTranslation } from "react-i18next";
import { cn } from "./ui/utils";
import { Clock } from "lucide-react";

interface TimeSlotSelectorProps {
  slots: string[];
  selectedSlot: string | undefined;
  onSelectSlot: (slot: string) => void;
  isMultiDay?: boolean;
  selectedSlots?: string[];
}

export function TimeSlotSelector({
  slots,
  selectedSlot,
  onSelectSlot,
  isMultiDay = false,
  selectedSlots = [],
}: TimeSlotSelectorProps) {
  const { t } = useTranslation();

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>{t("booking.noTimeSlotsAvailable")}</p>
        <p className="text-sm mt-1">{t("booking.selectDifferentDate")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{t("booking.availableTimes")}</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[400px] overflow-y-auto">
        {slots.map((slot) => {
          const isSelected = isMultiDay
            ? selectedSlots.includes(slot)
            : selectedSlot === slot;

          return (
            <button
              key={slot}
              onClick={() => onSelectSlot(slot)}
              className={cn(
                "px-4 py-3 rounded-lg border text-sm font-medium transition-all",
                "hover:border-gray-400",
                isSelected && "border-black bg-black text-white",
                !isSelected && "border-gray-200"
              )}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}