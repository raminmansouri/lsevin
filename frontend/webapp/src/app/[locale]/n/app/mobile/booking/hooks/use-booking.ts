import { useMemo, useState } from "react";
import { useFormContext, useWatch, UseFormReturn } from "react-hook-form";
import { BookingFormValues } from "../types";
import { useNavigate } from "@/hooks/use-navigate";
import { useLocale } from "next-intl";
import { useBookingStore } from "../components/store/BookingStore";

export function useBooking(methods?: UseFormReturn<BookingFormValues>) {
  const form = methods ?? useFormContext<BookingFormValues>();
  const { control, setValue, getValues } = form;

  const locale = useLocale();
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);

  const selectedAddons = useWatch({
    control,
    name: "addOns",
    defaultValue: [],
  });

  const providerId = useWatch({
    control,
    name: "providerId",
  });

  const serviceId = useWatch({
    control,
    name: "serviceId",
  });

  const specialistId = useWatch({
    control,
    name: "specialistId",
  });

  const paymentMethod = useWatch({
    control,
    name: "paymentMethod",
  });

  const selectedDate = useWatch({
    control,
    name: "selectedDate",
  });

  const selectedTime = useWatch({
    control,
    name: "selectedTime",
  });

  // IMPORTANT: use the real field name from BookingFormValues
  const uploadFiles = useWatch({
    control,
    name: "uploadFiles",
    defaultValue: [],
  });

  const setData = useBookingStore((s) => s.setData);
  const addons = useBookingStore((s) => s.addons);
  const services = useBookingStore((s) => s.services);
  const providers = useBookingStore((s) => s.providers);
  const specialists = useBookingStore((s) => s.specialists);

  const service = useMemo(
    () => services?.find((f) => f.id === serviceId),
    [services, serviceId]
  );

  const provider = useMemo(
    () => providers?.find((f) => f.id === providerId),
    [providers, providerId]
  );

  const selectedSpecialist = useMemo(
    () => specialists?.find((f) => f.id === specialistId),
    [specialists, specialistId]
  );

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };

  const calculateTotal = () => {
    let total = 0;

    // if addOns is string[]
    selectedAddons?.forEach((addonId: any) => {
      const addon = addons.find((a) => a.id === addonId);
      if (addon) total += addon.price;
    });

    return total;
  };

  const canProceed = () => {
    if (step === 1) return !!(providerId && serviceId && specialistId);
    if (step === 2) return true;
    if (step === 3) return true;
    if (step === 4) return !!paymentMethod;
    return false;
  };

  const getButtonLabel = () => {
    if (step === 1) return "Continue to Add-ons";
    if (step === 2)
      return selectedAddons?.length > 0
        ? "Continue to Medical Files"
        : "Skip to Medical Files";
    if (step === 3)
      return uploadFiles?.length > 0
        ? "Continue to Review"
        : "Skip to Review";
    if (step === 4) return "Confirm & Pay";
    return "Continue";
  };

  return {
    setData,
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
    uploadFiles,
    service,
    provider,
    selectedSpecialist,
    providerId,
    serviceId,
    specialistId,
    paymentMethod,
    setValue,
    handleNext,
    handleBack,
    step,
    setStep,
    navigate,
    locale,
    getValues,
  };
}