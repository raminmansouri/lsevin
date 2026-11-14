"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export const STAYS_ADMIN_BASE = "/admin/stays";

const SECTIONS = [
  { key: "dashboard", href: STAYS_ADMIN_BASE },
  { key: "settings", href: `${STAYS_ADMIN_BASE}/settings` },
  { key: "cities", href: `${STAYS_ADMIN_BASE}/cities` },
  { key: "properties", href: `${STAYS_ADMIN_BASE}/properties` },
  { key: "bookings", href: `${STAYS_ADMIN_BASE}/bookings` },
  { key: "reviews", href: `${STAYS_ADMIN_BASE}/reviews` },
] as const;

/** Section tabs in data-entry order: settings → destinations → stays, then daily operations. */
export function StaysAdminNav() {
  const t = useTranslations("StayAdmin.nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("label")} className="-mx-1 overflow-x-auto" data-testid="stays-admin-nav">
      <ul className="flex min-w-max gap-1 px-1 pb-1">
        {SECTIONS.map((s) => {
          const active = s.href === STAYS_ADMIN_BASE ? pathname === s.href : pathname === s.href || pathname.startsWith(`${s.href}/`);
          return (
            <li key={s.key}>
              <Link
                href={s.href}
                aria-current={active ? "page" : undefined}
                className={cn("inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium", active ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
              >
                {t(s.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type Result<T> = { ok: true; data: T } | { ok: false; error: { kind: string; code: string; details?: Record<string, unknown> } };

/** Localized error text: StayAdmin.errors → StayApp.errors → TourShared.errorKind. Never a raw key. */
export function useStayErrorText() {
  const ta = useTranslations("StayAdmin.errors");
  const tc = useTranslations("StayApp.errors");
  const ts = useTranslations("TourShared");
  return (error: { kind: string; code: string }) => {
    if (ta.has(error.code as never)) return ta(error.code as never);
    if (tc.has(error.code as never)) return tc(error.code as never);
    if (ts.has(`errorKind.${error.kind}` as never)) return ts(`errorKind.${error.kind}` as never);
    return tc("generic");
  };
}

/**
 * Runs an admin server action: pending state, a toast with the localized
 * outcome, field errors exposed for inline display, and a refresh of the
 * server components on success. A transport failure is reported as
 * "service unavailable", never as invalid input.
 */
export function useStayAdminAction() {
  const router = useRouter();
  const t = useTranslations("StayAdmin.common");
  const errorText = useStayErrorText();
  const [pending, start] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lastError, setLastError] = useState<{ code: string; details?: Record<string, unknown> } | null>(null);
  const run = <T,>(fn: () => Promise<Result<T>>, opts: { success?: string; refresh?: boolean; onSuccess?: (d: T) => void } = {}) =>
    new Promise<T | null>((resolve) => {
      start(async () => {
        let res: Result<T>;
        try {
          res = await fn();
        } catch {
          res = { ok: false, error: { kind: "infrastructure", code: "service_unavailable" } };
        }
        if (res.ok) {
          setFieldErrors({});
          setLastError(null);
          toast.success(opts.success ?? t("saved"));
          opts.onSuccess?.(res.data);
          if (opts.refresh !== false) router.refresh();
          resolve(res.data);
          return;
        }
        // The project compiles without strictNullChecks, so `res.ok` does not narrow the union.
        const { error } = res as Extract<Result<T>, { ok: false }>;
        setFieldErrors(((error.details?.fields ?? {}) as Record<string, string>) || {});
        setLastError(error);
        toast.error(errorText(error));
        resolve(null);
      });
    });
  return { run, pending, fieldErrors, lastError, errorText };
}

export function useUiLocale() {
  return useLocale();
}

/** Inline field error under an input. */
export function FieldError({ error }: { error?: string }) {
  const t = useTranslations("StayApp.book.fieldErrors");
  if (!error) return null;
  return (
    <p className="text-destructive text-xs font-medium" role="alert" data-testid="admin-field-error">
      {error === "required" ? t("required") : error === "too_long" ? t("too_long") : t("invalid")}
    </p>
  );
}
