import { getMyBookingsAction } from "@/booking/actions/get-my-bookings";
import type { BookingsResponse } from "../../types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { IProblem } from "@/types/error";
import type { FilterParams } from "@/types/filter";

interface BookingsFilterParams extends FilterParams {
  status?: "upcoming" | "past" | "cancelled";
}

const EMPTY_BOOKINGS: BookingsResponse = {
  upcomingBookings: [],
  pastBookings: [],
  cancelledBookings: [],
};

const fetchBookings = async (
  filters?: BookingsFilterParams
): Promise<BookingsResponse> => {
  const result = await getMyBookingsAction({
    status: filters?.status,
  });

  if (result?.error) {
    throw result.error;
  }

  return result?.data ?? EMPTY_BOOKINGS;
};

const BOOKING_LIST_QUERY_KEY = "my-bookings";
const queryKey = (filters?: BookingsFilterParams) =>
  [BOOKING_LIST_QUERY_KEY, filters?.status ?? "all"] as const;

export const useFetchBookings = (filters?: BookingsFilterParams) => {
  const options = queryOptions<BookingsResponse, IProblem>({
    queryKey: queryKey(filters),
    queryFn: () => fetchBookings(filters),
    enabled: true,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data, error, isFetching, refetch } = useQuery(options);
  return {
    data,
    error,
    isFetching,
    refetch,
  };
};
