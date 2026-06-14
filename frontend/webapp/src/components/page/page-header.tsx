import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  children,
  className,
}: {
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <h1 className="text-lg font-semibold lg:text-xl">{title}</h1>
      {children && <div>{children}</div>}
    </div>
  );
}
