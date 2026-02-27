import { useTranslation } from "react-i18next";
import { Service } from "../types/booking";
import { Card } from "./ui/card";
import { Clock, DollarSign, Plus, Minus, Info, Tag } from "lucide-react";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface ServiceSelectorProps {
  services: Service[];
  selectedServices: Service[];
  onToggleService: (service: Service) => void;
  onViewDetails: (service: Service) => void;
}

export function ServiceSelector({
  services,
  selectedServices,
  onToggleService,
  onViewDetails,
}: ServiceSelectorProps) {
  const { t } = useTranslation();

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const isSelected = (service: Service) =>
    selectedServices.some((s) => s.id === service.id);

  const getDiscountPercent = (service: Service) => {
    if (!service.originalPrice) return 0;
    return Math.round(
      ((service.originalPrice - service.price) / service.originalPrice) * 100
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold">{t("booking.selectService")}</h3>

      {Object.entries(groupedServices).map(([category, categoryServices]) => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-medium text-gray-600">{category}</h4>
          <div className="grid gap-3">
            {categoryServices.map((service) => {
              const selected = isSelected(service);
              const discountPercent = getDiscountPercent(service);

              return (
                <Card
                  key={service.id}
                  className={cn(
                    "p-4 transition-all hover:shadow-md",
                    selected ? "border-black border-2 bg-blue-50/50" : "border-gray-200"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Service Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-lg mb-1">
                            {service.name}
                          </h5>
                          {service.requiresMultipleDays && (
                            <Badge variant="outline" className="mb-2">
                              {t("booking.multiDayService", {
                                days: service.numberOfDays,
                              })}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold text-lg">
                            {service.price.toLocaleString()} JOD
                          </div>
                          {service.originalPrice && (
                            <div className="text-sm text-gray-500 line-through">
                              {service.originalPrice.toLocaleString()} JOD
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions List */}
                      <div className="space-y-1 mb-3">
                        {service.actions.map((action, idx) => (
                          <div
                            key={action.id}
                            className="flex items-center gap-2 text-sm text-gray-600"
                          >
                            <span>•</span>
                            <span>{action.name}</span>
                            <span className="text-xs">({action.duration} {t("booking.minutes")})</span>
                          </div>
                        ))}
                      </div>

                      {/* Bottom Info */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{service.duration} {t("booking.minutes")}</span>
                        </div>
                        {discountPercent > 0 && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            <Tag className="h-3 w-3 mr-1" />
                            {t("booking.save")} {discountPercent}%
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-blue-600 hover:text-blue-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(service);
                          }}
                        >
                          <Info className="h-4 w-4 mr-1" />
                          {t("booking.viewDetails")}
                        </Button>
                      </div>
                    </div>

                    {/* Add/Remove Button */}
                    <Button
                      variant={selected ? "destructive" : "default"}
                      size="sm"
                      onClick={() => onToggleService(service)}
                      className="flex-shrink-0"
                    >
                      {selected ? (
                        <>
                          <Minus className="h-4 w-4 mr-2" />
                          {t("booking.removeService")}
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          {t("booking.addService")}
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
