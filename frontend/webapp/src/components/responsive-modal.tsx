import { useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { useLocale } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getDirection } from "@/config/locales";
import useDevice from "@/hooks/use-device";
import { cn } from "@/lib/utils";
import { LocaleTypes } from "@/types/common";

import { ScrollArea } from "./ui/scroll-area";

const sheetVariants = cva("border-border bg-card px-0 pb-6 shadow-lg", {
  variants: {
    size: {
      sm: "sm:max-w-sm",
      default: "sm:max-w-md",
      lg: "sm:max-w-lg",
      xl: "sm:max-w-xl",
      "2xl": "sm:max-w-2xl",
      "3xl": "sm:max-w-3xl",
      "4xl": "sm:max-w-4xl",
      full: "sm:max-w-full",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface ResponsiveModalProps extends VariantProps<typeof sheetVariants> {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  isSheet?: boolean;
  disableInputRepositioning?: boolean;
}

export const ResponsiveModal = ({
  children,
  open,
  onOpenChange,
  title = "Dialog",
  description = "Dialog content",
  isSheet = false,
  size,
  disableInputRepositioning = true,
}: ResponsiveModalProps) => {
  const { isDesktop } = useDevice();
  const locale = useLocale();
  const direction = getDirection(locale as LocaleTypes);

  useEffect(() => {
    const mainContent = document.querySelector("main");

    if (open) {
      // Apply inert to main content when modal is open
      if (mainContent) {
        mainContent.setAttribute("inert", "true");
      }
    } else {
      // Remove inert from main content when modal is closed
      if (mainContent) {
        mainContent.removeAttribute("inert");
      }
    }

    // Cleanup function to ensure inert is removed when component unmounts
    return () => {
      if (mainContent) {
        mainContent.removeAttribute("inert");
      }
    };
  }, [open]);

  if (isDesktop) {
    if (isSheet) {
      return (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="right"
            dir={direction}
            className={cn(sheetVariants({ size }))}
          >
            <SheetHeader className="px-6 pt-6">
              <SheetTitle className={cn(!title && "sr-only")}>
                {title}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {description}
              </SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto px-6">{children}</div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          dir={direction}
          className="border-border bg-card max-w-3xl p-0 shadow-lg backdrop-blur-sm"
        >
          <DialogTitle className={cn(!title && "sr-only", "px-6 pt-6")}>
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {description}
          </DialogDescription>
          <div className="max-h-screen-header overflow-y-auto px-6">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      repositionInputs={!disableInputRepositioning}
    >
      <DrawerContent
        dir={direction}
        className={cn(
          "max-h-screen-header",
          "border-border bg-card",
          disableInputRepositioning && [
            // CSS env() automatically returns 0 when no keyboard is present
            "pb-[max(1rem,env(keyboard-inset-bottom,0px))]",
            // Fallback for browsers without env() support
            "pb-[max(1rem,var(--keyboard-height,0px))]",
          ]
        )}
      >
        <DrawerHeader className="focus-visible:outline-hidden">
          <DrawerTitle className={cn(!title && "sr-only")}>{title}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="overflow-y-auto px-4 pb-4">
          {children}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};
