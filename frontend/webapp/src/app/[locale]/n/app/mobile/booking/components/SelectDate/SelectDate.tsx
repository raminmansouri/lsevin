import { useGetAvailableDates } from "@/features/booking/api/client/fetch-available-dates";
import { useFormContext } from "react-hook-form";
import { useBooking } from "../../hooks/use-booking";
import { useLocale } from "next-intl";
import { ChevronRight } from "lucide-react";



export const SelectDate = () => {
  const { setValue, resetField } = useFormContext();

  const {
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
  } = useBooking();
  const locale = useLocale();

  const {
    data: availableDatesResponse,
    refetch: refetchAvailableDates
  } = useGetAvailableDates(
    providerId,
    serviceId,
    specialistId,
    locale);

  return (<>

    {/* Select Date */}
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Select Date</h2>
      <div className="bg-white rounded-2xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight size={20} className="text-gray-600 rotate-180" />
          </button>
          <span className="font-bold text-gray-900">March 2026</span>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {availableDatesResponse?.dates?.map(date => (
            <button
              key={date.date}
              onClick={() => {
                if (date.available) {
                  setValue('selectedDate', date.date)
                }
              }

              }
              disabled={!date.available}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${selectedDate === date.date
                ? 'bg-[#083f30] text-white shadow-md'
                : date.available
                  ? 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
              <span className="text-xs mb-0.5">{date.day}</span>
              <span className="font-bold">{date.date.split('-')[2]}</span>
            </button>
          ))}
        </div>
      </div>
    </div></>)
}