"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setDisplayCurrencyAction } from "../actions/currency.actions";

type CurrencyOption = { code: string; symbol: string; name: string };
type Ctx = {
  currency: string;
  defaultCurrency: string;
  options: CurrencyOption[];
  pending: boolean;
  setCurrency: (code: string) => Promise<void>;
};

const ShopCurrencyContext = createContext<Ctx | null>(null);

/** Server-resolved customer preference; only persist changes accepted by Finance. */
export function ShopCurrencyProvider({
  defaultCurrency,
  options,
  children,
}: {
  defaultCurrency: string;
  options: CurrencyOption[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("Shop");
  const [pending, setPending] = useState(false);
  const setCurrency = useCallback(
    async (code: string) => {
      const next = code.trim().toUpperCase();
      if (
        pending ||
        next === defaultCurrency ||
        !options.some((option) => option.code === next)
      )
        return;
      setPending(true);
      try {
        const result = await setDisplayCurrencyAction({ currency: next });
        if (!result.ok) throw new Error(result.error);
        router.refresh();
      } catch {
        toast.error(t("currencyChangeFailed"));
      } finally {
        setPending(false);
      }
    },
    [defaultCurrency, options, pending, router, t]
  );

  const value = useMemo<Ctx>(
    () => ({
      currency: defaultCurrency,
      defaultCurrency,
      options,
      pending,
      setCurrency,
    }),
    [defaultCurrency, options, pending, setCurrency]
  );
  return (
    <ShopCurrencyContext.Provider value={value}>
      {children}
    </ShopCurrencyContext.Provider>
  );
}

export function useShopCurrency(): Ctx {
  return (
    useContext(ShopCurrencyContext) ?? {
      currency: "",
      defaultCurrency: "",
      options: [],
      pending: false,
      setCurrency: async () => {},
    }
  );
}
