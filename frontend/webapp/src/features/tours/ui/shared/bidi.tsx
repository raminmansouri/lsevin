import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Bidi isolation for runs whose direction differs from the surrounding text —
 * names, booking ids, phone numbers, prices, coordinates (C-119, S-069, AT-44).
 *
 * `dir="ltr"` for values that are always Latin (voucher codes, phone numbers,
 * coordinates); `auto` for user/provider-authored names.
 */
export function Bdi({
  children,
  dir = "auto",
  className,
  testId,
}: {
  children: ReactNode;
  dir?: "ltr" | "rtl" | "auto";
  className?: string;
  testId?: string;
}) {
  return (
    <bdi dir={dir} className={cn("[unicode-bidi:isolate]", className)} data-testid={testId} data-latin-digits="">
      {children}
    </bdi>
  );
}
