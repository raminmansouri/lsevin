"use client";

import { useRef, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";

export function BookingDialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const opener = useRef(
    typeof document === "undefined"
      ? null
      : (document.activeElement as HTMLElement | null)
  );
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (opener.current?.isConnected) opener.current.focus();
          }}
          className="fixed inset-x-0 bottom-0 z-[101] max-h-[90dvh] overflow-y-auto overscroll-contain rounded-t-[28px] bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px]"
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
