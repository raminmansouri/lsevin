"use client";

import { ComponentProps } from "react";
import clsx from "clsx";
import { useSelectedLayoutSegment } from "next/navigation";

import { Link } from "@/i18n/navigation";

export default function NavigationLink({
  href,
  ...rest
}: ComponentProps<typeof Link>) {
  const selectedLayoutSegment = useSelectedLayoutSegment();
  const pathname = selectedLayoutSegment ? `/${selectedLayoutSegment}` : "/";
  const isActive = pathname === href;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={clsx(
        "inline-block px-2 py-3 transition-colors",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-muted-foreground/80"
      )}
      href={href}
      {...rest}
    />
  );
}
