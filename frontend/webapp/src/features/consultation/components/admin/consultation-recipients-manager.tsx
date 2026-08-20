"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import {
  deleteConsultationRecipientAction,
  upsertConsultationRecipientAction,
} from "../../server/actions";
import {
  CONSULTATION_TRANSLATION_KEY,
  type ConsultationRecipient,
} from "../../types";

type Draft = {
  id?: string;
  label: string;
  phone: string;
  isActive: boolean;
};

const emptyDraft = (): Draft => ({ label: "", phone: "", isActive: true });

export function ConsultationRecipientsManager({
  recipients,
  disabled,
}: {
  recipients: ConsultationRecipient[];
  disabled?: boolean;
}) {
  const t = useTranslations(CONSULTATION_TRANSLATION_KEY);
  // `revalidatePath` in the action names the unprefixed admin path, which does not
  // match the locale-prefixed route this panel is served from, so each successful
  // mutation asks for the refresh itself.
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!draft.phone.trim()) return;

    startTransition(async () => {
      // Every action here begins with assertAdmin(), which THROWS rather than
      // returning a result. Without this catch an expired admin session turns each
      // control into a dead button: no toast, no error, nothing persisted.
      try {
        const result = await upsertConsultationRecipientAction({
          id: draft.id,
          label: draft.label,
          phone: draft.phone,
          isActive: draft.isActive,
        });

        if (result.ok) {
          toast.success(draft.id ? t("admin.recipients.update") : t("admin.recipients.add"));
          setDraft(emptyDraft());
          router.refresh();
          return;
        }

        // `phone` is the only field that can fail validation here. The schema names
        // its own refusals `invalidPhone` / `duplicatePhone`; zod's built-in length
        // messages are English prose and are left to the generic fallback rather
        // than fed to `t()` as a key.
        const phoneError = result.fieldErrors?.phone?.[0];
        toast.error(
          phoneError === "invalidPhone"
            ? t("errors.invalidPhone")
            : phoneError === "duplicatePhone"
              ? t("errors.duplicatePhone")
              : result.error || t("errors.generic")
        );
      } catch {
        toast.error(t("errors.generic"));
      }
    });
  };

  const toggleActive = (recipient: ConsultationRecipient, isActive: boolean) => {
    setPendingId(recipient.id);
    startTransition(async () => {
      try {
        const result = await upsertConsultationRecipientAction({
          id: recipient.id,
          label: recipient.label,
          phone: recipient.phone,
          isActive,
        });

        if (result.ok) router.refresh();
        else toast.error(result.error || t("errors.generic"));
      } catch {
        toast.error(t("errors.generic"));
      } finally {
        // In `finally` so a thrown assertAdmin() cannot leave the row stuck in its
        // pulsing pending state with no way back.
        setPendingId(null);
      }
    });
  };

  const remove = (recipient: ConsultationRecipient) => {
    // Removing a number silently stops that person being told about new leads, so
    // it asks first.
    if (!window.confirm(t("admin.recipients.confirmDelete"))) return;

    setPendingId(recipient.id);
    startTransition(async () => {
      try {
        const result = await deleteConsultationRecipientAction({ id: recipient.id });

        if (result.ok) {
          if (draft.id === recipient.id) setDraft(emptyDraft());
          toast.success(t("admin.recipients.delete"));
          router.refresh();
          return;
        }

        toast.error(result.error || t("errors.generic"));
      } catch {
        toast.error(t("errors.generic"));
      } finally {
        setPendingId(null);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.recipients.title")}</CardTitle>
        <CardDescription>{t("admin.recipients.description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="consultation-recipient-label">
              {t("admin.recipients.label")}
            </Label>
            <Input
              id="consultation-recipient-label"
              value={draft.label}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, label: event.target.value }))
              }
              placeholder={t("admin.recipients.labelPlaceholder")}
              disabled={disabled || isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="consultation-recipient-phone">
              {t("admin.recipients.phone")}
            </Label>
            <Input
              id="consultation-recipient-phone"
              dir="ltr"
              value={draft.phone}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, phone: event.target.value }))
              }
              placeholder={t("admin.recipients.phonePlaceholder")}
              disabled={disabled || isPending}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={disabled || isPending || !draft.phone.trim()}>
              {draft.id ? t("admin.recipients.update") : t("admin.recipients.add")}
            </Button>
            {draft.id && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDraft(emptyDraft())}
                disabled={isPending}
              >
                {t("admin.recipients.cancel")}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:col-span-3">
            <Switch
              id="consultation-recipient-active"
              checked={draft.isActive}
              onCheckedChange={(checked) =>
                setDraft((prev) => ({ ...prev, isActive: checked }))
              }
              disabled={disabled || isPending}
            />
            <Label htmlFor="consultation-recipient-active" className="font-normal">
              {t("admin.recipients.active")}
            </Label>
          </div>
        </form>

        {recipients.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("admin.recipients.empty")}</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {recipients.map((recipient) => (
              <li
                key={recipient.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 p-3",
                  !recipient.isActive && "opacity-60",
                  pendingId === recipient.id && "animate-pulse"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {recipient.label || "—"}
                  </p>
                  <p dir="ltr" className="text-muted-foreground font-mono text-xs">
                    {recipient.phone}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={recipient.isActive}
                    onCheckedChange={(checked) => toggleActive(recipient, checked)}
                    disabled={disabled || isPending}
                    aria-label={t("admin.recipients.active")}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={t("admin.recipients.edit")}
                    title={t("admin.recipients.edit")}
                    disabled={disabled || isPending}
                    onClick={() =>
                      setDraft({
                        id: recipient.id,
                        label: recipient.label || "",
                        phone: recipient.phone,
                        isActive: recipient.isActive,
                      })
                    }
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={t("admin.recipients.delete")}
                    title={t("admin.recipients.delete")}
                    disabled={disabled || isPending}
                    onClick={() => remove(recipient)}
                  >
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
