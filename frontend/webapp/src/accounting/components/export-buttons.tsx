import { getTranslations } from "next-intl/server";

import { PrintButton } from "./print-button";

/**
 * Download / print controls for a report.
 *
 * CSV rather than a real .xlsx: an xlsx writer is a dependency and a build-size cost for
 * a file Excel opens identically, and the BOM in csv.ts already solves the only thing
 * that actually breaks — Persian text turning into mojibake.
 */
export async function ExportButtons({ report, locale }: { report: string; locale: string }) {
  const t = await getTranslations("Admin.accounting");

  return (
    <div className="flex items-center gap-2 print:hidden">
      <a
        href={`/api/financial/export?report=${report}&locale=${locale}`}
        className="rounded border px-3 py-1.5 text-xs font-medium"
        download
      >
        {t("exportCsv")}
      </a>
      <PrintButton label={t("exportPdf")} />
    </div>
  );
}
