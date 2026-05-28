import { BookingCheckoutPayload, BookingCheckoutResponse } from "@/app/[locale]/n/app/mobile/booking/components/types/BookingTypes";
import { postData } from "@/config/http/http-service.client";
import { IProblem } from "@/types/error";
import { useMutation, useQueryClient } from "@tanstack/react-query";


const bookingCheckoutClient = async (
  payload: BookingCheckoutPayload
): Promise<BookingCheckoutResponse> => {
  return await postData<BookingCheckoutPayload,BookingCheckoutResponse>('/booking/createProvider', payload);
};

export const useBookingCheckout = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    BookingCheckoutResponse,          // Success data type
    IProblem,                        // Error type
    BookingCheckoutPayload            // Variables type (the payload we send)
  >({
    mutationFn: bookingCheckoutClient,
    // Invalidate the *GET* list so the UI automatically refetches it
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [/* whatever tag you use for the list query */ 'booking-getBookingGetProvidersByServiceAndSpecialistResponse'],
      });
    },
    // Optional: optimistic update, rollback on error, etc.
  });

  return mutation;
};