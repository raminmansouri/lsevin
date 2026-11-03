import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Reveal } from "../components/motion";

type Entry = {
  patient: { id: string; firstName: string | null; lastName: string | null };
  relationshipType: string;
  passports: { id: string; language: string; createdAt: string | null }[];
};

/** Desktop my-passport (>= 1280px): each health passport as a booklet whose cover opens on hover. */
export async function DesktopMyPassport({ patientsWithPassports, locale }: { patientsWithPassports: Entry[]; locale: string }) {
  const t = await getTranslations("MobileProfile.myPassport");
  const tPassport = await getTranslations("Patients.admin.passport");
  const date = (value?: string | null) => {
    if (!value) return "-";
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
    } catch {
      return value;
    }
  };
  const hasAny = patientsWithPassports.some((entry) => entry.passports.length > 0);

  return (
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg overflow-hidden rounded-[36px] px-12 py-12 text-white">
          <Reveal className="space-y-3">
            <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">HEALTH PASSPORT</span>
            <h1 className="lsd-gold-text text-[40px] font-black leading-tight">{t("title")}</h1>
            <p className="max-w-2xl text-base leading-7 text-white/70">{t("subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <div className="lsd-container mt-12 space-y-14">
        {!hasAny ? <p className="rounded-[24px] bg-white p-10 text-center text-[#6b6150] ring-1 ring-[#e7dcc4]">{t("empty")}</p> : null}

        {patientsWithPassports.map(({ patient, relationshipType, passports }) =>
          passports.length === 0 ? null : (
            <section key={patient.id}>
              <div className="mb-6 flex items-center gap-5">
                <h2 className="shrink-0 text-xl font-black text-[#0e1a16]">
                  {patient.firstName} {patient.lastName}
                  {relationshipType !== "self" ? (
                    <span className="ms-2 text-sm font-bold text-[#8c6b2c]">— {t(`relationshipTypes.${relationshipType}` as never)}</span>
                  ) : null}
                </h2>
                <div className="lsd-hairline flex-1" />
              </div>

              <div className="grid grid-cols-4 gap-8">
                {passports.map((passport, index) => {
                  const language = tPassport(`languages.${passport.language}` as never);
                  return (
                    <Reveal key={passport.id} delay={(index % 4) * 80}>
                      <a href={`/api/v1/patients/${patient.id}/passports/${passport.id}/fhir`} target="_blank" rel="noreferrer" className="group block">
                        <span className="lsd-passport relative block aspect-[3/4]">
                          {/* Inside page, revealed as the cover opens */}
                          <span className="absolute inset-0 flex flex-col justify-end gap-1 rounded-[16px] bg-[#fbf6ea] p-6 ring-1 ring-[#eadfc6]">
                            <span className="text-[10px] font-bold tracking-[0.3em] text-[#c9a55a]">L SEVIN</span>
                            <span className="text-sm font-black text-[#0e1a16]">
                              {patient.firstName} {patient.lastName}
                            </span>
                            <span className="text-xs text-[#6b6150]">{date(passport.createdAt)}</span>
                          </span>

                          {/* Cover */}
                          <span className="lsd-passport-cover lsd-hero-bg absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-[16px] text-center shadow-[0_24px_40px_-24px_rgba(6,42,32,0.7)]">
                            <span className="absolute inset-3 rounded-[10px] border border-[#eacb7f]/45" aria-hidden="true" />
                            <Image src="/brand/lsevin-mark-reversed.png" alt="" aria-hidden="true" width={54} height={76} />
                            <span className="space-y-1.5">
                              <span className="block text-[10px] font-bold tracking-[0.45em] text-[#eacb7f]">HEALTH PASSPORT</span>
                              <span className="block text-base font-black text-white">{language}</span>
                            </span>
                          </span>
                        </span>

                        <span className="mt-4 flex items-center justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block truncate font-bold text-[#0e1a16]">{language}</span>
                            <span className="block text-xs text-[#8a8170]">{date(passport.createdAt)}</span>
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#083f30] transition group-hover:text-[#8c6b2c]">
                            {t("view")}
                            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1 ltr:rotate-180" />
                          </span>
                        </span>
                      </a>
                    </Reveal>
                  );
                })}
              </div>
            </section>
          )
        )}
      </div>
    </div>
  );
}