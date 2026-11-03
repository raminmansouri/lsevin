"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, ChevronLeft, Clock, Loader2, User, Video } from "lucide-react";
import { useTranslations } from "next-intl";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { Link, useRouter } from "@/i18n/navigation";

import { getVideoDoctorsPageAction } from "../server/video-doctors";
import type { VideoDoctor, VideoDoctorsPageData } from "../video-doctors-types";

type State =
  | { status: "loading" }
  | { status: "error"; detail?: string }
  | { status: "ready"; data: VideoDoctorsPageData };

/**
 * The page the home consultation card opens: the general practitioners an admin
 * registered for video consultation, with the fixed length and price on top.
 */
export function VideoDoctorsPage() {
  const t = useTranslations("Consultation.doctorsPage");
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(() => {
    setState({ status: "loading" });
    getVideoDoctorsPageAction()
      .then((result) => {
        if (result.ok && result.data) setState({ status: "ready", data: result.data });
        else setState({ status: "error", detail: result.fieldErrors?.detail?.[0] });
      })
      .catch(() => setState({ status: "error" }));
  }, []);

  useEffect(load, [load]);

  const doctors = state.status === "ready" ? state.data.doctors : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3 px-5 pt-3 pb-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={t("back")}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
          >
            <ChevronLeft size={24} className="text-gray-700 rtl:rotate-180" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
            <p className="truncate text-sm text-gray-600">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      {state.status === "loading" && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#083f30]" aria-hidden />
        </div>
      )}

      {state.status === "error" && (
        <div className="px-5 py-16 text-center">
          <p className="text-sm text-gray-600">{t("loadFailed")}</p>
          {state.detail && (
            <p className="mt-2 break-words text-xs text-red-600" dir="ltr">
              {state.detail}
            </p>
          )}
          <button
            type="button"
            onClick={load}
            className="mt-4 rounded-xl bg-[#083f30] px-4 py-2 text-sm font-bold text-white"
          >
            {t("retry")}
          </button>
        </div>
      )}

      {state.status === "ready" && !state.data.enabled && (
        <p className="px-5 py-16 text-center text-sm text-gray-600">{t("unavailable")}</p>
      )}

      {state.status === "ready" && state.data.enabled && (
        <div className="space-y-4 px-5 pt-4">
          <div className="flex items-center gap-3 rounded-2xl bg-[#083f30] p-4 text-white">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#eacb7f]">
              <Video className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{t("offerTitle")}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-white/80">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {t("offerDetails", {
                  minutes: state.data.durationMinutes,
                  price: state.data.priceLabel,
                })}
              </p>
            </div>
          </div>

          {doctors.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-600">{t("empty")}</p>
          ) : (
            <div className="space-y-3">
              {doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: VideoDoctor }) {
  const t = useTranslations("Consultation.doctorsPage");
  const imageUrl = resolveHomeMediaUrl(doctor.imageUrl);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
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
          <p className="truncate text-xs text-gray-600">{t("generalPractitioner")}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
            {doctor.experienceYears != null && doctor.experienceYears > 0 && (
              <span>{t("experience", { years: doctor.experienceYears })}</span>
            )}
            {doctor.medicalCouncilNumber && (
              <span className="flex items-center gap-1">
                <BadgeCheck className="h-3 w-3 text-[#083f30]" aria-hidden />
                {t("councilNumber", { number: doctor.medicalCouncilNumber })}
              </span>
            )}
          </div>
        </div>
      </div>

      {doctor.bio && <p className="mt-3 line-clamp-3 text-xs leading-5 text-gray-600">{doctor.bio}</p>}

      <Link
        href={`/n/app/mobile/consultation/doctors/${doctor.id}/book`}
        className="mt-3 block rounded-xl bg-[#083f30] py-2.5 text-center text-sm font-bold text-white"
      >
        {t("book")}
      </Link>
    </div>
  );
}
