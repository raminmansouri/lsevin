"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";

import { FORM_ERRORS_TRANSLATION_KEY } from "@/features/shared/types/constants";
import { setupZodLocalization } from "@/lib/zod/setup-zod-localization";
import { LocaleTypes } from "@/types/common";

interface ZodErrorProviderProps {
  componentNamespace: string;
  children: React.ReactNode;
}

export function ZodErrorProvider({
  componentNamespace,
  children,
}: ZodErrorProviderProps) {
  const locale = useLocale() as LocaleTypes;
  const componentT = useTranslations(componentNamespace);
  const globalT = useTranslations(FORM_ERRORS_TRANSLATION_KEY);

  useEffect(() => {
    // Re-configure Zod with global error map that has access to translations
    setupZodLocalization(locale, componentT, globalT);
  }, [locale, componentT, globalT]);

  return <>{children}</>;
}
