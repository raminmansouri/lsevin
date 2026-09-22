"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";

import {
  PATIENT_CONTACT_TYPES,
  PATIENT_IDENTIFIER_TYPES,
  PATIENT_RELATIONSHIP_TYPES,
} from "../../schemas";
import { addPatientContactAction, addPatientIdentifierAction, addPatientAddressAction, linkAccountToPatientAction } from "../../server/actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";

type DialogProps = { patientId: string; open: boolean; onOpenChange: (open: boolean) => void };

function useRefreshOnSuccess() {
  const router = useRouter();
  return () => router.refresh();
}

export function AddIdentifierDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<(typeof PATIENT_IDENTIFIER_TYPES)[number]>("national_id");
  const [value, setValue] = useState("");
  const refresh = useRefreshOnSuccess();

  const save = () => {
    startTransition(async () => {
      const result = await addPatientIdentifierAction({ patientId, identifierType: type, value: value.trim() });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setValue("");
        refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.overview.addIdentifier")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.fields.identifierType")}</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PATIENT_IDENTIFIER_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.identifierTypes.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("admin.fields.identifierValue")}</Label>
            <Input dir="ltr" value={value} onChange={(event) => setValue(event.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !value.trim()}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddContactDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<(typeof PATIENT_CONTACT_TYPES)[number]>("mobile");
  const [value, setValue] = useState("");
  const refresh = useRefreshOnSuccess();

  const save = () => {
    startTransition(async () => {
      const result = await addPatientContactAction({ patientId, contactType: type, value: value.trim() });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setValue("");
        refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.overview.addContact")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.fields.contactType")}</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PATIENT_CONTACT_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.contactTypes.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("admin.fields.contactValue")}</Label>
            <Input dir="ltr" value={value} onChange={(event) => setValue(event.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !value.trim()}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddAddressDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const refresh = useRefreshOnSuccess();

  const save = () => {
    startTransition(async () => {
      const result = await addPatientAddressAction({
        patientId,
        city: city.trim() || undefined,
        countryCode: countryCode.trim() || undefined,
        addressLine1: addressLine1.trim() || undefined,
      });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setCity("");
        setCountryCode("");
        setAddressLine1("");
        refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.overview.addAddress")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.fields.addressLine1")}</Label>
            <Input value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("admin.fields.city")}</Label>
              <Input value={city} onChange={(event) => setCity(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.fields.countryCode")}</Label>
              <Input dir="ltr" maxLength={2} value={countryCode} onChange={(event) => setCountryCode(event.target.value.toUpperCase())} />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LinkAccountDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [accountId, setAccountId] = useState("");
  const [relationshipType, setRelationshipType] = useState<(typeof PATIENT_RELATIONSHIP_TYPES)[number]>("self");
  const refresh = useRefreshOnSuccess();

  const save = () => {
    startTransition(async () => {
      const result = await linkAccountToPatientAction({ patientId, accountId: accountId.trim(), relationshipType });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setAccountId("");
        refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.overview.linkAccount")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.fields.accountId")}</Label>
            <Input dir="ltr" value={accountId} onChange={(event) => setAccountId(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.fields.relationshipType")}</Label>
            <Select value={relationshipType} onValueChange={(v) => setRelationshipType(v as typeof relationshipType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PATIENT_RELATIONSHIP_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.relationshipTypes.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !accountId.trim()}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
