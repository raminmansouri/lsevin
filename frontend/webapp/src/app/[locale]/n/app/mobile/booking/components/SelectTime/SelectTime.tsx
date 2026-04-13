import { useFormContext } from "react-hook-form";
import { useBooking } from "../../hooks/use-booking";
import { useGetAvailableTimeslots } from "@/features/booking/api/client/fetch-available-timeslots";



export const SelectTime = () => {
    
      const {
        setValue,
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
        step, setStep,
        locale
      } = useBooking();
    // const { setValue, resetField } = useFormContext();

    const {
      data: availableTimesResponse,
      refetch: refetchAvailableTimes
    } = useGetAvailableTimeslots(
      selectedDate,
      providerId,
      serviceId,
      specialistId,
      locale);


    return (<>
      {/* Select Time */}
      {selectedDate && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Time</h2>
          <div className="grid grid-cols-2 gap-3">
            {availableTimesResponse?.slots?.map(slot => (
              <button
                key={slot.time}
                onClick={() => {
                  if (slot.available) {
                    setValue('selectedTime', slot.time)
                  }
                }}
                disabled={!slot.available}
                className={`h-14 rounded-xl flex items-center justify-center font-semibold transition-all ${selectedTime === slot.time
                  ? 'bg-[#083f30] text-white shadow-md'
                  : slot.available
                    ? 'bg-white border-2 border-gray-200 hover:border-[#083f30] text-gray-900'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        </div>
      )}</>)
  }