import {
  Activity,
  ClipboardList,
  FileText,
  HeartPulse,
  Pill,
  Scissors,
  ShieldAlert,
  Stethoscope,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import type { AccountLinkRequestRow } from "@/features/patients/link-request-types";
import { INTAKE_CONDITION_KEYS, intakeCompletionPercent, type IntakeStep } from "@/features/patients/intake-schemas";
import { Link } from "@/i18n/navigation";
import type { TranslationType } from "@/types/next";

import type { HealthRecordEntry } from "./page";
import { LinkFamilySection } from "./link-family-section";
import { StartRecordForm } from "./start-record-form";

const QUESTIONNAIRE_PATH = "/account/my-health-record/questionnaire";

function formatDate(value: string | null | undefined, locale: string): string | null {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
  } catch {
    return value;
  }
}

/**
 * The health record page body, shared by the phone layout and the desktop
 * shell: a "start" card when the account has no record of its own yet, then
 * one readable summary per linked person, then family linking.
 */
export async function HealthRecordBody({
  records,
  linkRequests,
  defaultName,
}: {
  records: HealthRecordEntry[];
  linkRequests: AccountLinkRequestRow[];
  defaultName: { firstName: string; lastName: string };
}) {
  const t = (await getTranslations("MobileProfile.myHealthRecord")) as unknown as TranslationType;
  const locale = await getLocale();
  const hasOwnRecord = records.some((record) => record.relationshipType === "self");

  return (
    <div className="space-y-8">
      {!hasOwnRecord && (
        <section className="rounded-[28px] bg-white p-6 ring-1 ring-[#e7dcc4] sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#083f30] text-[#eacb7f]">
              <HeartPulse size={22} />
            </span>
            <div>
              <h2 className="text-xl font-black text-[#0e1a16]">{t("intake.start.title")}</h2>
              <p className="mt-1.5 text-sm leading-6 text-[#6b6150]">{t("intake.start.body")}</p>
            </div>
          </div>
          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            {(["one", "two", "three"] as const).map((key, index) => (
              <li key={key} className="rounded-2xl bg-[#f6f1e6] p-4">
                <p className="text-xs font-bold text-[#c9a55a]">{index + 1}</p>
                <p className="mt-1 text-sm font-bold text-[#0e1a16]">{t(`intake.start.steps.${key}.title`)}</p>
                <p className="mt-1 text-xs leading-5 text-[#6b6150]">{t(`intake.start.steps.${key}.body`)}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 border-t border-[#efe5cf] pt-6">
            <StartRecordForm defaultFirstName={defaultName.firstName} defaultLastName={defaultName.lastName} />
          </div>
        </section>
      )}

      {records.map((record) => (
        <PatientSummary key={record.patient.id} record={record} t={t} locale={locale} />
      ))}

      <section id="link-health-record" className="scroll-mt-32 rounded-[24px] bg-white p-5 ring-1 ring-[#e7dcc4] sm:p-7">
        <LinkFamilySection requests={linkRequests} />
      </section>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  editHref,
  editLabel,
  children,
  empty,
  emptyLabel,
}: {
  icon: LucideIcon;
  title: string;
  editHref?: string;
  editLabel: string;
  children?: ReactNode;
  empty: boolean;
  emptyLabel: string;
}) {
  return (
    <div className="flex flex-col rounded-[22px] bg-white p-5 ring-1 ring-[#e7dcc4]">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold text-[#083f30]">
          <span className="grid size-8 place-items-center rounded-full bg-[#083f30] text-[#eacb7f]">
            <Icon size={15} />
          </span>
          {title}
        </p>
        {editHref ? (
          <Link href={editHref} className="rounded-full px-3 py-1 text-xs font-bold text-[#0f5a45] ring-1 ring-[#e7dcc4] hover:ring-[#c9a55a]">
            {editLabel}
          </Link>
        ) : null}
      </div>
      <div className="mt-3 flex-1 text-sm text-[#3d362a]">
        {empty ? <p className="text-[#b5ab97]">{emptyLabel}</p> : children}
      </div>
    </div>
  );
}

function Lines({ lines }: { lines: (string | null | undefined | false)[] }) {
  const visible = lines.filter((line): line is string => Boolean(line));
  return (
    <ul className="space-y-1.5">
      {visible.map((line, index) => (
        <li key={index} className="flex items-start gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a55a]" />
          <span className="break-words">{line}</span>
        </li>
      ))}
    </ul>
  );
}

function PatientSummary({ record, t, locale }: { record: HealthRecordEntry; t: TranslationType; locale: string }) {
  const { patient, relationshipType, showClinicalDetail, intake, lists, documents } = record;
  const initials = `${patient.firstName?.[0] ?? ""}${patient.lastName?.[0] ?? ""}`;
  const percent = intakeCompletionPercent(intake);
  const editHref = (step: IntakeStep) => `${QUESTIONNAIRE_PATH}?patient=${patient.id}&step=${step}`;
  const edit = showClinicalDetail ? editHref : () => undefined;
  const editLabel = t("intake.summary.edit");
  const notAnswered = t("intake.summary.notAnswered");

  const allergies = lists?.allergies.filter((allergy) => allergy.category !== "no_known_allergies") ?? [];
  const noKnownAllergies = lists?.allergies.some((allergy) => allergy.category === "no_known_allergies") ?? false;
  const yesConditions = INTAKE_CONDITION_KEYS.filter((key) => intake?.conditionAnswers?.[key]?.answer === "yes");
  const otherConditions =
    lists?.conditions.filter((condition) => !yesConditions.some((key) => intake?.conditionAnswers?.[key]?.conditionId === condition.id)) ?? [];
  const answeredConditions = INTAKE_CONDITION_KEYS.some((key) => intake?.conditionAnswers?.[key]);

  return (
    <article className="overflow-hidden rounded-[28px] bg-white/80 ring-1 ring-[#e7dcc4]">
      <header className="flex flex-col gap-4 bg-[#083f30] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#0f5a45] text-lg font-black text-[#eacb7f] ring-4 ring-[#062a20]">
            {initials}
          </span>
          <div>
            <h2 className="text-xl font-black text-white">
              {patient.firstName} {patient.lastName}
            </h2>
            <p className="mt-0.5 text-sm text-[#eacb7f]">
              {relationshipType === "self" ? t("intake.summary.yourRecord") : t(`relationshipTypes.${relationshipType}`)}
            </p>
          </div>
        </div>
        {showClinicalDetail ? (
          <div className="sm:w-64">
            <div className="flex items-baseline justify-between text-xs font-semibold text-white/80">
              <span>{t("intake.summary.completeness")}</span>
              <span dir="ltr">{percent}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-[#eacb7f]" style={{ width: `${percent}%` }} />
            </div>
          </div>
        ) : null}
      </header>

      <div className="space-y-5 p-5 sm:p-7">
        {!showClinicalDetail ? (
          <p className="rounded-[18px] bg-[#f6f1e6] px-5 py-4 text-sm text-[#6b6150]">{t("limitedAccessNotice")}</p>
        ) : (
          <>
            {allergies.length > 0 && (
              <div className="flex items-start gap-3 rounded-[18px] border border-red-200 bg-red-50 px-5 py-4">
                <ShieldAlert size={19} className="mt-0.5 shrink-0 text-red-700" />
                <div>
                  <p className="text-sm font-bold text-red-800">{t("intake.summary.allergyAlert")}</p>
                  <p className="mt-1 text-sm text-red-900">
                    {allergies.map((allergy) => allergy.name).filter(Boolean).join(locale === "fa" || locale === "ar" ? "، " : ", ")}
                  </p>
                </div>
              </div>
            )}

            {percent < 100 && (
              <div className="flex flex-col gap-3 rounded-[20px] bg-[#f6f1e6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-[#0e1a16]">
                    {percent === 0 ? t("intake.summary.startTitle") : t("intake.summary.continueTitle")}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-[#6b6150]">{t("intake.summary.continueBody")}</p>
                </div>
                <Link
                  href={`${QUESTIONNAIRE_PATH}?patient=${patient.id}`}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#083f30] px-6 text-sm font-bold text-white hover:bg-[#0f5a45]"
                >
                  {percent === 0 ? t("intake.summary.startCta") : t("intake.summary.continueCta")}
                </Link>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SectionCard
                icon={UserRound}
                title={t("intake.steps.about.short")}
                editHref={edit("about")}
                editLabel={editLabel}
                emptyLabel={notAnswered}
                empty={false}
              >
                <Lines
                  lines={[
                    formatDate(patient.birthDate, locale),
                    patient.sexAtBirth && patient.sexAtBirth !== "unknown" ? t(`intake.about.sexes.${patient.sexAtBirth}`) : null,
                    intake?.heightCm ? t("intake.review.height", { value: intake.heightCm }) : null,
                    intake?.weightKg ? t("intake.review.weight", { value: intake.weightKg }) : null,
                    intake?.bloodType
                      ? t("intake.review.bloodType", { value: intake.bloodType === "unknown" ? t("intake.about.bloodTypeUnknown") : intake.bloodType })
                      : null,
                  ]}
                />
              </SectionCard>

              <SectionCard
                icon={ClipboardList}
                title={t("intake.steps.concern.short")}
                editHref={edit("concern")}
                editLabel={editLabel}
                emptyLabel={notAnswered}
                empty={!intake?.mainConcern && !intake?.desiredTreatment}
              >
                <Lines
                  lines={[
                    intake?.mainConcern,
                    intake?.concernBodyArea,
                    intake?.concernDuration ? t(`intake.concern.durations.${intake.concernDuration}`) : null,
                    intake?.concernSeverity != null ? t("intake.review.severity", { value: intake.concernSeverity }) : null,
                    intake?.desiredTreatment ? `${t("intake.summary.wants")}: ${intake.desiredTreatment}` : null,
                  ]}
                />
              </SectionCard>

              <SectionCard
                icon={Stethoscope}
                title={t("intake.steps.conditions.short")}
                editHref={edit("conditions")}
                editLabel={editLabel}
                emptyLabel={notAnswered}
                empty={!answeredConditions && otherConditions.length === 0}
              >
                {yesConditions.length === 0 && otherConditions.length === 0 ? (
                  <p>{t("intake.review.noConditions")}</p>
                ) : (
                  <Lines
                    lines={[
                      ...yesConditions.map((key) =>
                        [t(`intake.conditions.items.${key}`), intake?.conditionAnswers?.[key]?.details].filter(Boolean).join(": ")
                      ),
                      ...otherConditions.map((condition) => condition.name),
                    ]}
                  />
                )}
                {intake?.pregnancyStatus && intake.pregnancyStatus !== "none" ? (
                  <p className="mt-2 text-xs font-semibold text-[#0f5a45]">{t(`intake.conditions.pregnancyStatuses.${intake.pregnancyStatus}`)}</p>
                ) : null}
              </SectionCard>

              <SectionCard
                icon={Scissors}
                title={t("intake.steps.surgeries.short")}
                editHref={edit("surgeries")}
                editLabel={editLabel}
                emptyLabel={intake?.completedSteps.includes("surgeries") ? t("intake.surgeries.empty") : notAnswered}
                empty={!lists?.procedures.length && intake?.anesthesiaProblems !== "yes"}
              >
                <Lines
                  lines={[
                    ...(lists?.procedures.map((procedure) =>
                      [procedure.name, formatDate(procedure.performedFrom, locale)].filter(Boolean).join(" · ")
                    ) ?? []),
                    intake?.anesthesiaProblems === "yes"
                      ? [t("intake.summary.anesthesiaProblem"), intake.anesthesiaDetails].filter(Boolean).join(": ")
                      : null,
                  ]}
                />
              </SectionCard>

              <SectionCard
                icon={Pill}
                title={t("intake.steps.medicines.short")}
                editHref={edit("medicines")}
                editLabel={editLabel}
                emptyLabel={intake?.completedSteps.includes("medicines") ? t("intake.medicines.empty") : notAnswered}
                empty={!lists?.medications.length && !allergies.length && !noKnownAllergies && intake?.takesBloodThinners !== "yes"}
              >
                <Lines
                  lines={[
                    ...(lists?.medications.map((medication) => [medication.name, medication.dose, medication.frequency].filter(Boolean).join(" · ")) ?? []),
                    intake?.takesBloodThinners === "yes" ? t("intake.summary.bloodThinners") : null,
                    noKnownAllergies && !allergies.length ? t("intake.medicines.noKnownAllergies") : null,
                  ]}
                />
              </SectionCard>

              <SectionCard
                icon={Activity}
                title={t("intake.steps.lifestyle.short")}
                editHref={edit("lifestyle")}
                editLabel={editLabel}
                emptyLabel={notAnswered}
                empty={!intake?.smoking && !intake?.alcohol && !intake?.activityLevel}
              >
                <Lines
                  lines={[
                    intake?.smoking ? `${t("intake.lifestyle.smoking")} ${t(`intake.lifestyle.smokingOptions.${intake.smoking}`)}` : null,
                    intake?.alcohol ? `${t("intake.lifestyle.alcohol")} ${t(`intake.lifestyle.alcoholOptions.${intake.alcohol}`)}` : null,
                    intake?.activityLevel ? `${t("intake.lifestyle.activity")} ${t(`intake.lifestyle.activityOptions.${intake.activityLevel}`)}` : null,
                  ]}
                />
              </SectionCard>
            </div>

            <SectionCard
              icon={FileText}
              title={t("intake.steps.documents.short")}
              editHref={edit("documents")}
              editLabel={t("intake.summary.addDocument")}
              emptyLabel={t("intake.documents.empty")}
              empty={documents.length === 0}
            >
              <ul className="grid gap-2 sm:grid-cols-2">
                {documents.map((document) => (
                  <li key={document.id}>
                    <a
                      href={`/api/v1/patients/${patient.id}/documents/${document.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl bg-[#faf6ee] px-4 py-3 transition hover:bg-[#f6f1e6]"
                    >
                      <FileText size={16} className="shrink-0 text-[#0f5a45]" />
                      <span className="min-w-0 truncate">{document.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <p className="text-xs leading-5 text-[#8a806d]">{t("intake.review.selfReportedNotice")}</p>
          </>
        )}
      </div>
    </article>
  );
}
