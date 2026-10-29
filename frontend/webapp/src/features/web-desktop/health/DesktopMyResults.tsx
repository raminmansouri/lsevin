import { ClipboardList, FileText, FlaskConical, Info, ScanLine } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ImagingCard } from "@/app/[locale]/n/app/mobile/profile/my-results/page";
import type { ClinicalObservationRow, DiagnosticReportRow, ImagingStudyRow, LabOrderRow } from "@/features/patients/documents-types";

import { Reveal } from "../components/motion";

type Entry = {
  patient: { id: string; firstName: string | null; lastName: string | null };
  relationshipType: string;
  labOrders: LabOrderRow[];
  diagnosticReports: DiagnosticReportRow[];
  observations: ClinicalObservationRow[];
  imagingStudies: ImagingStudyRow[];
};

// Colours follow the interpretation recorded on the result; this page never re-interprets.
const TONE: Record<string, { chip: string; dot: string }> = {
  normal: { chip: "bg-[#e7f4ee] text-[#0f5a45]", dot: "bg-[#0f5a45]" },
  high: { chip: "bg-[#fbf3de] text-[#8c6b2c]", dot: "bg-[#c9a55a]" },
  low: { chip: "bg-[#fbf3de] text-[#8c6b2c]", dot: "bg-[#c9a55a]" },
  abnormal: { chip: "bg-[#fbf3de] text-[#8c6b2c]", dot: "bg-[#c9a55a]" },
  critical_high: { chip: "bg-[#fdf1ef] text-[#b2453a]", dot: "bg-[#b2453a]" },
  critical_low: { chip: "bg-[#fdf1ef] text-[#b2453a]", dot: "bg-[#b2453a]" },
};
const NEUTRAL = { chip: "bg-[#f6f1e6] text-[#6b6150]", dot: "bg-[#8a8170]" };

/** Where the value sits against its recorded reference range, as a small bar. */
function RangeBar({ value, low, high, dot }: { value: number; low: number; high: number; dot: string }) {
  if (!(high > low)) return null;
  const span = high - low;
  const min = low - span * 0.5;
  const max = high + span * 0.5;
  const at = (v: number) => Math.min(Math.max(((v - min) / (max - min)) * 100, 2), 98);
  return (
    <span className="relative block h-2 w-40 rounded-full bg-[#efe7d5]" dir="ltr" aria-hidden="true">
      <span className="absolute inset-y-0 rounded-full bg-[#cfe8dc]" style={{ left: `${at(low)}%`, right: `${100 - at(high)}%` }} />
      <span className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${dot}`} style={{ left: `${at(value)}%` }} />
    </span>
  );
}

function Title({ icon: Icon, children }: { icon: typeof FileText; children: string }) {
  return (
    <h3 className="mb-4 flex items-center gap-3 text-lg font-black text-[#0e1a16]">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#083f30] text-[#eacb7f]">
        <Icon size={18} />
      </span>
      {children}
    </h3>
  );
}

/** Desktop my-results (>= 1280px): the record as it stands, laid out like a lab report. */
export async function DesktopMyResults({ patientsWithResults, locale }: { patientsWithResults: Entry[]; locale: string }) {
  const t = await getTranslations("MobileProfile.myResults");
  const tDocs = await getTranslations("Patients.admin.documents");
  const td = (key: string) => tDocs(key as never);
  const date = (value?: string | null) => {
    if (!value) return "-";
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
    } catch {
      return value;
    }
  };
  const hasAny = patientsWithResults.some(
    (entry) => entry.labOrders.length || entry.diagnosticReports.length || entry.observations.length || entry.imagingStudies.length
  );

  return (
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg overflow-hidden rounded-[36px] px-12 py-12 text-white">
          <Reveal className="space-y-3">
            <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">RESULTS</span>
            <h1 className="lsd-gold-text text-[40px] font-black leading-tight">{t("title")}</h1>
            <p className="max-w-2xl text-base leading-7 text-white/70">{t("subtitle")}</p>
          </Reveal>
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-[18px] border border-[#f0dcae] bg-[#fdf7e8] px-6 py-4 text-sm leading-6 text-[#7a5d22]">
          <Info size={18} className="mt-0.5 shrink-0 text-[#b08a3c]" />
          {t("disclaimer")}
        </div>
      </section>

      <div className="lsd-container mt-12 space-y-14">
        {!hasAny ? <p className="rounded-[24px] bg-white p-10 text-center text-[#6b6150] ring-1 ring-[#e7dcc4]">{t("empty")}</p> : null}

        {patientsWithResults.map(({ patient, relationshipType, labOrders, diagnosticReports, observations, imagingStudies }) =>
          !labOrders.length && !diagnosticReports.length && !observations.length && !imagingStudies.length ? null : (
            <section key={patient.id} className="space-y-8">
              {relationshipType !== "self" ? (
                <div className="flex items-center gap-5">
                  <h2 className="shrink-0 text-xl font-black text-[#0e1a16]">
                    {patient.firstName} {patient.lastName}
                    <span className="ms-2 text-sm font-bold text-[#8c6b2c]">— {t(`relationshipTypes.${relationshipType}` as never)}</span>
                  </h2>
                  <div className="lsd-hairline flex-1" />
                </div>
              ) : null}

              {/* Observations as a lab sheet */}
              {observations.length ? (
                <Reveal>
                  <div className="overflow-hidden rounded-[28px] bg-white ring-1 ring-[#e7dcc4]">
                    <div className="px-8 pt-7">
                      <Title icon={FlaskConical}>{t("observations")}</Title>
                    </div>
                    <ul className="divide-y divide-[#f1ead9]">
                      {observations.map((observation) => {
                        const tone = (observation.interpretation && TONE[observation.interpretation]) || NEUTRAL;
                        const hasRange = observation.valueNumber !== null && observation.referenceLow !== null && observation.referenceHigh !== null;
                        return (
                          <li key={observation.id} className="grid grid-cols-[1.4fr_1fr_auto_auto_auto] items-center gap-6 px-8 py-5">
                            <span className="min-w-0">
                              <span className="block truncate font-bold text-[#0e1a16]">{observation.displayName}</span>
                              <span className="block text-xs text-[#8a8170]">{date(observation.effectiveAt)}</span>
                            </span>
                            <span className="font-mono text-xl font-black text-[#083f30]" dir="ltr">
                              {observation.valueNumber !== null ? (
                                <>
                                  {observation.valueNumber} <span className="text-sm font-bold text-[#8a8170]">{observation.unit}</span>
                                </>
                              ) : (
                                <span className="font-sans text-base">{observation.valueText ?? "-"}</span>
                              )}
                            </span>
                            {hasRange ? (
                              <RangeBar
                                value={observation.valueNumber as number}
                                low={observation.referenceLow as number}
                                high={observation.referenceHigh as number}
                                dot={tone.dot}
                              />
                            ) : (
                              <span className="w-40" />
                            )}
                            <span className="min-w-[90px] text-xs text-[#8a8170]" dir="ltr">
                              {observation.referenceLow !== null || observation.referenceHigh !== null
                                ? `${observation.referenceLow ?? "?"} – ${observation.referenceHigh ?? "?"}`
                                : ""}
                            </span>
                            <span className="min-w-[90px] text-end">
                              {observation.interpretation ? (
                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone.chip}`}>{td(`interpretations.${observation.interpretation}`)}</span>
                              ) : null}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </Reveal>
              ) : null}

              {/* Diagnostic reports */}
              {diagnosticReports.length ? (
                <Reveal>
                  <Title icon={FileText}>{t("diagnosticReports")}</Title>
                  <div className="grid grid-cols-2 gap-5">
                    {diagnosticReports.map((report) => (
                      <div key={report.id} className="rounded-[22px] bg-white p-6 ring-1 ring-[#e7dcc4]">
                        <div className="flex items-start justify-between gap-4">
                          <p className="font-black text-[#0e1a16]">{report.title}</p>
                          <span className="shrink-0 rounded-full bg-[#f6f1e6] px-3 py-1 text-xs font-bold text-[#8c6b2c]">
                            {td(`reportStatuses.${report.reportStatus}`)}
                          </span>
                        </div>
                        {report.summary ? <p className="mt-2 text-sm leading-6 text-[#56675f]">{report.summary}</p> : null}
                        <p className="mt-3 text-xs text-[#8a8170]">{date(report.issuedAt ?? report.effectiveAt)}</p>
                      </div>
                    ))}
                  </div>
                </Reveal>
              ) : null}

              {/* Lab orders */}
              {labOrders.length ? (
                <Reveal>
                  <Title icon={ClipboardList}>{t("labOrders")}</Title>
                  <div className="divide-y divide-[#f1ead9] overflow-hidden rounded-[22px] bg-white ring-1 ring-[#e7dcc4]">
                    {labOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between gap-6 px-7 py-4">
                        <div className="flex flex-wrap gap-2">
                          {order.requestedTests.map((test) => (
                            <span key={test} className="rounded-full bg-[#fbf6ea] px-3 py-1 text-sm text-[#3d4b45] ring-1 ring-[#eadfc6]">
                              {test}
                            </span>
                          ))}
                        </div>
                        <span className="shrink-0 rounded-full bg-[#f6f1e6] px-3 py-1 text-xs font-bold text-[#8c6b2c]">
                          {td(`labOrderStatuses.${order.orderStatus}`)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Reveal>
              ) : null}

              {/* Imaging: the existing card inside a desktop frame */}
              {imagingStudies.length ? (
                <Reveal>
                  <Title icon={ScanLine}>{t("imaging")}</Title>
                  <div className="rounded-[22px] bg-white p-6 ring-1 ring-[#e7dcc4] [&>div]:bg-transparent [&>div]:p-0">
                    <ImagingCard title="" studies={imagingStudies} tDocs={td} />
                  </div>
                </Reveal>
              ) : null}
            </section>
          )
        )}
      </div>
    </div>
  );
}