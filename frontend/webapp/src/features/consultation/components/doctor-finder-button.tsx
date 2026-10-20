"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  Loader2,
  MapPin,
  Star,
  Stethoscope,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/app/[locale]/n/app/components/ui/drawer";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { Link } from "@/i18n/navigation";

import type {
  DoctorFinderCategory,
  DoctorFinderDoctor,
  DoctorFinderGroup,
} from "../doctor-finder-types";
import {
  getDoctorFinderCategoriesAction,
  getDoctorFinderDoctorsAction,
} from "../server/doctor-finder";

type Props = {
  className?: string;
};

type LoadState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string; detail?: string }
  | { status: "ready"; data: T };

/**
 * Round "consult a doctor" button for the home canopy, next to the profile
 * circle. Opens a bottom sheet in two steps: the patient picks the medical
 * category they think fits, then sees the doctors practising in it. Each card
 * opens the doctor's profile for now; requesting the (paid) consultation from
 * there is the next step of this feature.
 */
export function DoctorFinderButton({ className }: Props) {
  const t = useTranslations("Consultation.finder");
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<LoadState<DoctorFinderGroup[]>>({
    status: "idle",
  });
  const [selected, setSelected] = useState<DoctorFinderCategory | null>(null);
  const [doctors, setDoctors] = useState<LoadState<DoctorFinderDoctor[]>>({
    status: "idle",
  });

  const loadGroups = useCallback(() => {
    setGroups({ status: "loading" });
    getDoctorFinderCategoriesAction().then((result) => {
      setGroups(
        result.ok
          ? { status: "ready", data: result.data ?? [] }
          : {
              status: "error",
              error: result.error || "loadFailed",
              detail: result.fieldErrors?.detail?.[0],
            }
      );
    });
  }, []);

  const loadDoctors = useCallback((category: DoctorFinderCategory) => {
    setDoctors({ status: "loading" });
    getDoctorFinderDoctorsAction(category.id).then((result) => {
      setDoctors(
        result.ok
          ? { status: "ready", data: result.data ?? [] }
          : {
              status: "error",
              error: result.error || "loadFailed",
              detail: result.fieldErrors?.detail?.[0],
            }
      );
    });
  }, []);

  // Categories load on first open only; they are cached server-side anyway.
  useEffect(() => {
    if (open && groups.status === "idle") loadGroups();
  }, [open, groups.status, loadGroups]);

  const pickCategory = (category: DoctorFinderCategory) => {
    setSelected(category);
    loadDoctors(category);
  };

  const backToCategories = () => {
    setSelected(null);
    setDoctors({ status: "idle" });
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) backToCategories();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("open")}
        title={t("open")}
        className={
          className ??
          "flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#eacb7f] ring-2 ring-[#eacb7f]/60 ring-offset-2 ring-offset-[#083f30] transition hover:bg-white/20 active:scale-95"
        }
      >
        <Stethoscope className="h-5 w-5" aria-hidden />
      </button>

      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[85vh] bg-gray-50">
          <DrawerHeader className="border-b border-gray-100 bg-white px-5 pt-2 pb-4 text-start">
            <div className="flex items-center gap-2">
              {selected && (
                <button
                  type="button"
                  onClick={backToCategories}
                  aria-label={t("back")}
                  className="-ms-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
                >
                  <ChevronLeft size={22} className="text-gray-700 rtl:rotate-180" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <DrawerTitle className="truncate text-lg font-bold text-gray-900">
                  {selected ? selected.name : t("title")}
                </DrawerTitle>
                <DrawerDescription className="text-sm text-gray-500">
                  {selected ? t("doctorsSubtitle") : t("subtitle")}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="overflow-y-auto px-5 pt-4 pb-8">
            {selected ? (
              <DoctorList
                state={doctors}
                onRetry={() => loadDoctors(selected)}
                onNavigate={() => handleOpenChange(false)}
              />
            ) : (
              <CategoryGroups
                state={groups}
                onRetry={loadGroups}
                onPick={pickCategory}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function StatusBlock({
  state,
  emptyText,
  onRetry,
}: {
  state: LoadState<unknown[]>;
  emptyText: string;
  onRetry: () => void;
}) {
  const t = useTranslations("Consultation.finder");

  if (state.status === "idle" || state.status === "loading") {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-[#083f30]" />
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-600">
          {t(`errors.${state.error === "invalidCategory" ? "invalidCategory" : "loadFailed"}`)}
        </p>
        {state.detail && (
          <p dir="ltr" className="mt-2 font-mono text-[11px] break-words text-red-600">
            {state.detail}
          </p>
        )}
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-full bg-[#083f30] px-4 py-2 text-sm font-bold text-white"
        >
          {t("retry")}
        </button>
      </div>
    );
  }
  if (state.data.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-500">{emptyText}</p>;
  }
  return null;
}

function CategoryGroups({
  state,
  onRetry,
  onPick,
}: {
  state: LoadState<DoctorFinderGroup[]>;
  onRetry: () => void;
  onPick: (category: DoctorFinderCategory) => void;
}) {
  const t = useTranslations("Consultation.finder");

  if (state.status !== "ready" || state.data.length === 0) {
    return <StatusBlock state={state} emptyText={t("noCategories")} onRetry={onRetry} />;
  }

  return (
    <div className="space-y-5">
      {state.data.map((group) => (
        <section key={group.root.id}>
          <h3 className="mb-2 text-sm font-bold text-gray-800">{group.root.name}</h3>
          <div className="flex flex-wrap gap-2">
            {group.categories.length > 0 && (
              <CategoryChip
                label={t("all")}
                count={group.root.doctorCount}
                onClick={() => onPick(group.root)}
              />
            )}
            {(group.categories.length > 0 ? group.categories : [group.root]).map(
              (category) => (
                <CategoryChip
                  key={category.id}
                  label={category.name}
                  count={category.doctorCount}
                  onClick={() => onPick(category)}
                />
              )
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function CategoryChip({
  label,
  count,
  onClick,
}: {
  label: string;
  count: number;
  onClick: () => void;
}) {
  const t = useTranslations("Consultation.finder");
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-2xl border border-[#083f30]/15 bg-white px-3.5 py-2.5 text-sm font-medium text-[#083f30] shadow-sm transition hover:border-[#083f30]/40 active:scale-95"
    >
      <span>{label}</span>
      <span className="rounded-full bg-[#083f30]/8 px-2 py-0.5 text-[11px] text-[#083f30]/70">
        {t("doctorCount", { count })}
      </span>
    </button>
  );
}

function DoctorList({
  state,
  onRetry,
  onNavigate,
}: {
  state: LoadState<DoctorFinderDoctor[]>;
  onRetry: () => void;
  onNavigate: () => void;
}) {
  const t = useTranslations("Consultation.finder");

  if (state.status !== "ready" || state.data.length === 0) {
    return <StatusBlock state={state} emptyText={t("empty")} onRetry={onRetry} />;
  }

  return (
    <ul className="space-y-3">
      {state.data.map((doctor) => (
        <li key={doctor.id}>
          <DoctorCard doctor={doctor} onNavigate={onNavigate} />
        </li>
      ))}
    </ul>
  );
}

function DoctorCard({
  doctor,
  onNavigate,
}: {
  doctor: DoctorFinderDoctor;
  onNavigate: () => void;
}) {
  const t = useTranslations("Consultation.finder");
  const imageUrl = resolveHomeMediaUrl(doctor.imageUrl);
  const subtitle = doctor.specialty || doctor.title;

  return (
    <Link
      href={`/n/app/mobile/specialist/${encodeURIComponent(doctor.id)}`}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:border-[#083f30]/30"
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-[#083f30]/5">
        {imageUrl ? (
          <ImageWithFallback
            width={128}
            height={128}
            src={imageUrl}
            alt={doctor.name}
            className="h-full w-full object-cover"
            fallbackIcon={<User className="h-6 w-6 text-[#083f30]/40" />}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="h-6 w-6 text-[#083f30]/40" aria-hidden />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-gray-900">{doctor.name}</p>
        {subtitle && <p className="truncate text-xs text-gray-600">{subtitle}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
          {doctor.rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-[#eacb7f] text-[#eacb7f]" aria-hidden />
              {t("rating", { rating: doctor.rating, count: doctor.reviewCount })}
            </span>
          )}
          {doctor.experienceYears != null && doctor.experienceYears > 0 && (
            <span>{t("experience", { years: doctor.experienceYears })}</span>
          )}
          {doctor.providerName && (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{doctor.providerName}</span>
            </span>
          )}
        </div>
      </div>

      <span className="shrink-0 rounded-full bg-[#083f30] px-3 py-1.5 text-xs font-bold text-white">
        {t("viewProfile")}
      </span>
    </Link>
  );
}
