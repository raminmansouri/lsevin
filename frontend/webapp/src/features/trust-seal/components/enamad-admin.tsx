"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import { removeDomainTrustSealAction, saveDomainTrustSealAction, type TrustSealActionResult } from "../actions";

type Failure = Extract<TrustSealActionResult, { ok: false }>;
import { enamadUrls, parseEnamadInput } from "../enamad";

export type EnamadAdminRow = { host: string; enamadId: string; enamadCode: string; updatedAt: string };

/** Admin → Content → Enamad: one seal per domain, pasted from the Enamad panel. */
export function EnamadAdmin({ rows }: { rows: EnamadAdminRow[] }) {
  const t = useTranslations("AdminEnamad");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [host, setHost] = useState("");
  const [seal, setSeal] = useState("");
  const [errors, setErrors] = useState<{ host?: string; seal?: string }>({});
  const [confirming, setConfirming] = useState<string | null>(null);

  const preview = parseEnamadInput(seal);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await saveDomainTrustSealAction({ host, seal });
      if (result.ok) {
        toast.success(t("saved", { host: result.host }));
        setHost("");
        setSeal("");
        router.refresh();
        return;
      }
      const failure = result as Failure;
      if (failure.code === "INVALID" && failure.field) {
        setErrors({ [failure.field]: failure.field === "host" ? t("invalidHost") : t("invalidSeal") });
        return;
      }
      toast.error(failure.code === "FORBIDDEN" ? t("forbidden") : t("saveFailed"));
    });
  };

  const remove = (target: string) => {
    if (confirming !== target) {
      setConfirming(target);
      return;
    }
    startTransition(async () => {
      const result = await removeDomainTrustSealAction({ host: target });
      setConfirming(null);
      if (result.ok) {
        toast.success(t("removed", { host: target }));
        router.refresh();
      } else {
        toast.error((result as Failure).code === "FORBIDDEN" ? t("forbidden") : t("removeFailed"));
      }
    });
  };

  return (
    <div className="space-y-6" data-testid="enamad-admin">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ShieldCheck className="h-6 w-6" />
          {t("heading")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("addTitle")}</CardTitle>
          <CardDescription>{t("addDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4" data-testid="enamad-form" noValidate>
            <div className="space-y-2">
              <Label htmlFor="enamad-host">{t("domain")}</Label>
              <Input
                id="enamad-host"
                name="host"
                dir="ltr"
                value={host}
                onChange={(event) => setHost(event.target.value)}
                placeholder="lsevincare.com"
                aria-invalid={Boolean(errors.host)}
                aria-describedby={errors.host ? "enamad-host-error" : undefined}
                disabled={isPending}
                required
              />
              {errors.host && (
                <p id="enamad-host-error" className="text-sm text-destructive">
                  {errors.host}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="enamad-seal">{t("code")}</Label>
              <Textarea
                id="enamad-seal"
                name="seal"
                dir="ltr"
                rows={4}
                value={seal}
                onChange={(event) => setSeal(event.target.value)}
                placeholder={`<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=…&Code=…'>…</a>`}
                aria-invalid={Boolean(errors.seal)}
                aria-describedby={errors.seal ? "enamad-seal-error" : "enamad-seal-hint"}
                disabled={isPending}
                required
              />
              {errors.seal ? (
                <p id="enamad-seal-error" className="text-sm text-destructive">
                  {errors.seal}
                </p>
              ) : (
                <p id="enamad-seal-hint" className="text-sm text-muted-foreground" data-testid="enamad-parsed">
                  {preview ? t("parsed", { id: preview.enamadId }) : t("codeHint")}
                </p>
              )}
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : t("save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("listTitle")}</CardTitle>
          <CardDescription>{t("listDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <ul className="divide-y" data-testid="enamad-list">
              {rows.map((row) => (
                <li key={row.host} className="flex flex-wrap items-center gap-4 py-4" data-testid="enamad-row" data-host={row.host}>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium" dir="ltr">
                      {row.host}
                    </p>
                    <p className="text-sm text-muted-foreground" dir="ltr">
                      id {row.enamadId} · {row.enamadCode.slice(0, 6)}…
                    </p>
                  </div>
                  <a
                    href={enamadUrls(row).href}
                    target="_blank"
                    rel="noopener"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {t("openOnEnamad")}
                  </a>
                  <Button
                    type="button"
                    variant={confirming === row.host ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => remove(row.host)}
                    onBlur={() => setConfirming((current) => (current === row.host ? null : current))}
                    disabled={isPending}
                    aria-label={confirming === row.host ? t("removeConfirm", { host: row.host }) : t("remove", { host: row.host })}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    {confirming === row.host ? t("removeConfirmShort") : t("removeShort")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm text-muted-foreground">{t("replaceHint")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
