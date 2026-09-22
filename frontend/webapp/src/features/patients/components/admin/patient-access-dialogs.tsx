"use client";

import { useState, useTransition } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import { CONSENT_RECIPIENT_TYPES, CONSENT_TYPES, DATA_SCOPES } from "../../sharing-schemas";
import { createShareGrantAction, grantConsentAction } from "../../server/sharing-actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";

type DialogProps = { patientId: string; open: boolean; onOpenChange: (open: boolean) => void };

function ScopeCheckboxes({ scope, onToggle, t }: { scope: string[]; onToggle: (value: string) => void; t: (key: string) => string }) {
  return (
    <div className="grid max-h-36 grid-cols-2 gap-1.5 overflow-y-auto text-sm">
      {DATA_SCOPES.map((value) => (
        <label key={value} className="flex items-center gap-1.5">
          <input type="checkbox" checked={scope.includes(value)} onChange={() => onToggle(value)} />
          {t(`admin.access.dataScopes.${value}`)}
        </label>
      ))}
    </div>
  );
}

export function GrantConsentDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [consentType, setConsentType] = useState<(typeof CONSENT_TYPES)[number]>("data_sharing");
  const [recipientType, setRecipientType] = useState<(typeof CONSENT_RECIPIENT_TYPES)[number]>("provider");
  const [purpose, setPurpose] = useState("");
  const [scope, setScope] = useState<string[]>([]);

  const toggleScope = (value: string) => setScope((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));

  const save = () => {
    if (scope.length === 0) return;
    startTransition(async () => {
      const result = await grantConsentAction({ patientId, consentType, recipientType, purpose: purpose.trim(), scope: scope as never });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setPurpose("");
        setScope([]);
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.access.grantConsent")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.access.fields.consentType")}</Label>
            <Select value={consentType} onValueChange={(v) => setConsentType(v as typeof consentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONSENT_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.access.consentTypes.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("admin.access.fields.recipientType")}</Label>
            <Select value={recipientType} onValueChange={(v) => setRecipientType(v as typeof recipientType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONSENT_RECIPIENT_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.access.recipientTypes.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("admin.access.fields.purpose")}</Label>
            <Textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.access.fields.scope")}</Label>
            <ScopeCheckboxes scope={scope} onToggle={toggleScope} t={t} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !purpose.trim() || scope.length === 0}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreateShareGrantDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [recipientName, setRecipientName] = useState("");
  const [scope, setScope] = useState<string[]>([]);
  const [expiresInHours, setExpiresInHours] = useState("72");
  const [pin, setPin] = useState("");
  const [issuedLink, setIssuedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleScope = (value: string) => setScope((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));

  const save = () => {
    if (scope.length === 0) return;
    startTransition(async () => {
      const result = await createShareGrantAction({
        patientId,
        recipientName: recipientName.trim() || undefined,
        scope,
        expiresInHours: Number(expiresInHours) || 72,
        pin: pin.trim() || undefined,
      });
      if (result.ok && result.data) {
        const link = `${window.location.origin}/share/${result.data.token}`;
        setIssuedLink(link);
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  const copyLink = async () => {
    if (!issuedLink) return;
    await navigator.clipboard.writeText(issuedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const close = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setIssuedLink(null);
      setRecipientName("");
      setScope([]);
      setPin("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.access.createShareLink")}</DialogTitle>
        </DialogHeader>

        {issuedLink ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">{t("admin.access.linkIssuedOnce")}</p>
            <div className="flex gap-2">
              <Input dir="ltr" readOnly value={issuedLink} />
              <Button type="button" size="icon" variant="outline" onClick={copyLink}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t("admin.access.fields.recipientName")}</Label>
              <Input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.access.fields.scope")}</Label>
              <ScopeCheckboxes scope={scope} onToggle={toggleScope} t={t} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("admin.access.fields.expiresInHours")}</Label>
                <Input dir="ltr" inputMode="numeric" value={expiresInHours} onChange={(event) => setExpiresInHours(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.access.fields.pinOptional")}</Label>
                <Input dir="ltr" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => close(false)}>
            {issuedLink ? t("admin.access.done") : t("admin.create.cancel")}
          </Button>
          {!issuedLink && (
            <Button type="button" onClick={save} disabled={isPending || scope.length === 0}>
              {t("admin.access.generateLink")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
