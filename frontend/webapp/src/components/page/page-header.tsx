import { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * `description` used to be missing from this component's props while twelve
 * admin pages passed it — customers, payments, bookings, booking-drafts, staff,
 * identity-users, wallet-transactions and provider-policy-types among them. The
 * prop was accepted by TypeScript's JSX excess-property leniency on a spread-free
 * call and then silently dropped, so those translated subtitles rendered nowhere.
 */
export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="truncate text-lg font-semibold tracking-tight lg:text-xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}
