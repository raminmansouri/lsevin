import { getMyBookingByIdAction } from "@/booking/actions/get-my-booking-by-id";
import type { GetBookingByIdResponse } from "../../types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { IProblem } from "@/types/error";
import type { FilterParams } from "@/types/filter";

interface GetBookingByIdFilterParams extends Partial<FilterParams> {
  id?: string;
}

const fetchGetBookingById = async (
  filters?: GetBookingByIdFilterParams
): Promise<GetBookingByIdResponse> => {
  const id = String(filters?.id || "").trim();
  if (!id) {
    const problem: IProblem = {
      title: "Booking id is required",
      status: 400,
      detail: "The booking detail page requires a booking id.",
    };
    throw problem;
  }

  const result = await getMyBookingByIdAction({ id });

  if (result?.error) {
    throw result.error;
  }

  if (!result?.data) {
    const problem: IProblem = {
      title: "Booking not found",
      status: 404,
      detail: "This booking does not exist or does not belong to your account.",
    };
    throw problem;
  }

  return result.data;
};

const BOOKING_DETAIL_QUERY_KEY = "my-booking-detail";
const queryKey = (id?: string) => [BOOKING_DETAIL_QUERY_KEY, id ?? ""] as const;

export const useFetchGetBookingById = (filters?: GetBookingByIdFilterParams) => {
  const id = String(filters?.id || "").trim();

  const options = queryOptions<GetBookingByIdResponse, IProblem>({
    queryKey: queryKey(id),
    queryFn: () => fetchGetBookingById({ id }),
    enabled: Boolean(id),
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
