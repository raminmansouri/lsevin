"use client";
import { useFormStatus } from "react-dom";
import { Button } from "@core/ui/Button";

export function ActionSubmitButton({ label, pendingLabel, confirmText, variant = "primary" }: { label: string; pendingLabel: string; confirmText?: string; variant?: "primary"|"secondary"|"ghost"|"danger"|"destructive" }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant={variant} disabled={pending} aria-disabled={pending} onClick={(event) => { if (!pending && confirmText && !window.confirm(confirmText)) event.preventDefault(); }}>{pending ? pendingLabel : label}</Button>;
}
