import { getTranslations } from "next-intl/server";

import type { HealthRecordEntry } from "@/app/[locale]/n/app/mobile/profile/my-health-record/page";
import { HealthRecordBody } from "@/app/[locale]/n/app/mobile/profile/my-health-record/health-record-body";
import type { AccountLinkRequestRow } from "@/features/patients/link-request-types";
import { Reveal } from "../components/motion";

/** Desktop health record (>= 1280px): the desktop hero around the same body the phone layout shows. */
export async function DesktopHealthRecord({
  records,
  linkRequests,
  defaultName,
}: {
  records: HealthRecordEntry[];
  linkRequests: AccountLinkRequestRow[];
  defaultName: { firstName: string; lastName: string };
}) {
  const t = await getTranslations("MobileProfile.myHealthRecord");

  return (
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg relative overflow-hidden rounded-[36px] px-12 py-12 text-white">
          <Reveal className="relative space-y-3">
            <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">MEDICAL DOSSIER</span>
            <h1 className="lsd-gold-text text-[40px] font-black leading-tight">{t("title")}</h1>
            <p className="max-w-2xl text-base leading-7 text-white/70">{t("subtitle")}</p>
          </Reveal>
        </div>
      </section>
      <div className="lsd-container mt-10">
        <HealthRecordBody records={records} linkRequests={linkRequests} defaultName={defaultName} />
      </div>
    </div>
  );
}
