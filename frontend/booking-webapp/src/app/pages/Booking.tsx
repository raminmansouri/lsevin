import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BookingSelection, Service, Professional } from "../types/booking";
import {
  mockProfessionals,
  mockServices,
  mockSchedules,
  generateTimeSlots,
} from "../data/mockData";
import { ProfessionalSelector } from "../components/ProfessionalSelector";
import { DateSelector } from "../components/DateSelector";
import { TimeSlotSelector } from "../components/TimeSlotSelector";
import { BookingSummary } from "../components/BookingSummary";
import { ServiceSelector } from "../components/ServiceSelector";
import { AuthDialog } from "../components/AuthDialog";
import { BookingConfirmation } from "../components/BookingConfirmation";
import { ServiceDetailsModal } from "../components/ServiceDetailsModal";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function Booking() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selection, setSelection] = useState<BookingSelection>({ services: [] });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [selectedServiceForDetails, setSelectedServiceForDetails] = useState<Service | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [step, setStep] = useState<"service" | "details">("service");

  // Calculate total duration of all selected services
  const getTotalDuration = () => {
    return (selection.services || []).reduce((sum, service) => sum + service.duration, 0);
  };

  // Update available slots when professional or date changes
  useEffect(() => {
    if (selection.date && selection.services && selection.services.length > 0) {
      let slots: string[] = [];
      const totalDuration = getTotalDuration();

      if (selection.professional && selection.professional !== "any") {
        const schedule = mockSchedules.find(
          (s) => s.professionalId === selection.professional.id
        );
        if (schedule) {
          slots = generateTimeSlots(selection.date, totalDuration, schedule);
        }
      } else {
        // Get all available slots from all professionals
        const allSlots = new Set<string>();
        mockSchedules.forEach((schedule) => {
          const professionalSlots = generateTimeSlots(
            selection.date!,
            totalDuration,
            schedule
          );
          professionalSlots.forEach((slot) => allSlots.add(slot));
        });
        slots = Array.from(allSlots).sort();
      }

      setAvailableSlots(slots);
    }
  }, [selection.date, selection.professional, selection.services]);

  const handleToggleService = (service: Service) => {
    setSelection((prev) => {
      const services = prev.services || [];
      const isSelected = services.some((s) => s.id === service.id);

      if (isSelected) {
        return { ...prev, services: services.filter((s) => s.id !== service.id) };
      } else {
        return { ...prev, services: [...services, service] };
      }
    });
  };

  const handleRemoveService = (serviceId: string) => {
    setSelection((prev) => ({
      ...prev,
      services: (prev.services || []).filter((s) => s.id !== serviceId),
    }));
  };

  const handleViewDetails = (service: Service) => {
    setSelectedServiceForDetails(service);
    setShowServiceDetails(true);
  };

  const handleContinueToDetails = () => {
    if (!selection.services || selection.services.length === 0) {
      toast.error(t("booking.selectService"));
      return;
    }
    setStep("details");
  };

  const handleProfessionalSelect = (professional: Professional | "any") => {
    setSelection((prev) => ({ ...prev, professional }));
  };

  const handleDateSelect = (date: Date) => {
    setSelection((prev) => ({ ...prev, date, timeSlot: undefined }));
  };

  const handleTimeSlotSelect = (slot: string) => {
    setSelection((prev) => ({ ...prev, timeSlot: slot }));
  };

  const handleContinue = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
    } else {
      setShowConfirmation(true);
    }
  };

  const handleConfirmBooking = () => {
    toast.success(t("confirmation.bookingConfirmed"), {
      description: t("confirmation.appointmentScheduled", {
        date: selection.date?.toLocaleDateString(),
        time: selection.timeSlot,
      }),
    });
    setShowConfirmation(false);
    // Reset the booking or navigate to a success page
    setTimeout(() => {
      setSelection({ services: [] });
      setStep("service");
    }, 2000);
  };

  const isBookingComplete =
    selection.services &&
    selection.services.length > 0 &&
    selection.professional &&
    selection.date &&
    selection.timeSlot;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {step === "details" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStep("service")}
                  className="flex-shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold truncate">
                  {t("booking.title")}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {t("booking.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <LanguageSwitcher />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin")}
                className="hidden sm:flex"
              >
                {t("booking.adminPanel")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Left Column - Booking Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {step === "service" ? (
              <>
                <Card className="p-4 sm:p-6">
                  <ServiceSelector
                    services={mockServices}
                    selectedServices={selection.services || []}
                    onToggleService={handleToggleService}
                    onViewDetails={handleViewDetails}
                  />
                </Card>

                {/* Continue Button for Mobile */}
                {selection.services && selection.services.length > 0 && (
                  <Button
                    onClick={handleContinueToDetails}
                    className="w-full lg:hidden"
                    size="lg"
                  >
                    {t("booking.continueToConfirm")}
                  </Button>
                )}
              </>
            ) : (
              <>
                {/* Selected Services Display */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">
                        {t("booking.selectedServices")}
                      </div>
                      <div className="font-semibold">
                        {selection.services?.length || 0} {t("booking.services")}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStep("service")}
                    >
                      {t("booking.change")}
                    </Button>
                  </div>
                </Card>

                {/* Professional Selection */}
                <Card className="p-4 sm:p-6">
                  <ProfessionalSelector
                    professionals={mockProfessionals}
                    selected={selection.professional}
                    onSelect={handleProfessionalSelect}
                  />
                </Card>

                {/* Date Selection */}
                {selection.professional && (
                  <Card className="p-4 sm:p-6">
                    <DateSelector
                      selectedDate={selection.date}
                      onSelectDate={handleDateSelect}
                    />
                  </Card>
                )}

                {/* Time Slot Selection */}
                {selection.date && (
                  <Card className="p-4 sm:p-6">
                    <TimeSlotSelector
                      slots={availableSlots}
                      selectedSlot={selection.timeSlot}
                      onSelectSlot={handleTimeSlotSelect}
                    />
                  </Card>
                )}

                {/* Continue Button */}
                {isBookingComplete && (
                  <Button onClick={handleContinue} className="w-full" size="lg">
                    {isAuthenticated
                      ? t("booking.continueToConfirm")
                      : t("booking.continueToLogin")}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <BookingSummary
                selection={selection}
                onRemoveService={step === "service" ? handleRemoveService : undefined}
              />
              {step === "service" &&
                selection.services &&
                selection.services.length > 0 && (
                  <Button
                    onClick={handleContinueToDetails}
                    className="w-full mt-4 hidden lg:flex"
                    size="lg"
                  >
                    {t("booking.continueToConfirm")}
                  </Button>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Auth Dialog */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onAuthenticated={() => {
          setIsAuthenticated(true);
          setShowConfirmation(true);
        }}
      />

      {/* Booking Confirmation */}
      <BookingConfirmation
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        selection={selection}
        onConfirm={handleConfirmBooking}
      />

      {/* Service Details Modal */}
      <ServiceDetailsModal
        service={selectedServiceForDetails}
        open={showServiceDetails}
        onOpenChange={setShowServiceDetails}
      />
    </div>
  );
}
