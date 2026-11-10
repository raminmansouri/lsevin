"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, KeyRound, Loader2, Pencil, Trash2, Unlink, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { SingleMediaPickerInput } from "@/features/media-picker-addon";

import {
  listAdminVideoDoctorsAction,
  mutateVideoDoctorAction,
  saveVideoDoctorAction,
} from "../../server/video-doctors";
import { CONSULTATION_TRANSLATION_KEY } from "../../types";
import type { AdminVideoDoctor, DoctorPackageDraft } from "../../video-doctors-types";

type Mutation = Parameters<typeof mutateVideoDoctorAction>[0];

const PACKAGE_MINUTES = [20, 45, 60] as const;

/** A package row as typed: prices stay text until the server parses them. */
type PackageField = {
  minutes: (typeof PACKAGE_MINUTES)[number];
  isActive: boolean;
  priceToman: string;
  priceUsd: string;
};

const emptyPackages = (): PackageField[] =>
  PACKAGE_MINUTES.map((minutes) => ({ minutes, isActive: false, priceToman: "", priceUsd: "" }));

const packageFieldsFrom = (packages: DoctorPackageDraft[]): PackageField[] =>
  PACKAGE_MINUTES.map((minutes) => {
    const pkg = packages.find((p) => p.minutes === minutes);
    return {
      minutes,
      isActive: pkg?.isActive ?? false,
      priceToman: pkg?.priceToman == null ? "" : String(pkg.priceToman),
      priceUsd: pkg?.priceUsd == null ? "" : String(pkg.priceUsd),
    };
  });

type Draft = {
  id?: string;
  nameFa: string;
  nameEn: string;
  bioFa: string;
  bioEn: string;
  medicalCouncilNumber: string;
  experienceYears: string;
  imageMediaId: string;
  isActive: boolean;
  accountPhone: string;
  accountEmail: string;
  accountPassword: string;
  packages: PackageField[];
};

const emptyDraft = (): Draft => ({
  nameFa: "",
  nameEn: "",
  bioFa: "",
  bioEn: "",
  medicalCouncilNumber: "",
  experienceYears: "",
  imageMediaId: "",
  isActive: true,
  accountPhone: "",
  accountEmail: "",
  accountPassword: "",
  packages: emptyPackages(),
});

const draftFrom = (doctor: AdminVideoDoctor): Draft => ({
  id: doctor.id,
  nameFa: doctor.nameFa,
  nameEn: doctor.nameEn ?? "",
  bioFa: doctor.bioFa ?? "",
  bioEn: doctor.bioEn ?? "",
  medicalCouncilNumber: doctor.medicalCouncilNumber ?? "",
  experienceYears: doctor.experienceYears == null ? "" : String(doctor.experienceYears),
  imageMediaId: doctor.imageMediaId ?? "",
  isActive: doctor.isActive,
  accountPhone: "",
  accountEmail: "",
  accountPassword: "",
  packages: packageFieldsFrom(doctor.packages),
});

/**
 * The doctors patients see on the page the home consultation card opens: the ones
 * registered here, with their 20, 45 and 60 minute packages, and the ones clinics add
 * in the provider portal, whose packages the clinic sets there (shown read-only). The
 * list loads on its own rather than through the board's payload, so this panel
 * can say "run the migration" without blocking the rest of the page.
 */
export function VideoConsultationDoctorsManager() {
  const t = useTranslations(CONSULTATION_TRANSLATION_KEY);
  const [doctors, setDoctors] = useState<AdminVideoDoctor[] | null | undefined>(undefined);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  // Remounts the image picker so "new doctor" clears its preview.
  const [formKey, setFormKey] = useState(0);
  const [nameError, setNameError] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reload = useCallback(async () => {
    try {
      const result = await listAdminVideoDoctorsAction();
      if (result.ok) setDoctors(result.data ?? null);
      else toast.error(result.error || t("errors.generic"));
    } catch {
      toast.error(t("errors.generic"));
    }
  }, [t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const resetForm = () => {
    setDraft(emptyDraft());
    setNameError(false);
    setAccountError(null);
    setFormKey((key) => key + 1);
  };

  const editing = draft.id ? doctors?.find((doctor) => doctor.id === draft.id) : undefined;
  const linkedAccount = editing?.account ?? null;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const setPackage = (minutes: number, patch: Partial<PackageField>) =>
    setDraft((prev) => ({
      ...prev,
      packages: prev.packages.map((pkg) => (pkg.minutes === minutes ? { ...pkg, ...patch } : pkg)),
    }));

  const packageSummary = (doctor: AdminVideoDoctor) => {
    const active = doctor.clinic
      ? doctor.clinic.packages
      : doctor.packages.filter((pkg) => pkg.isActive);
    const text = active.length
      ? t("admin.videoDoctors.packages.summary", {
          durations: active.map((pkg) => pkg.minutes).join("/"),
        })
      : t("admin.videoDoctors.packages.noneShort");
    return doctor.clinic
      ? `${t("admin.videoDoctors.packages.clinic", { clinic: doctor.clinic.name ?? "—" })} · ${text}`
      : text;
  };

  const submit = () => {
    if (draft.nameFa.trim().length < 2) {
      setNameError(true);
      return;
    }
    startTransition(async () => {
      try {
        // A clinic's doctor gets packages in the provider portal, so none are sent for them.
        const { packages, ...profile } = draft;
        const result = await saveVideoDoctorAction({
          ...profile,
          packages: editing?.clinic ? undefined : packages,
        });
        if (!result.ok) {
          setNameError(Boolean(result.fieldErrors?.nameFa));
          setAccountError(result.fieldErrors?.account?.[0] ?? null);
          toast.error(result.error || t("errors.generic"));
          // The profile was saved and only the account failed: stay on it so the
          // admin can correct the account fields and save again.
          const savedId = result.data?.id;
          if (savedId) {
            setDraft((prev) => ({ ...prev, id: savedId, accountPassword: "" }));
            await reload();
          }
          return;
        }
        toast.success(
          result.data?.accountCreated
            ? t("admin.videoDoctors.accountCreated")
            : draft.id
              ? t("admin.videoDoctors.updated")
              : t("admin.videoDoctors.added")
        );
        resetForm();
        await reload();
      } catch {
        toast.error(t("errors.generic"));
      }
    });
  };

  const mutate = (input: Mutation, successMessage?: string) => {
    setPendingId(input.id);
    startTransition(async () => {
      try {
        const result = await mutateVideoDoctorAction(input);
        if (!result.ok) {
          toast.error(result.error || t("errors.generic"));
          return;
        }
        if (successMessage) toast.success(successMessage);
        if (input.kind === "remove" && draft.id === input.id) resetForm();
        await reload();
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
        <CardTitle>{t("admin.videoDoctors.title")}</CardTitle>
        <CardDescription>{t("admin.videoDoctors.description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {doctors === undefined && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
          </div>
        )}

        {doctors === null && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {t("admin.videoDoctors.migrationMissing")}
          </p>
        )}

        {Array.isArray(doctors) && (
          <div className="grid gap-6 xl:grid-cols-2">
            {/* New doctors come from the provider portal ("create doctor profile"); here an admin only edits existing ones. */}
            {draft.id ? <form
              className="space-y-4 rounded-lg border p-4"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <p className="font-medium">
                {draft.id ? t("admin.videoDoctors.editTitle") : t("admin.videoDoctors.addTitle")}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="video-doctor-name-fa">{t("admin.videoDoctors.nameFa")}</Label>
                  <Input
                    id="video-doctor-name-fa"
                    value={draft.nameFa}
                    onChange={(event) => {
                      set("nameFa", event.target.value);
                      setNameError(false);
                    }}
                    aria-invalid={nameError}
                    disabled={isPending}
                  />
                  {nameError && (
                    <p className="text-xs text-red-600">{t("admin.videoDoctors.nameRequired")}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-doctor-name-en">{t("admin.videoDoctors.nameEn")}</Label>
                  <Input
                    id="video-doctor-name-en"
                    dir="ltr"
                    value={draft.nameEn}
                    onChange={(event) => set("nameEn", event.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-doctor-council">{t("admin.videoDoctors.councilNumber")}</Label>
                  <Input
                    id="video-doctor-council"
                    dir="ltr"
                    value={draft.medicalCouncilNumber}
                    onChange={(event) => set("medicalCouncilNumber", event.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-doctor-experience">{t("admin.videoDoctors.experience")}</Label>
                  <Input
                    id="video-doctor-experience"
                    dir="ltr"
                    inputMode="numeric"
                    value={draft.experienceYears}
                    onChange={(event) => set("experienceYears", event.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-doctor-bio-fa">{t("admin.videoDoctors.bioFa")}</Label>
                <Textarea
                  id="video-doctor-bio-fa"
                  rows={3}
                  value={draft.bioFa}
                  onChange={(event) => set("bioFa", event.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video-doctor-bio-en">{t("admin.videoDoctors.bioEn")}</Label>
                <Textarea
                  id="video-doctor-bio-en"
                  dir="ltr"
                  rows={3}
                  value={draft.bioEn}
                  onChange={(event) => set("bioEn", event.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("admin.videoDoctors.photo")}</Label>
                <SingleMediaPickerInput
                  key={`${formKey}-${draft.id ?? "new"}`}
                  name="video-doctor-photo"
                  mediaType="image"
                  valueField="id"
                  value={draft.imageMediaId}
                  onValueChange={(value) => set("imageMediaId", value)}
                  placeholder={t("admin.videoDoctors.photoPlaceholder")}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-sm font-medium">{t("admin.videoDoctors.packages.title")}</p>
                {editing?.clinic ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-xs text-muted-foreground">
                      {t("admin.videoDoctors.packages.fromClinic", {
                        clinic: editing.clinic.name ?? "—",
                      })}
                    </p>
                    {editing.clinic.status !== "active" && (
                      <p className="text-xs text-amber-700">{t("admin.videoDoctors.packages.clinicPaused")}</p>
                    )}
                    {editing.clinic.packages.length === 0 ? (
                      <p className="text-xs text-muted-foreground">{t("admin.videoDoctors.packages.none")}</p>
                    ) : (
                      <ul className="space-y-1">
                        {editing.clinic.packages.map((pkg) => (
                          <li key={pkg.minutes} className="rounded-md bg-muted/50 px-2 py-1">
                            {t("admin.videoDoctors.packages.clinicRow", {
                              minutes: pkg.minutes,
                              toman: pkg.priceToman ?? 0,
                              usd: pkg.priceUsd ?? 0,
                            })}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">{t("admin.videoDoctors.packages.hint")}</p>
                    {draft.packages.map((pkg) => (
                      <div key={pkg.minutes} className="grid items-end gap-2 sm:grid-cols-[8rem_1fr_1fr]">
                        <label className="flex h-9 items-center gap-2 text-sm">
                          <Switch
                            className="data-[state=unchecked]:bg-gray-300"
                            checked={pkg.isActive}
                            onCheckedChange={(checked) => setPackage(pkg.minutes, { isActive: checked })}
                            disabled={isPending}
                          />
                          {t("admin.videoDoctors.packages.minutes", { minutes: pkg.minutes })}
                        </label>
                        <div className="space-y-1">
                          <Label htmlFor={`video-doctor-package-${pkg.minutes}-toman`} className="text-xs">
                            {t("admin.videoDoctors.packages.toman")}
                          </Label>
                          <Input
                            id={`video-doctor-package-${pkg.minutes}-toman`}
                            dir="ltr"
                            inputMode="numeric"
                            value={pkg.priceToman}
                            onChange={(event) => setPackage(pkg.minutes, { priceToman: event.target.value })}
                            disabled={isPending}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`video-doctor-package-${pkg.minutes}-usd`} className="text-xs">
                            {t("admin.videoDoctors.packages.usd")}
                          </Label>
                          <Input
                            id={`video-doctor-package-${pkg.minutes}-usd`}
                            dir="ltr"
                            inputMode="decimal"
                            value={pkg.priceUsd}
                            onChange={(event) => setPackage(pkg.minutes, { priceUsd: event.target.value })}
                            disabled={isPending}
                          />
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-dashed p-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <p className="text-sm font-medium">{t("admin.videoDoctors.accountTitle")}</p>
                </div>

                {linkedAccount ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 text-sm">
                      <p dir="ltr" className="truncate text-start">{linkedAccount.phone}</p>
                      <p dir="ltr" className="truncate text-start text-xs text-muted-foreground">
                        {linkedAccount.email}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => {
                        if (!window.confirm(t("admin.videoDoctors.confirmUnlink"))) return;
                        mutate(
                          { kind: "unlinkAccount", id: editing!.id },
                          t("admin.videoDoctors.unlinked")
                        );
                      }}
                    >
                      <Unlink className="h-4 w-4" />
                      {t("admin.videoDoctors.unlink")}
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">{t("admin.videoDoctors.accountHint")}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="video-doctor-account-phone">
                          {t("admin.videoDoctors.accountPhone")}
                        </Label>
                        <Input
                          id="video-doctor-account-phone"
                          dir="ltr"
                          inputMode="tel"
                          placeholder="09121234567"
                          value={draft.accountPhone}
                          onChange={(event) => {
                            set("accountPhone", event.target.value);
                            setAccountError(null);
                          }}
                          disabled={isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="video-doctor-account-email">
                          {t("admin.videoDoctors.accountEmail")}
                        </Label>
                        <Input
                          id="video-doctor-account-email"
                          dir="ltr"
                          type="email"
                          value={draft.accountEmail}
                          onChange={(event) => {
                            set("accountEmail", event.target.value);
                            setAccountError(null);
                          }}
                          disabled={isPending}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="video-doctor-account-password">
                          {t("admin.videoDoctors.accountPassword")}
                        </Label>
                        <Input
                          id="video-doctor-account-password"
                          dir="ltr"
                          type="password"
                          autoComplete="new-password"
                          value={draft.accountPassword}
                          onChange={(event) => {
                            set("accountPassword", event.target.value);
                            setAccountError(null);
                          }}
                          disabled={isPending}
                        />
                      </div>
                    </div>
                    {accountError && <p className="text-xs text-red-600">{accountError}</p>}
                  </>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <Switch
                  className="data-[state=unchecked]:bg-gray-300"
                  checked={draft.isActive}
                  onCheckedChange={(checked) => set("isActive", checked)}
                  disabled={isPending}
                />
                {t("admin.videoDoctors.active")}
              </label>

              <div className="flex gap-2">
                <Button type="submit" disabled={isPending}>
                  {draft.id ? t("admin.videoDoctors.save") : t("admin.videoDoctors.add")}
                </Button>
                {draft.id && (
                  <Button type="button" variant="ghost" onClick={resetForm} disabled={isPending}>
                    {t("admin.videoDoctors.cancelEdit")}
                  </Button>
                )}
              </div>
            </form> : (
              <p className="h-fit rounded-lg border border-dashed p-4 text-sm leading-7 text-muted-foreground">
                {t("admin.videoDoctors.addFromPortal")}
              </p>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">
                {t("admin.videoDoctors.listTitle", { count: doctors.length })}
              </p>
              {doctors.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("admin.videoDoctors.empty")}</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {doctors.map((doctor, index) => {
                    const busy = isPending && pendingId === doctor.id;
                    return (
                      <li
                        key={doctor.id}
                        className={`flex items-center gap-3 p-3 ${busy ? "animate-pulse" : ""} ${
                          draft.id === doctor.id ? "bg-muted/50" : ""
                        }`}
                      >
                        <DoctorAvatar name={doctor.nameFa} imageUrl={doctor.imageUrl} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{doctor.nameFa}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {[
                              packageSummary(doctor),
                              doctor.nameEn,
                              doctor.medicalCouncilNumber,
                              doctor.account
                                ? t("admin.videoDoctors.hasAccount")
                                : t("admin.videoDoctors.noAccount"),
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={isPending || index === 0}
                            onClick={() => mutate({ kind: "move", id: doctor.id, direction: -1 })}
                            aria-label={t("admin.videoDoctors.moveUp")}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={isPending || index === doctors.length - 1}
                            onClick={() => mutate({ kind: "move", id: doctor.id, direction: 1 })}
                            aria-label={t("admin.videoDoctors.moveDown")}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Switch
                            className="data-[state=unchecked]:bg-gray-300"
                            checked={doctor.isActive}
                            disabled={isPending}
                            onCheckedChange={(checked) =>
                              mutate({ kind: "active", id: doctor.id, isActive: checked })
                            }
                            aria-label={t("admin.videoDoctors.active")}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => {
                              setDraft(draftFrom(doctor));
                              setNameError(false);
                              setAccountError(null);
                            }}
                            aria-label={t("admin.videoDoctors.edit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => {
                              if (!window.confirm(t("admin.videoDoctors.confirmRemove"))) return;
                              mutate({ kind: "remove", id: doctor.id }, t("admin.videoDoctors.removed"));
                            }}
                            aria-label={t("admin.videoDoctors.remove")}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DoctorAvatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  const src = resolveHomeMediaUrl(imageUrl);
  return (
    <div className="size-10 shrink-0 overflow-hidden rounded-full bg-muted">
      {src ? (
        <ImageWithFallback
          width={80}
          height={80}
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          fallbackIcon={<User className="h-4 w-4 text-muted-foreground" />}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <User className="h-4 w-4 text-muted-foreground" aria-hidden />
        </div>
      )}
    </div>
  );
}
