"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import useDirection from "@/hooks/use-direction";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

import { updateConsultationRequestAction } from "../../server/actions";
import {
  CONSULTATION_STATUSES,
  CONSULTATION_TRANSLATION_KEY,
  type ConsultationNotification,
  type ConsultationRequestDetail,
  type ConsultationRequestListItem,
  type ConsultationStatus,
} from "../../types";
import { ConsultationStatusBadge } from "./consultation-status-badge";
import { getConsultationRequestDetailAction } from "./get-detail.action";

/**
 * The reasons the dispatcher records. Anything outside this set is shown verbatim
 * rather than sent through `t()`, which would otherwise render a raw key path in
 * the panel the first time a new reason ships ahead of its translation.
 */
const KNOWN_SKIP_REASONS = [
  "sms_disabled",
  "no_credentials",
  "no_body_id",
  "not_iranian_mobile",
  "no_recipients",
];

const NOTIFICATION_STATUS_CLASSES: Record<string, string> = {
  sent: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200",
  failed:
    "border-destructive/40 bg-destructive/10 text-destructive dark:bg-destructive/20",
  skipped: "border-muted bg-muted text-muted-foreground",
  pending:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="text-sm break-words">{children}</div>
    </div>
  );
}

function NotificationRow({
  notification,
  dateTime,
}: {
  notification: ConsultationNotification;
  dateTime: (value: string | null) => string;
}) {
  const t = useTranslations(CONSULTATION_TRANSLATION_KEY);
  const failed = notification.status === "failed";

  return (
    <li
      className={cn(
        "rounded-md border p-3",
        failed && "border-destructive/40 bg-destructive/5 dark:bg-destructive/10"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          {t(`admin.notification.${notification.recipientType}`)}
        </Badge>
        <span dir="ltr" className="font-mono text-sm">
          {notification.phone}
        </span>
        <Badge
          variant="outline"
          className={cn(
            "ms-auto gap-1",
            NOTIFICATION_STATUS_CLASSES[notification.status]
          )}
        >
          {failed && <AlertTriangle className="size-3" />}
          {t(`admin.notification.${notification.status}`)}
        </Badge>
      </div>

      <div className="text-muted-foreground mt-2 space-y-1 text-xs">
        {notification.skipReason && (
          <p>
            {KNOWN_SKIP_REASONS.includes(notification.skipReason)
              ? t(`admin.notification.reason.${notification.skipReason}`)
              : notification.skipReason}
          </p>
        )}
        {notification.errorMessage && (
          <p className="text-destructive break-words">{notification.errorMessage}</p>
        )}
        <p>{dateTime(notification.attemptedAt || notification.createdAt)}</p>
      </div>
    </li>
  );
}

export function ConsultationDetailDialog({
  row,
  open,
  onOpenChange,
}: {
  row: ConsultationRequestListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations(CONSULTATION_TRANSLATION_KEY);
  const locale = useLocale();
  const router = useRouter();
  const { dir } = useDirection();

  const [detail, setDetail] = useState<ConsultationRequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ConsultationStatus>("new");
  const [adminNote, setAdminNote] = useState("");
  const [isSaving, startSaving] = useTransition();

  // Seeded from the row so the drawer paints instantly, then replaced by the full
  // record once the notification log arrives.
  useEffect(() => {
    if (!open || !row) return;

    setDetail(null);
    setStatus(row.status);
    setAdminNote(row.adminNote || "");
    setLoading(true);

    let cancelled = false;

    getConsultationRequestDetailAction({ id: row.id })
      .then((result) => {
        if (cancelled) return;
        if (result.ok && result.data) {
          setDetail(result.data);
          setStatus(result.data.status);
          setAdminNote(result.data.adminNote || "");
        } else if (result.error) {
          toast.error(result.error);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error(t("errors.generic"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // `t` is deliberately not a dependency: this effect calls setState, so a
    // translator identity that changed per render would re-fetch forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row]);

  const dateTime = (value: string | null) =>
    formatDate(value, locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const current = detail || row;

  const save = () => {
    if (!current) return;

    startSaving(async () => {
      // updateConsultationRequestAction opens with assertAdmin(), which throws on an
      // expired session; without this the dialog would sit in its saving state with
      // no toast and no way to tell the write did not land.
      try {
        const result = await updateConsultationRequestAction({
          id: current.id,
          status,
          adminNote: adminNote.trim() || undefined,
        });

        if (result.ok) {
          toast.success(t("admin.detail.saved"));
          onOpenChange(false);
          // `revalidatePath` in the action names the unprefixed path, which does not
          // match the locale-prefixed route this panel is actually served from, so
          // the refresh is asked for explicitly.
          router.refresh();
          return;
        }

        toast.error(result.error || t("errors.generic"));
      } catch {
        toast.error(t("errors.generic"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={dir}
        className="max-h-[88vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader className="text-start">
          <DialogTitle>{t("admin.detail.title")}</DialogTitle>
          <DialogDescription>{t("admin.description")}</DialogDescription>
        </DialogHeader>

        {!current ? null : (
          <div className="space-y-5">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">{t("admin.detail.contact")}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("admin.table.name")}>{current.fullName || "—"}</Field>
                <Field label={t("admin.table.phone")}>
                  <span dir="ltr" className="font-mono">
                    {current.phone}
                  </span>
                </Field>
                <Field label={t("form.email.label")}>
                  {current.email ? (
                    <span dir="ltr">{current.email}</span>
                  ) : (
                    "—"
                  )}
                </Field>
                <Field label={t("admin.table.topic")}>
                  {current.categoryName || "—"}
                </Field>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">{t("admin.detail.message")}</h3>
              <p className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap">
                {current.description || t("admin.detail.noMessage")}
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">{t("admin.detail.meta")}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("admin.table.urgency")}>
                  {t(`urgency.${current.urgency}`)}
                </Field>
                <Field label={t("admin.table.preferredTime")}>
                  {t(`contactTime.${current.preferredContactTime}`)}
                </Field>
                <Field label={t("admin.detail.locale")}>
                  {current.locale || "—"}
                </Field>
                <Field label={t("admin.detail.source")}>{current.source}</Field>
                <Field label={t("admin.detail.bookingDraft")}>
                  {current.bookingDraftId ? (
                    <span dir="ltr" className="font-mono text-xs">
                      {current.bookingDraftId}
                    </span>
                  ) : (
                    "—"
                  )}
                </Field>
                <Field label={t("admin.table.createdAt")}>
                  {dateTime(current.createdAt)}
                </Field>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                {t("admin.detail.notifications")}
                {loading && <Loader2 className="size-3.5 animate-spin" />}
              </h3>

              {detail && detail.notifications.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  {t("admin.detail.noNotifications")}
                </p>
              )}

              {detail && detail.notifications.length > 0 && (
                <ul className="space-y-2">
                  {detail.notifications.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      dateTime={dateTime}
                    />
                  ))}
                </ul>
              )}
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="consultation-detail-status">
                  {t("admin.table.status")}
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as ConsultationStatus)}
                >
                  <SelectTrigger id="consultation-detail-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSULTATION_STATUSES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`admin.status.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div>
                  <ConsultationStatusBadge status={current.status} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consultation-detail-note">
                  {t("admin.detail.adminNote")}
                </Label>
                <Textarea
                  id="consultation-detail-note"
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  placeholder={t("admin.detail.adminNotePlaceholder")}
                  rows={4}
                />
              </div>
            </section>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t("admin.detail.close")}
          </Button>
          <Button type="button" onClick={save} disabled={isSaving || !current}>
            {isSaving ? t("admin.detail.saving") : t("admin.detail.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
