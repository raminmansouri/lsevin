"use client"

import {
  ArrowLeft,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  Upload,
  X,
  Plus,
  Shield,
  CreditCard,
  Building,
  Smartphone,
  Info,
  AlertCircle,
  BadgeCheck,
  Star,
  Car,
  Hotel as HotelIcon,
  Globe,
  Headphones,
  FileText,
  MapPin,
  Users,
  Phone,
  Mail,
  Award,
  Languages,
  ChevronLeft,
  Check,
  Percent,
  Tag
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form';
import { BookingFormValues, bookingSchema } from './types';
import { zodResolver } from '@hookform/resolvers/zod';
import ServiceSelection from './components/ServiceSelection/ServiceSelection';
import UploadFiles from './components/UploadFiles/UploadFiles';
import { useBookingCheckout } from '@/features/booking/api/client/post-booking-checkout';
import { useGetAddons } from '@/features/booking/api/client/fetch-addons';
import { useLocale } from 'next-intl';
import { useGetBookingSteps } from '@/features/booking/api/client/fetch-booking-steps';
import { useBooking } from './hooks/use-booking';
import { StepDefinitions } from './components/types/BookingTypes';

export default function BookingServiceWizardPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
    const providerIdFromUrl = searchParams.get('id'); // providerId
    const serviceIdFromUrl = searchParams.get('serviceId');
    const specialistIdFromUrl = searchParams.get('specialistId');


  const methods = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {

         providerId: providerIdFromUrl,
      serviceId: serviceIdFromUrl,
      specialistId: specialistIdFromUrl,
    },
  });

  const {
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
    handleNext,
    handleBack,
    navigate,
    step, setStep
  } = useBooking(methods);
  /* ------------------------------------------------------------------
    3️⃣  Hydrate the form when the component mounts *or* when the
         query string changes.
    ------------------------------------------------------------------ */
  useEffect(() => {


    /*  If you expect numeric IDs, cast them. */
    if (providerId) methods.setValue('providerId', providerIdFromUrl);
    if (serviceId) methods.setValue('serviceId', serviceIdFromUrl);
    if (specialistId) methods.setValue('specialistId', specialistIdFromUrl);

    /*  If the IDs are strings, just pass the string directly: */
    // if (providerId)   methods.setValue('providerId', providerId);
    // …etc.
  }, [searchParams]);   // re‑run when the URL changes

  /* ------------------------------------------------------------------
     4️⃣  Your submit logic.
     ------------------------------------------------------------------ */
  const { mutate: bookingCheckout, isPending, error } = useBookingCheckout();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bookingCheckout(methods.getValues());   // <-- send the whole form
  };

  const {
    data: stepsResponse,
    refetch: refetchBookingStepsRefetch
  } = useGetBookingSteps(
    providerId,
    serviceId,
    specialistId,
    locale);

  const steps=stepsResponse?.steps;

  const [depositOption, setDepositOption] = useState<'full' | 'deposit'>('deposit');

  const getDepositAmount = () => {
    return depositOption === "deposit"
      ? service.depositAmount
      : calculateTotal();
  };



  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-5 py-4">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleBack}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
              >
                <ArrowLeft size={20} className="text-gray-900" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">Book Treatment</h1>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {steps?.map((s, idx) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s.num
                      ? 'bg-[#083f30] text-white'
                      : 'bg-gray-200 text-gray-500'
                      }`}>
                      {step > s.num ? <CheckCircle2 size={18} /> : s.num}
                    </div>
                    <span className={`text-xs mt-1.5 font-medium ${step >= s.num ? 'text-[#083f30]' : 'text-gray-500'
                      }`}>
                      {s.label}
                    </span>
                  </div>

                  {idx < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 transition-colors ${step > s.num ? 'bg-[#083f30]' : 'bg-gray-200'
                      }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-6">
          {/* Step 1: Doctor & Date Selection */}

          {steps?.filter(f => f.num === step).map(s => {

            return (<>
              {s.components.map(c => {
                return (StepDefinitions[c]);
              })}
            </>)
          })}

        </div>

        {/* Sticky Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-xl z-50">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="h-12 px-6 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-colors active:scale-95"
              >
                Back
              </button>
            )}

            <button
              onClick={() => {
                if (step === 4 && canProceed()) {
                  navigate('/app/booking/success');
                } else if (canProceed()) {
                  handleNext();
                }
              }}
              disabled={!canProceed()}
              className={`flex-1 h-14 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${canProceed()
                ? 'bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white hover:shadow-xl active:scale-95 shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              {getButtonLabel()}
              {canProceed() && <ChevronRight size={20} />}
            </button>
          </div>

          {step === 4 && (
            <div className="text-center mt-2">
              <span className="text-sm text-gray-600">
                Total: <span className="font-bold text-[#083f30]">${calculateTotal()}</span>
              </span>
            </div>
          )}

          {/* Progress Indicator */}
          {!canProceed() && step === 1 && (
            <div className="text-center mt-2">
              <span className="text-xs text-gray-500">
                {!specialistId && 'Select a doctor to continue'}
                {specialistId && !selectedDate && 'Select a date to continue'}
                {specialistId && selectedDate && !selectedTime && 'Select a time to continue'}
              </span>
            </div>
          )}
        </div>
        {/* Sticky Bottom CTA */}
        <div className="fixed right-0 bottom-10 left-0 z-50 border-t border-gray-200 bg-white px-5 py-4 shadow-2xl">
          {" "}
          <div className="mb-3 flex items-center gap-3">
            {" "}
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex h-14 items-center gap-2 rounded-xl bg-gray-100 px-6 font-bold text-gray-900 transition-colors hover:bg-gray-200 active:scale-95"
              >
                {" "}
                <ChevronLeft size={20} /> Back{" "}
              </button>
            )}{" "}
            <button
              onClick={() => {
                if (step === 8 && canProceed()) {
                  navigate("/app/booking/success");
                } else if (canProceed()) {
                  handleNext();
                }
              }}
              disabled={!canProceed()}
              className={`flex h-14 flex-1 items-center justify-center gap-2 rounded-xl font-bold transition-all ${canProceed() ? "bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white hover:shadow-xl active:scale-95" : "cursor-not-allowed bg-gray-200 text-gray-400"}`}
            >
              {" "}
              {step === 8 ? (
                <>
                  {" "}
                  <Shield size={20} /> Confirm & Pay ${getDepositAmount()}{" "}
                </>
              ) : (
                <>
                  {" "}
                  Continue <ChevronRight size={20} />{" "}
                </>
              )}{" "}
            </button>{" "}
          </div>{" "}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            {" "}
            <Shield size={12} />{" "}
            <span>
              Secure & encrypted • {steps?.length - step} steps remaining
            </span>{" "}
          </div>{" "}
        </div>{" "}
      </div>
    </FormProvider>
  );
}