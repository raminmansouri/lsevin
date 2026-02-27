import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { BookingSelection } from "../types/booking";
import { format } from "date-fns";
import { CheckCircle, Calendar, Clock, User, MapPin } from "lucide-react";
import { Separator } from "./ui/separator";

interface BookingConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selection: BookingSelection;
  onConfirm: () => void;
}

export function BookingConfirmation({
  open,
  onOpenChange,
  selection,
  onConfirm,
}: BookingConfirmationProps) {
  const { t } = useTranslation();
  const { services = [], professional, date, timeSlot } = selection;

  const calculateTotal = () => {
    return services.reduce((sum, service) => sum + service.price, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {t("confirmation.title")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("confirmation.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Services */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="text-sm text-gray-600 mb-2">
              {t("booking.services")} ({services.length})
            </div>
            {services.map((service) => (
              <div key={service.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{service.name}</div>
                  <div className="text-sm text-gray-600">
                    {service.duration} {t("booking.minutes")}
                  </div>
                </div>
                <div className="text-right font-semibold">
                  {service.price.toLocaleString()} JOD
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between font-semibold text-lg">
              <span>{t("booking.total")}</span>
              <span>{calculateTotal().toLocaleString()} JOD</span>
            </div>
          </div>

          <Separator />

          {/* Professional */}
          {professional && professional !== "any" && (
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-600">
                  {t("booking.professional")}
                </div>
                <div className="font-medium">{professional.name}</div>
                <div className="text-sm text-gray-600">{professional.role}</div>
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-500 mt-1" />
              <div>
                <div className="text-sm text-gray-600">{t("booking.date")}</div>
                <div className="font-medium">
                  {date && format(date, "MMM d, yyyy")}
                </div>
                <div className="text-sm text-gray-600">
                  {date && format(date, "EEEE")}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-500 mt-1" />
              <div>
                <div className="text-sm text-gray-600">{t("booking.time")}</div>
                <div className="font-medium">{timeSlot}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-500 mt-1" />
            <div>
              <div className="text-sm text-gray-600">
                {t("confirmation.location")}
              </div>
              <div className="font-medium">{t("booking.subtitle")}</div>
              <div className="text-sm text-gray-600">123 Main Street, Suite 100</div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            {t("confirmation.goBack")}
          </Button>
          <Button onClick={onConfirm} className="w-full sm:w-auto">
            {t("confirmation.confirmBooking")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}