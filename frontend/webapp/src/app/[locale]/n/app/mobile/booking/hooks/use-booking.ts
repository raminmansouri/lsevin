import { useMemo, useState } from "react";
import { useBookingStore } from "../components/store/BookingStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookingFormValues, bookingSchema } from "../types";
import { useNavigate } from "@/hooks/use-navigate";
import { useLocale } from "next-intl";


export function useBooking() {
  const methods = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
    },
  });
  const locale = useLocale();


  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };




  const [providerId, serviceId, specialistId, paymentMethod] = methods.watch([
    'providerId',
    'serviceId',
    'specialistId',
    'paymentMethod',
  ]) as [string | undefined, string | undefined, string | undefined, string | undefined];

  // const { serviceId } = router.get;

  const addons = useBookingStore((s) => s.addons)
  const selectedAddons = useBookingStore((s) => s.booking?.addOns)
  const services = useBookingStore((s) => s.services)
  const providers = useBookingStore((s) => s.providers)
  const specialists = useBookingStore((s) => s.specialists)
  const selectedDate = useBookingStore((s) => s.booking?.selectedDate)
  const selectedTime = useBookingStore((s) => s.booking?.selectedTime)
  const uploadedFiles = useBookingStore((s) => s.booking?.uploadFiles)


  const service = useMemo(() => services.find(f => f.id == serviceId), [services, serviceId])
  const provider = useMemo(() => providers.find(f => f.id == providerId), [providers, providerId])
  const selectedSpecialist = useMemo(() => specialists.find(f => f.id == specialistId), [specialists, specialistId])



  const calculateTotal = () => {
    // const service = services.find(s => s.id === selectedService);
    let total = 0 //service?.price || 0;
    selectedAddons.forEach(addonId => {
      const addon = addons.find(a => a.id === addonId);
      if (addon) total += addon.price;
    });
    return total;
  };


  const canProceed = () => {
    if (step === 1) return providerId && serviceId && specialistId;
    if (step === 2) return true; // Add-ons are optional
    if (step === 3) return true; // Medical files are optional for now (can be uploaded later)
    if (step === 4) return paymentMethod;
    return false;
  };

  const getButtonLabel = () => {
    if (step === 1) return 'Continue to Add-ons';
    if (step === 2) return selectedAddons.length > 0 ? 'Continue to Medical Files' : 'Skip to Medical Files';
    if (step === 3) return uploadedFiles.length > 0 ? 'Continue to Review' : 'Skip to Review';
    if (step === 4) return 'Confirm & Pay';
    return 'Continue';
  };
  return {
    getButtonLabel,
    canProceed,
    calculateTotal,
    addons,
    selectedAddons,
    services,
    providers,
    specialists,
    selectedDate,
    selectedTime,
    uploadedFiles,
    service,
    provider,
    selectedSpecialist,
    providerId,
    serviceId,
    specialistId,
    paymentMethod,
    setValue: methods.setValue, handleNext,
    handleBack,
    step, setStep,
    navigate,
    locale
  }
}