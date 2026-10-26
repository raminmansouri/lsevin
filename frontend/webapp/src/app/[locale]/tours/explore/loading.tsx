import { ToursLoading } from "@/features/tours/ui/customer/states";

// Per-route (not segment-wide): a loading boundary above /t/[slug], /bookings/[id] or
// /destinations/[slug] would start streaming before notFound() and turn their 404s into 200s.
export default function Loading() {
  return <ToursLoading />;
}
