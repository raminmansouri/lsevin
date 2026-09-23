import { Download } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { listPatientAccessForAccount } from "@/features/patients/server/repository";
import { listPassportsForPatient } from "@/features/patients/server/passport-repository";

import { requireAuthenticatedUserId } from "./auth";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

/**
 * Read-only, no interactivity -- entirely a server component, so unlike
 * my-sharing it's free to reuse the already-translated
 * Patients.admin.passport.languages.* strings directly (getTranslations
 * reads the full catalog server-side; only client components are limited
 * to what src/i18n/client-messages.ts ships to the browser).
 *
 * Passport generation stays admin/coordinator-only (V4.5: "Allow
 * coordinator to select records to include") -- this only lists what has
 * already been generated and links to the same FHIR-bundle API route the
 * admin passport tab uses, which is already object-level gated for
 * non-admins (see .../passports/[passportId]/fhir/route.ts).
 */
export default async function MyPassportPage() {
  const t = await getTranslations("MobileProfile.myPassport");
  const tPassport = await getTranslations("Patients.admin.passport");
  const accountId = await requireAuthenticatedUserId();
  const links = accountId ? await listPatientAccessForAccount(accountId) : [];

  const patientsWithPassports = await Promise.all(
    links
      .filter((link) => link.accessRole !== "limited")
      .map(async (link) => ({
        patient: link.patient,
        relationshipType: link.relationshipType,
        passports: await listPassportsForPatient(link.patient.id),
      }))
  );

  const hasAnyPassport = patientsWithPassports.some((entry) => entry.passports.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="space-y-6 p-6">
        {!hasAnyPassport && <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500">{t("empty")}</div>}

        {patientsWithPassports.map(({ patient, relationshipType, passports }) =>
          passports.length === 0 ? null : (
            <div key={patient.id} className="space-y-3">
              {relationshipType !== "self" && (
                <p className="text-xs font-medium text-gray-500">
                  {patient.firstName} {patient.lastName} — {t(`relationshipTypes.${relationshipType}`)}
                </p>
              )}
              <div className="rounded-2xl bg-white p-4">
                {passports.map((passport) => (
                  <div
                    key={passport.id}
                    className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3 pt-3 first:pt-0 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tPassport(`languages.${passport.language}`)}</p>
                      <p dir="ltr" className="text-xs text-gray-500">
                        {formatDate(passport.createdAt)}
                      </p>
                    </div>
                    <a
                      href={`/api/v1/patients/${patient.id}/passports/${passport.id}/fhir`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                    >
                      <Download size={14} />
                      {t("view")}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
