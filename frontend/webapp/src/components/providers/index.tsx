"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

import useDirection from "@/hooks/use-direction";

import PersianDigits from "@/components/persian-digits";

import AuthProvider from "./auth-provider";
import QueryProvider from "./react-query-provider";
import { ThemeProvider } from "./theme-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const { dir } = useDirection();
  return (
    <AuthProvider>
      <NuqsAdapter>
        <ThemeProvider>
          <PersianDigits />
          <QueryProvider>{children}</QueryProvider>
          <Toaster
            dir={dir}
            style={{
              fontFamily: "var(--font-family)",
              fontSize: "var(--font-size)",
              left: dir === "rtl" ? "auto" : "50%",
              right: dir === "rtl" ? "50%" : "auto",
              transform: dir === "rtl" ? "translateX(50%)" : "translateX(-50%)",
              width: "calc(100% - 16px)",
            }}
          />
        </ThemeProvider>
      </NuqsAdapter>
    </AuthProvider>
  );
}
