import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
import { Professional } from "../types/booking";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface ProfessionalSelectorProps {
  professionals: Professional[];
  selected: Professional | "any" | undefined;
  onSelect: (professional: Professional | "any") => void;
}

export function ProfessionalSelector({
  professionals,
  selected,
  onSelect,
}: ProfessionalSelectorProps) {
  const { t } = useTranslation();

  const getDisplayValue = () => {
    if (!selected) return t("booking.professional");
    if (selected === "any") return t("booking.anyAvailable");
    return selected.name;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t("booking.professional")}</label>
      <Select
        value={selected === "any" ? "any" : selected?.id || ""}
        onValueChange={(value) => {
          if (value === "any") {
            onSelect("any");
          } else {
            const prof = professionals.find((p) => p.id === value);
            if (prof) onSelect(prof);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("booking.professional")}>
            <div className="flex items-center gap-3">
              {selected && selected !== "any" && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selected.avatar} alt={selected.name} />
                  <AvatarFallback>{selected.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <span>{getDisplayValue()}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs">All</span>
              </div>
              <div>
                <div className="font-medium">{t("booking.anyAvailable")}</div>
                <div className="text-xs text-gray-500">
                  {t("booking.maximumAvailability")}
                </div>
              </div>
            </div>
          </SelectItem>
          {professionals.map((prof) => (
            <SelectItem key={prof.id} value={prof.id}>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={prof.avatar} alt={prof.name} />
                  <AvatarFallback>{prof.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{prof.name}</div>
                  <div className="text-xs text-gray-500">{prof.role}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}