import { CalendarClock, ClipboardCheck, FileSearch, Stethoscope } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ComponentProps } from "react";

import type { CaseBundle } from "@/app/[locale]/n/app/mobile/profile/my-cases/page";
import { RequirementUploadList } from "@/app/[locale]/n/app/mobile/profile/my-cases/requirement-upload-list";
import { ShareCaseSection } from "@/app/[locale]/n/app/mobile/profile/my-cases/share-case-section";
import type { CustomerJourney } from "@/features/case-management/server/customer-repository";
import { Link } from "@/i18n/navigation";

import { Reveal } from "../components/motion";

type PatientCases = {
  patient: { id: string; firstName: string | null; lastName: string | null };
  relationshipType: string;
  cases: CaseBundle[];
};

function SectionLabel({ icon: Icon, children }: { icon: typeof Stethoscope; children: string }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-sm font-bold text-[#083f30]">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#083f30] text-[#eacb7f]">
        <Icon size={15} />
      </span>
      {children}
    </p>
  );
}

function ReadinessRing({ percent, satisfied, total }: { percent: number; satisfied: number; total: number }) {
  const circumference = 2 * Math.PI * 52;
  return (
    <div className="relative mx-auto grid h-[136px] w-[136px] place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="lsd-ready" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f5a45" />
            <stop offset="100%" stopColor="#c9a55a" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="52" fill="none" stroke="#efe7d5" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="url(#lsd-ready)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(Math.max(percent, 0), 100) / 100)}
        />
      </svg>
      <div className="text-center" dir="ltr">
        <p className="text-[28px] font-black text-[#083f30]">{percent}%</p>
        <p className="text-xs text-[#8c6b2c]">
          {satisfied}/{total}
        </p>
      </div>
    </div>
  );
}

/** Desktop my-cases (>= 1280px): same journeys, cases and actions as mobile, in cream, green and gold. */
export async function DesktopMyCases({
  patientsWithCases,
  journeys,
  bookedProviders,
  locale,
}: {
  patientsWithCases: PatientCases[];
  journeys: CustomerJourney[];
  bookedProviders: ComponentProps<typeof ShareCaseSection>["bookedProviders"];
  locale: string;
}) {
  const t = await getTranslations("MobileProfile.myCases");
  const tCases = await getTranslations("Patients.admin.cases");
  const tJourney = await getTranslations("CaseManagement");
  const date = (value?: string | null, withTime = false) => {
    if (!value) return "-";
    try {
      return new Intl.DateTimeFormat(locale, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(new Date(value));
    } catch {
      return value;
    }
  };
  const hasAnyCase = patientsWithCases.some((entry) => entry.cases.length > 0);

  return (
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      {/* Header */}
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg relative overflow-hidden rounded-[36px] px-12 py-12 text-white">
          <Reveal className="relative space-y-3">
            <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">CARE JOURNEY</span>
            <h1 className="lsd-gold-text text-[40px] font-black leading-tight">{t("title")}</h1>
            <p className="max-w-2xl text-base leading-7 text-white/70">{t("subtitle")}</p>
          </Reveal>
        </div>
      </section>

      {/* Journeys */}
      {journeys.length ? (
        <section className="lsd-container mt-12">
          <h2 className="mb-6 text-2xl font-black text-[#0e1a16]">{tJourney("cases")}</h2>
          <div className="grid grid-cols-2 gap-5">
            {journeys.map((journey, index) => {
              const progress = journey.totalSteps ? Math.round((journey.completedSteps * 100) / journey.totalSteps) : 0;
              const statusKey = journey.status === "on_hold" ? "onHold" : journey.status;
              return (
                <Reveal key={journey.id} delay={(index % 2) * 80}>
                  <Link
                    href={`/n/app/mobile/bookings/${journey.bookingId}`}
                    className="block rounded-[24px] bg-white p-6 ring-1 ring-[#e7dcc4] transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_50px_-30px_rgba(6,42,32,0.4)] hover:ring-[#c9a55a]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-black text-[#0e1a16]">{journey.serviceName}</p>
                        <p className="truncate text-sm text-[#6b6150]">{journey.providerName}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#fbf3de] px-3 py-1 text-xs font-bold text-[#8c6b2c]">{tJourney(statusKey as never)}</span>
                    </div>
                    <div className="mt-5">
                      <div className="mb-2 flex justify-between text-xs font-bold text-[#56675f]">
                        <span>{journey.currentStep || tJourney("scheduled")}</span>
                        <span dir="ltr">{progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#efe7d5]">
                        <div className="h-full rounded-full bg-gradient-to-l from-[#c9a55a] to-[#0f5a45]" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    {journey.plannedStartAt ? <p className="mt-3 text-xs text-[#8a8170]">{date(journey.plannedStartAt, true)}</p> : null}
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : null}

      {!hasAnyCase && journeys.length === 0 ? (
        <div className="lsd-container mt-12">
          <p className="rounded-[24px] bg-white p-10 text-center text-[#6b6150] ring-1 ring-[#e7dcc4]">{t("empty")}</p>
        </div>
      ) : null}

      {/* Cases, per patient */}
      <div className="lsd-container mt-12 space-y-10">
        {patientsWithCases.map(({ patient, relationshipType, cases }) =>
          cases.length === 0 ? null : (
            <section key={patient.id} className="space-y-6">
              {relationshipType !== "self" ? (
                <p className="text-sm font-bold text-[#8c6b2c]">
                  {patient.firstName} {patient.lastName} — {t(`relationshipTypes.${relationshipType}` as never)}
                </p>
              ) : null}

              {cases.map(({ medicalCase, requirements, proposals, secondOpinions, followUps, grants, readiness }) => (
                <Reveal key={medicalCase.id}>
                  <article className="overflow-hidden rounded-[30px] bg-white ring-1 ring-[#e7dcc4]">
                    <header className="lsd-hero-bg flex items-center justify-between gap-6 px-8 py-6">
                      <div className="min-w-0">
                        <h3 className="truncate text-2xl font-black text-white">{medicalCase.title}</h3>
                        <p dir="ltr" className="mt-1 font-mono text-xs tracking-wider text-white/55">
                          {medicalCase.caseNumber}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#eacb7f] px-4 py-1.5 text-xs font-black text-[#062a20]">
                        {tCases(`statuses.${medicalCase.caseStatus}` as never)}
                      </span>
                    </header>

                    <div className="grid grid-cols-[1fr_340px] gap-8 p-8">
                      <div className="min-w-0 space-y-8">
                        {requirements.length ? (
                          <div>
                            <SectionLabel icon={ClipboardCheck}>{t("requirements")}</SectionLabel>
                            <div className="rounded-[20px] bg-[#fbf6ea] p-5 ring-1 ring-[#eadfc6]">
                              <RequirementUploadList
                                requirements={requirements.map((requirement) => ({
                                  ...requirement,
                                  statusLabel: tCases(`requirementStatuses.${requirement.requirementStatus}` as never),
                                  typeLabel: tCases(`requirementTypes.${requirement.requirementType}` as never),
                                }))}
                                patientId={patient.id}
                                medicalCaseId={medicalCase.id}
                              />
                            </div>
                          </div>
                        ) : null}

                        {proposals.length ? (
                          <div>
                            <SectionLabel icon={Stethoscope}>{t("treatmentProposals")}</SectionLabel>
                            <div className="grid grid-cols-2 gap-4">
                              {proposals.map((proposal) => (
                                <div key={proposal.id} className="rounded-[18px] bg-white p-5 ring-1 ring-[#e7dcc4]">
                                  <div className="flex items-start justify-between gap-3">
                                    {proposal.suggestedProcedure ? <p className="font-black text-[#0e1a16]">{proposal.suggestedProcedure}</p> : <span />}
                                    <span className="shrink-0 rounded-full bg-[#e7f4ee] px-2.5 py-0.5 text-[11px] font-bold text-[#0f5a45]">
                                      {tCases(`proposalStatuses.${proposal.proposalStatus}` as never)}
                                    </span>
                                  </div>
                                  {proposal.treatmentPlan ? <p className="mt-2 text-sm leading-6 text-[#56675f]">{proposal.treatmentPlan}</p> : null}
                                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8c6b2c]">
                                    {proposal.estimatedStayDays !== null ? (
                                      <span>
                                        {t("estimatedStay")}: {proposal.estimatedStayDays} {t("days")}
                                      </span>
                                    ) : null}
                                    {proposal.validUntil ? (
                                      <span>
                                        {t("validUntil")}: {date(proposal.validUntil)}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {secondOpinions.length ? (
                          <div>
                            <SectionLabel icon={FileSearch}>{t("secondOpinions")}</SectionLabel>
                            <div className="space-y-3">
                              {secondOpinions.map((opinion) => (
                                <div key={opinion.id} className="rounded-[18px] bg-[#fbf6ea] px-5 py-4 ring-1 ring-[#eadfc6]">
                                  <p className="text-xs font-bold text-[#8c6b2c]">{date(opinion.opinionDate)}</p>
                                  <p className="mt-1 text-sm leading-6 text-[#3d4b45]">{opinion.conclusion}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {followUps.length ? (
                          <div>
                            <SectionLabel icon={CalendarClock}>{t("followUps")}</SectionLabel>
                            <ol className="relative space-y-3 border-s-2 border-[#efe7d5] ps-6">
                              {followUps.map((followUp) => (
                                <li key={followUp.id} className="relative flex items-center justify-between gap-4">
                                  <span className="absolute -start-[31px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#c9a55a] ring-4 ring-white" />
                                  <span className="text-sm font-bold text-[#0e1a16]">{date(followUp.scheduledDate)}</span>
                                  <span className="text-xs text-[#6b6150]">{tCases(`followupStatuses.${followUp.followupStatus}` as never)}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        ) : null}
                      </div>

                      <aside className="space-y-5">
                        {requirements.length ? (
                          <div className="rounded-[22px] bg-white p-6 text-center ring-1 ring-[#e7dcc4]">
                            <ReadinessRing percent={readiness.percent} satisfied={readiness.satisfied} total={readiness.total} />
                            <p className="mt-3 text-sm font-bold text-[#083f30]">{t("requirements")}</p>
                          </div>
                        ) : null}
                        <div className="rounded-[22px] bg-[#fbf6ea] p-6 ring-1 ring-[#eadfc6]">
                          <ShareCaseSection patientId={patient.id} medicalCaseId={medicalCase.id} grants={grants} bookedProviders={bookedProviders} />
                        </div>
                      </aside>
                    </div>
                  </article>
                </Reveal>
              ))}
            </section>
          )
        )}
      </div>
    </div>
  );
}