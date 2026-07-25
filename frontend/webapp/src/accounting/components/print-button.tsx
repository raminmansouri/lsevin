"use client";

/**
 * "Save as PDF" via the browser's own print dialog.
 *
 * Deliberately not server-side PDF generation. Producing a Persian PDF on the server
 * means embedding a font and doing RTL shaping inside the PDF writer, which is where
 * server-generated Persian PDFs typically come out with disconnected or reversed
 * letters. The browser already shapes Persian correctly, and every print dialog offers
 * "Save as PDF" — so the correct output costs one button instead of a dependency.
 */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded border px-3 py-1.5 text-xs font-medium"
    >
      {label}
    </button>
  );
}
