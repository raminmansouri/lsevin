"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { useRouter } from "@/i18n/navigation";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick"> & {
  path: string;
  children: ReactNode;
};

/** Account actions stay keyboard-accessible without advertising private URLs as links. */
export function PrivateNavigationButton({ path, children, ...props }: Props) {
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.push(path)} {...props}>
      {children}
    </button>
  );
}
