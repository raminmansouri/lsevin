"use client";

import { ChangeEvent, ReactNode, useTransition } from "react";
import clsx from "clsx";
import { Locale } from "next-intl";
import { useParams } from "next/navigation";

import { usePathname, useRouter } from "@/i18n/navigation";
import { markLocaleChosenExplicitly } from "@/i18n/locale-by-country";

type Props = {
  children: ReactNode;
  defaultValue: string;
  label: string;
};

export default function LocaleSwitcherSelect({
  children,
  defaultValue,
  label,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const params = useParams();

  function onSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value as Locale;
    document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000;samesite=lax`;
    // Lock in the explicit choice so location-based auto-switching won't override it.
    markLocaleChosenExplicitly();
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        { pathname, params },
        { locale: nextLocale }
      );
    });
  }

  return (
    <label
      className={clsx(
        "text-muted-foreground relative",
        isPending && "transition-opacity [&:disabled]:opacity-30"
      )}
    >
      <p className="sr-only">{label}</p>
      <select
        className="inline-flex appearance-none bg-transparent py-3 pr-6 pl-2"
        defaultValue={defaultValue}
        disabled={isPending}
        onChange={onSelectChange}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute top-[8px] right-2">⌄</span>
    </label>
  );
}
