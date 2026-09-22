"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { PATIENTS_TRANSLATION_KEY } from "../../types";
import { viewShareGrantAction, type ShareViewResult } from "../../server/share-view-actions";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function ShareView({ token }: { token: string }) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<ShareViewResult | null>(null);

  const load = (pinValue?: string) => {
    startTransition(async () => {
      const outcome = await viewShareGrantAction(token, pinValue);
      setResult(outcome);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!result || isPending) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-muted-foreground text-sm">{t("share.loading")}</p>
      </div>
    );
  }

  const denied = !result.ok ? (result as Extract<ShareViewResult, { ok: false }>) : null;

  if (denied && denied.reason === "pin_required") {
    return (
      <div className="mx-auto max-w-sm px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("share.pinTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>{t("share.pinLabel")}</Label>
              <Input dir="ltr" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} />
            </div>
            <Button type="button" className="w-full" disabled={!pin.trim()} onClick={() => load(pin.trim())}>
              {t("share.pinSubmit")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-muted-foreground text-sm">{t(`share.errors.${denied.reason}`)}</p>
      </div>
    );
  }

  const success = result as Extract<ShareViewResult, { ok: true }>;
  const snapshot = success.snapshot as Record<string, any>;
  const patient = snapshot.patient as Record<string, any> | undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("share.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="text-muted-foreground">
            {t("share.expiresAt")}: <span dir="ltr">{formatDateTime(success.expiresAt)}</span>
          </p>
          <p className="text-muted-foreground">{t("share.disclaimer")}</p>
        </CardContent>
      </Card>

      {patient && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("share.sections.demographics")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {patient.firstName} {patient.lastName}
          </CardContent>
        </Card>
      )}

      {Array.isArray(snapshot.conditions) && snapshot.conditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("share.sections.conditions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {snapshot.conditions.map((c: any) => (
              <p key={c.id}>{c.displayName}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {Array.isArray(snapshot.allergies) && snapshot.allergies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("share.sections.allergies")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {snapshot.allergies.map((a: any) => (
              <p key={a.id}>{a.substance ?? t("share.sections.noKnownAllergies")}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {Array.isArray(snapshot.medications) && snapshot.medications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("share.sections.medications")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {snapshot.medications.map((m: any) => (
              <p key={m.id}>{m.name}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {Array.isArray(snapshot.procedures) && snapshot.procedures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("share.sections.procedures")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {snapshot.procedures.map((p: any) => (
              <p key={p.id}>{p.procedureName}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {Array.isArray(snapshot.documents) && snapshot.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("share.sections.documents")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {snapshot.documents.map((d: any) => (
              <p key={d.id}>{d.title}</p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
