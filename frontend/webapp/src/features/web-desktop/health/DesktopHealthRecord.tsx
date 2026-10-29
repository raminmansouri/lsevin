import { ArrowLeft, BookOpenCheck, Download, FileText, FolderHeart, ListChecks, Pill, ShieldAlert, Stethoscope } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ComponentProps } from "react";

import type { HealthRecordEntry } from "@/app/[locale]/n/app/mobile/profile/my-health-record/page";
import { LinkFamilySection } from "@/app/[locale]/n/app/mobile/profile/my-health-record/link-family-section";
import { SelfDeclareSection } from "@/app/[locale]/n/app/mobile/profile/my-health-record/self-declare-section";
import { Link } from "@/i18n/navigation";

import { Reveal } from "../components/motion";

function Column({ icon: Icon, title, children, empty }: { icon: typeof Pill; title: string; children: React.ReactNode; empty: boolean }) {
  return (
    <div className="rounded-[22px] bg-white p-6 ring-1 ring-[#e7dcc4]">
      <p className="mb-4 flex items-center gap-2 text-sm font-bold text-[#083f30]">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#083f30] text-[#eacb7f]">
          <Icon size={15} />
        </span>
        {title}
      </p>
      {empty ? <p className="text-sm text-[#a8a08e]">—</p> : children}
    </div>
  );
}

/** Desktop health record (>= 1280px): the same records and forms as mobile, as a private medical dossier. */
export async function DesktopHealthRecord({
  records,
  linkRequests,
}: {
  records: HealthRecordEntry[];
  linkRequests: ComponentProps<typeof LinkFamilySection>["requests"];
}) {
  const t = await getTranslations("MobileProfile.myHealthRecord");
  const two = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      {/* Header */}
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg relative overflow-hidden rounded-[36px] px-12 py-12 text-white">
          <Reveal className="relative space-y-3">
            <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">MEDICAL DOSSIER</span>
            <h1 className="lsd-gold-text text-[40px] font-black leading-tight">{t("title")}</h1>
            <p className="max-w-2xl text-base leading-7 text-white/70">{t("subtitle")}</p>
          </Reveal>
        </div>
      </section>

      {/* No record yet: three steps and a way in */}
      {records.length === 0 ? (
        <section className="lsd-container mt-10">
          <Reveal>
            <h2 className="text-2xl font-black text-[#0e1a16]">{t("onboarding.title")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#6b6150]">{t("onboarding.body")}</p>
          </Reveal>
          <div className="mt-8 grid grid-cols-3 gap-5">
            {[
              { icon: BookOpenCheck, title: t("onboarding.steps.create.title"), body: t("onboarding.steps.create.body") },
              { icon: ListChecks, title: t("onboarding.steps.complete.title"), body: t("onboarding.steps.complete.body") },
              { icon: FolderHeart, title: t("onboarding.steps.follow.title"), body: t("onboarding.steps.follow.body") },
            ].map(({ icon: Icon, title, body }, index) => (
              <Reveal key={title} delay={index * 90}>
                <div className="h-full rounded-[24px] bg-white p-7 ring-1 ring-[#e7dcc4] transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_50px_-30px_rgba(6,42,32,0.35)]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold tracking-widest text-[#c9a55a]">{two(index + 1)}</span>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#083f30] text-[#eacb7f]">
                      <Icon size={18} />
                    </span>
                  </div>
                  <p className="mt-5 text-lg font-black text-[#0e1a16]">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#6b6150]">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 flex gap-3">
            <a href="#link-health-record-desktop" className="lsd-btn lsd-btn-green h-12 px-7 text-sm">
              {t("onboarding.start")}
            </a>
            <Link
              href="/n/app/mobile/profile/my-cases"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-[#083f30] ring-1 ring-[#e7dcc4] transition hover:ring-[#c9a55a]"
            >
              {t("onboarding.viewCases")}
              <ArrowLeft size={15} className="ltr:rotate-180" />
            </Link>
          </div>
        </section>
      ) : null}

      {/* One dossier per patient */}
      <div className="lsd-container mt-10 space-y-12">
        {records.map(({ patient, relationshipType, showClinicalDetail, summary, documents }) => {
          const initials = `${patient.firstName?.[0] ?? ""}${patient.lastName?.[0] ?? ""}`;
          return (
            <Reveal key={patient.id}>
              <article className="overflow-hidden rounded-[30px] bg-white/80 ring-1 ring-[#e7dcc4] backdrop-blur-sm">
                <header className="lsd-hero-bg flex items-center gap-5 px-8 py-6">
                  <span className="lsd-avatar-ring shrink-0">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-[#0f5a45] text-xl font-black text-[#eacb7f] ring-4 ring-[#062a20]">
                      {initials}
                    </span>
                  </span>
                  <div>
                    <h2 className="text-2xl font-black text-white">
                      {patient.firstName} {patient.lastName}
                    </h2>
                    {relationshipType !== "self" ? (
                      <p className="mt-0.5 text-sm text-[#eacb7f]">{t(`relationshipTypes.${relationshipType}` as never)}</p>
                    ) : null}
                  </div>
                </header>
                <div className="space-y-5 p-8">

                {!showClinicalDetail ? (
                  <p className="rounded-[18px] bg-[#f6f1e6] px-6 py-4 text-sm text-[#6b6150]">{t("limitedAccessNotice")}</p>
                ) : null}

                {summary && summary.criticalAllergies.length > 0 ? (
                  <div className="flex items-start gap-3 rounded-[18px] border border-[#f1c7c0] bg-[#fdf1ef] px-6 py-4">
                    <ShieldAlert size={19} className="mt-0.5 shrink-0 text-[#b2453a]" />
                    <div>
                      <p className="text-sm font-bold text-[#8f2f26]">{t("criticalAllergies")}</p>
                      <p className="mt-1 text-sm text-[#5a2a24]">
                        {summary.criticalAllergies.map((allergy) => allergy.substance).filter(Boolean).join("، ")}
                      </p>
                    </div>
                  </div>
                ) : null}

                {showClinicalDetail ? (
                  <div className="grid grid-cols-3 gap-5">
                    <Column icon={Stethoscope} title={t("conditions")} empty={!summary?.activeConditions.length}>
                      <ul className="space-y-2.5">
                        {summary?.activeConditions.map((condition) => (
                          <li key={condition.id} className="flex items-center gap-2 text-[15px] text-[#3d4b45]">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a55a]" />
                            {condition.displayName}
                          </li>
                        ))}
                      </ul>
                    </Column>
                    <Column icon={Pill} title={t("medications")} empty={!summary?.currentMedications.length}>
                      <ul className="space-y-2.5">
                        {summary?.currentMedications.map((medication) => (
                          <li key={medication.id} className="flex items-center gap-2 text-[15px] text-[#3d4b45]">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a55a]" />
                            {medication.name}
                          </li>
                        ))}
                      </ul>
                    </Column>
                    <Column icon={FileText} title={t("documents")} empty={!documents.length}>
                      <ul className="divide-y divide-[#efe7d5]">
                        {documents.map((document) => (
                          <li key={document.id}>
                            <a
                              href={`/api/v1/patients/${patient.id}/documents/${document.id}/download`}
                              target="_blank"
                              rel="noreferrer"
                              className="group flex items-center gap-3 py-2.5 text-sm text-[#3d4b45] transition hover:text-[#083f30]"
                            >
                              <FileText size={15} className="shrink-0 text-[#a8a08e]" />
                              <span className="min-w-0 flex-1 truncate">{document.title}</span>
                              <Download size={15} className="shrink-0 text-[#c9a55a] transition group-hover:text-[#083f30]" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </Column>
                  </div>
                ) : null}

                {showClinicalDetail ? (
                  <div className="rounded-[22px] bg-[#fbf6ea] p-7 ring-1 ring-[#eadfc6]">
                    <SelfDeclareSection patientId={patient.id} />
                  </div>
                ) : null}
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>

      {/* Link a family member */}
      <section id="link-health-record-desktop" className="lsd-container mt-14 scroll-mt-32">
        <div className="rounded-[26px] bg-white p-8 ring-1 ring-[#e7dcc4]">
          <LinkFamilySection requests={linkRequests} />
        </div>
      </section>
    </div>
  );
}