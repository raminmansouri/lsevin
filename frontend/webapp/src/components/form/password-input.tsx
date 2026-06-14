"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function PasswordInput({ className, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const disabled =
    props.value === "" || props.value === undefined || props.disabled;

  return (
    <div className="relative" data-slot="password-input">
      <Input
        type={showPassword ? "text" : "password"}
        className={cn(
          "hide-password-toggle text-start ltr:pr-10 rtl:pl-10",
          className
        )}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute top-0 h-full px-3 py-2 hover:bg-transparent focus:bg-transparent active:bg-transparent ltr:right-0 rtl:left-0"
        onClick={() => setShowPassword((prev) => !prev)}
        disabled={disabled}
      >
        {showPassword && !disabled ? (
          <EyeOff className="text-muted-foreground size-4" aria-hidden="true" />
        ) : (
          <Eye className="text-muted-foreground size-4" aria-hidden="true" />
        )}
        <span className="sr-only">
          {showPassword ? "Hide password" : "Show password"}
        </span>
      </Button>

      {/* hides browsers password toggles */}
      <style>{`
        .hide-password-toggle::-ms-reveal,
        .hide-password-toggle::-ms-clear {
          visibility: hidden;
          pointer-events: none;
          display: none;
        }
      `}</style>
    </div>
  );
}

export { PasswordInput };
