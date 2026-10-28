import { getTranslations } from "next-intl/server";
import type { ComponentProps } from "react";

import { DesktopSharingPanel } from "@/app/[locale]/n/app/mobile/profile/my-sharing/sharing-panel";

import { Reveal } from "../components/motion";

type Entry = {
  patient: { id: string; firstName: string | null; lastName: string | null };
  relationshipType: string;
  consents: ComponentProps<typeof DesktopSharingPanel>["consents"];
  shareGrants: ComponentProps<typeof DesktopSharingPanel>["shareGrants"];
};

/** Desktop my-sharing (>= 1280px): consents and share links per patient, in cream, green and gold. */
export async function DesktopMySharing({ patientsWithAccess }: { patientsWithAccess: Entry[] }) {
  const t = await getTranslations("MobileProfile.mySharing");

  return (
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg overflow-hidden rounded-[36px] px-12 py-12 text-white">
          <Reveal className="space-y-3">
            <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">PRIVACY &amp; SHARING</span>
            <h1 className="lsd-gold-text text-[40px] font-black leading-tight">{t("title")}</h1>
            <p className="max-w-2xl text-base leading-7 text-white/70">{t("subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <div className="lsd-container mt-12 space-y-12">
        {patientsWithAccess.length === 0 ? (
          <p className="rounded-[24px] bg-white p-10 text-center text-[#6b6150] ring-1 ring-[#e7dcc4]">{t("empty")}</p>
        ) : null}

        {patientsWithAccess.map(({ patient, relationshipType, consents, shareGrants }) => (
          <Reveal key={patient.id}>
            <section className="space-y-4">
              {relationshipType !== "self" ? (
                <p className="text-sm font-bold text-[#8c6b2c]">
                  {patient.firstName} {patient.lastName} — {t(`relationshipTypes.${relationshipType}` as never)}
                </p>
              ) : null}
              <DesktopSharingPanel patientId={patient.id} consents={consents} shareGrants={shareGrants} />
            </section>
          </Reveal>
        ))}
      </div>
    </div>
  );
}