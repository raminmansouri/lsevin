"use client";

import { ToursErrorScreen } from "@/features/tours/ui/customer/states";

export default function ToursError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ToursErrorScreen onRetry={reset} />;
}
