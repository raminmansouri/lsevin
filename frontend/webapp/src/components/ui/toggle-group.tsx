"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { type VariantProps } from "class-variance-authority";
import { useLocale } from "next-intl";

import { toggleVariants } from "@/components/ui/toggle";
import { getDirection } from "@/config/locales";
import { cn } from "@/lib/utils";
import { LocaleTypes } from "@/types/common";

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
});

function ToggleGroup({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  const locale = useLocale();
  return (
    <ToggleGroupPrimitive.Root
      dir={getDirection(locale as LocaleTypes)}
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext);
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        "min-w-0 flex-1 shrink-0 rounded-none shadow-none focus:z-10 focus-visible:z-10",
        // LTR rounded corners
        "ltr:first:rounded-l-md ltr:last:rounded-r-md",
        // RTL rounded corners
        "rtl:first:rounded-r-md rtl:last:rounded-l-md",
        // Border handling for outline variant
        "data-[variant=outline]:border-l-0",
        "data-[variant=outline]:ltr:first:border-l",
        "data-[variant=outline]:rtl:first:border-r",
        "data-[variant=outline]:rtl:border-l",
        "data-[variant=outline]:rtl:border-r-0",
        "data-[variant=outline]:rtl:last:border-r",
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem };
