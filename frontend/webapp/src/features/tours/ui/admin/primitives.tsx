"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { CALENDAR_IDS, isIsoDate, type CalendarId } from "../../domain/calendar";
import { directionOf } from "../../domain/content";

import { formatPrice, JalaliDateInput, LocalizedTextInput } from "./inputs";
import { selectClass } from "./styles";

/** The structured result every admin action returns (errors.ts ActionResult). */
export type ActionResultLike<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: { kind: string; code: string; details?: Record<string, unknown> } };

/** Localized text for an action error: TourAdmin.errors.<code> → TourShared.errors.<code> → TourShared.errorKind.<kind>. Never a raw key. */
export function useErrorText() {
  const ta = useTranslations("TourAdmin.errors");
  const ts = useTranslations("TourShared");
  return (error: { kind: string; code: string; details?: Record<string, unknown> }) => {
    if (ta.has(error.code)) return ta(error.code);
    if (ts.has(`errors.${error.code}`)) return ts(`errors.${error.code}`);
    if (ts.has(`errorKind.${error.kind}`)) return ts(`errorKind.${error.kind}`);
    return ts("errorKind.unexpected");
  };
}

/**
 * Runs a server action with pending state, toasts the localized outcome and
 * refreshes the server components. Returns the data on success, null otherwise.
 */
export function useAdminAction() {
  const router = useRouter();
  const t = useTranslations("TourAdmin.common");
  const errorText = useErrorText();
  const [pending, start] = useTransition();
  const [lastError, setLastError] = useState<string | null>(null);
  const run = <T,>(fn: () => Promise<ActionResultLike<T>>, opts: { success?: string; onSuccess?: (data: T) => void; refresh?: boolean } = {}) =>
    new Promise<T | null>((resolve) => {
      start(async () => {
        let res: ActionResultLike<T>;
        try {
          res = await fn();
        } catch {
          // A transport failure (network, server restart) is not a validation error.
          res = { ok: false, error: { kind: "infrastructure", code: "service_unavailable" } };
        }
        if (res.ok === true) {
          setLastError(null);
          toast.success(opts.success ?? t("saved"));
          opts.onSuccess?.(res.data);
          if (opts.refresh !== false) router.refresh();
          resolve(res.data);
        } else {
          const error = (res as Extract<ActionResultLike<T>, { ok: false }>).error;
          const msg = errorText(error);
          const detail = error.details?.requirements
            ? ` (${(error.details.requirements as { code: string }[]).map((r) => r.code).join(", ")})`
            : error.details?.field ? ` (${String(error.details.field)})` : "";
          setLastError(msg + detail);
          toast.error(msg + detail);
          resolve(null);
        }
      });
    });
  return { run, pending, lastError };
}

export function Field({ label, htmlFor, hint, children, className }: { label: string; htmlFor?: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}


export function NativeSelect(props: React.ComponentProps<"select">) {
  return <select {...props} className={cn(selectClass, props.className)} />;
}

const STATUS_TONE: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200",
  approved: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200",
  confirmed: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200",
  submitted: "bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200",
  pending: "bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200",
  pending_approval: "bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200",
  draft: "bg-muted text-foreground",
  outdated: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200",
  delayed: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200",
  paused: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200",
  escalated: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200",
  missing: "bg-rose-100 text-rose-900 dark:bg-rose-500/15 dark:text-rose-200",
  rejected: "bg-rose-100 text-rose-900 dark:bg-rose-500/15 dark:text-rose-200",
  cancelled: "bg-rose-100 text-rose-900 dark:bg-rose-500/15 dark:text-rose-200",
  critical: "bg-rose-100 text-rose-900 dark:bg-rose-500/15 dark:text-rose-200",
  open: "bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200",
};

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  return (
    <Badge variant="outline" data-status={status} className={cn("border-transparent", STATUS_TONE[status] ?? "bg-muted text-foreground", className)}>
      {label ?? status}
    </Badge>
  );
}

/** Text in its own language and direction (S-069). */
export function LangText({ value, locale, className }: { value: string | null | undefined; locale: string; className?: string }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span lang={locale} dir={directionOf(locale)} className={cn("whitespace-pre-wrap", className)}>
      {value}
    </span>
  );
}

/**
 * A date picked on a Jalali calendar. The value stays the canonical ISO (Gregorian)
 * date, so send it to the server with `calendar: "gregory"`. `calendar` is kept for
 * call-site compatibility and ignored: admins always enter dates in Jalali.
 */
export function CalendarDateField({ id, label, value, onChange, hint, required }: {
  id: string; label: string; value: string; onChange: (v: string) => void; calendar?: CalendarId; hint?: string; required?: boolean;
}) {
  return (
    <Field label={required ? `${label} *` : label} htmlFor={id} hint={hint}>
      <JalaliDateInput id={id} value={isIsoDate(value.trim()) ? value.trim() : ""} onChange={onChange} />
    </Field>
  );
}

export function CalendarSelect({ id, value, onChange, label }: { id: string; value: CalendarId; onChange: (c: CalendarId) => void; label?: string }) {
  const tc = useTranslations("TourShared.calendar");
  return (
    <Field label={label ?? tc("label")} htmlFor={id}>
      <NativeSelect id={id} value={value} onChange={(e) => onChange(e.target.value as CalendarId)}>
        {CALENDAR_IDS.map((c) => (
          <option key={c} value={c}>{tc(c)}</option>
        ))}
      </NativeSelect>
    </Field>
  );
}

/** Edits a `{ "fa-IR": text }` map with the platform's multi-language input (a tab per language). */
export function TranslationsInput({ label, locales, value, onChange, multiline, richText }: {
  idPrefix?: string; label: string; locales: string[]; value: Record<string, string>; onChange: (v: Record<string, string>) => void; multiline?: boolean; richText?: boolean;
}) {
  return <LocalizedTextInput label={label} locales={locales} value={value} onChange={onChange} multiline={multiline} richText={richText} />;
}

/** A destructive or consequential action that needs a written reason before it runs. */
export function ReasonAction({ label, confirmLabel, reasonLabel, onConfirm, variant = "outline", disabled, minLength = 5, testId, children }: {
  label: string; confirmLabel?: string; reasonLabel?: string; onConfirm: (reason: string) => Promise<unknown> | void;
  variant?: "outline" | "destructive" | "default" | "secondary"; disabled?: boolean; minLength?: number; testId?: string; children?: ReactNode;
}) {
  const t = useTranslations("TourAdmin.common");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const id = useId();
  if (!open) {
    return (
      <Button type="button" size="sm" variant={variant} disabled={disabled} onClick={() => setOpen(true)} data-testid={testId}>
        {label}
      </Button>
    );
  }
  return (
    <div className="bg-muted/40 w-full space-y-2 rounded-md border p-3" role="group" aria-label={label}>
      {children}
      <Label htmlFor={id}>{reasonLabel ?? t("reason")}</Label>
      <Textarea id={id} value={reason} rows={2} autoFocus onChange={(e) => setReason(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); setReason(""); } }} />
      <p className="text-muted-foreground text-xs">{t("reasonHint", { min: minLength })}</p>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant={variant === "outline" ? "default" : variant} disabled={reason.trim().length < minLength}
          onClick={async () => { await onConfirm(reason.trim()); setOpen(false); setReason(""); }}>
          {confirmLabel ?? label}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => { setOpen(false); setReason(""); }}>{t("cancel")}</Button>
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">{children}</p>;
}

export function Section({ title, description, actions, children, id }: { title: string; description?: ReactNode; actions?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section className="space-y-3 rounded-lg border p-4" aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <h2 id={id ? `${id}-title` : undefined} className="text-base font-semibold">{title}</h2>
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

/** Thousands-separated amount; IRR/IRT read as ریال/تومان, never the raw code. */
export function formatAmount(amount: number | null | undefined, currency: string, locale: string, _decimals?: number) {
  return formatPrice(amount, currency, locale);
}
