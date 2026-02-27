import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Service } from "../types/booking";
import { Clock, Tag } from "lucide-react";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";

interface ServiceDetailsModalProps {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceDetailsModal({
  service,
  open,
  onOpenChange,
}: ServiceDetailsModalProps) {
  const { t } = useTranslation();

  if (!service) return null;

  const discountPercent = service.originalPrice
    ? Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{service.name}</DialogTitle>
          <DialogDescription>{service.category}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Description */}
          {service.description && (
            <div>
              <h4 className="font-semibold mb-2">{t("serviceDetails.description")}</h4>
              <p className="text-gray-600">{service.description}</p>
            </div>
          )}

          <Separator />

          {/* What's Included */}
          <div>
            <h4 className="font-semibold mb-3">{t("serviceDetails.included")}</h4>
            <div className="space-y-3">
              {service.actions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{action.name}</div>
                    {action.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        {action.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600 ml-4">
                    <Clock className="h-4 w-4" />
                    <span>{action.duration} {t("booking.minutes")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Pricing and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">
                {t("serviceDetails.duration")}
              </div>
              <div className="text-2xl font-bold">{service.duration}</div>
              <div className="text-sm text-gray-600">{t("booking.minutes")}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">
                {t("serviceDetails.price")}
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">
                  {service.price.toLocaleString()} JOD
                </div>
                {service.originalPrice && (
                  <div className="text-sm text-gray-500 line-through">
                    {service.originalPrice.toLocaleString()}
                  </div>
                )}
              </div>
              {discountPercent > 0 && (
                <Badge variant="secondary" className="mt-2">
                  <Tag className="h-3 w-3 mr-1" />
                  {t("booking.save")} {discountPercent}%
                </Badge>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
