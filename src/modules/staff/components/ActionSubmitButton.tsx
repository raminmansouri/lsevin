"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@core/ui/Button";

export function ActionSubmitButton({
  label,
  pendingLabel,
  confirmText,
  ariaLabel,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  label: string;
  pendingLabel: string;
  confirmText?: string;
  ariaLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "destructive";
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      aria-disabled={pending}
      aria-label={ariaLabel || label}
      onClick={(event) => {
        if (!pending && confirmText && !window.confirm(confirmText)) event.preventDefault();
      }}
    >
      {pending ? pendingLabel : <>{children}{label}</>}
    </Button>
  );
}
