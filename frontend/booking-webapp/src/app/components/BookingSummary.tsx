import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { BookingSelection } from "../types/booking";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { Calendar, Clock, User, ShoppingCart, Tag, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface BookingSummaryProps {
  selection: BookingSelection;
  onRemoveService?: (serviceId: string) => void;
}

export function BookingSummary({ selection, onRemoveService }: BookingSummaryProps) {
  const { t } = useTranslation();
  const { services = [], professional, date, timeSlot, endDate, timeSlots } = selection;

  const calculateTotal = () => {
    return services.reduce((sum, service) => sum + service.price, 0);
  };

  const calculateOriginalTotal = () => {
    return services.reduce(
      (sum, service) => sum + (service.originalPrice || service.price),
      0
    );
  };

  const totalDiscount = calculateOriginalTotal() - calculateTotal();

  if (services.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-4">{t("booking.bookingSummary")}</h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <ShoppingCart className="h-12 w-12 mb-2" />
          <p className="text-sm text-center">{t("booking.selectService")}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">{t("booking.bookingSummary")}</h3>

      <div className="space-y-4">
        {/* Services */}
        <div>
          <div className="text-sm text-gray-500 mb-3">
            {t("booking.selectedServices")} ({services.length})
          </div>
          <div className="space-y-3">
            {services.map((service) => {
              const discountPercent = service.originalPrice
                ? Math.round(
                    ((service.originalPrice - service.price) / service.originalPrice) * 100
                  )
                : 0;

              return (
                <div
                  key={service.id}
                  className="p-3 bg-gray-50 rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-gray-600">
                        {service.duration} {t("booking.minutes")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-semibold">
                          {service.price.toLocaleString()} JOD
                        </div>
                        {service.originalPrice && (
                          <div className="text-xs text-gray-500 line-through">
                            {service.originalPrice.toLocaleString()} JOD
                          </div>
                        )}
                      </div>
                      {onRemoveService && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => onRemoveService(service.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {discountPercent > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {t("booking.save")} {discountPercent}%
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Professional */}
        {professional && (
          <>
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-500 mb-1">
                  {t("booking.professional")}
                </div>
                <div className="font-medium truncate">
                  {professional === "any"
                    ? t("booking.anyAvailable")
                    : professional.name}
                </div>
                {professional !== "any" && (
                  <div className="text-sm text-gray-600">{professional.role}</div>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Date */}
        {date && (
          <>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-500 mb-1">{t("booking.date")}</div>
                <div className="font-medium">
                  {format(date, "EEEE, MMMM d, yyyy")}
                </div>
                {endDate && (
                  <div className="text-sm text-gray-600 mt-1">
                    to {format(endDate, "EEEE, MMMM d, yyyy")}
                  </div>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Time */}
        {(timeSlot || (timeSlots && timeSlots.length > 0)) && (
          <>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-500 mb-1">{t("booking.time")}</div>
                <div className="font-medium">
                  {timeSlot || (timeSlots && timeSlots.join(", "))}
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Pricing Summary */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t("booking.subtotal")}</span>
            <span>{calculateOriginalTotal().toLocaleString()} JOD</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{t("booking.discount")}</span>
              <span>-{totalDiscount.toLocaleString()} JOD</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-semibold">{t("booking.total")}</span>
            <span className="text-2xl font-bold">
              {calculateTotal().toLocaleString()} JOD
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
