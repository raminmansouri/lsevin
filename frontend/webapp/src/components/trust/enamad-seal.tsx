/**
 * Enamad (Iran's e-commerce trust seal) for lsevincare.com, seal id 7764782.
 *
 * - A plain <img>, not next/image: Enamad checks the seal against the page that shows it (the
 *   Referer), and next/image would fetch it through our own image optimizer instead.
 * - referrerPolicy "origin" on both the link and the image, and no rel="noreferrer", for the same
 *   reason.
 * Used by the mobile home page and the desktop footer; keep one copy of the id/code here.
 */
export const ENAMAD_SEAL_ID = "7764782";
const ENAMAD_CODE = "XcQgNRMRzN92gDmZbf8t5GMh1mtctW9d";
export const ENAMAD_HREF = `https://trustseal.enamad.ir/?id=${ENAMAD_SEAL_ID}&Code=${ENAMAD_CODE}`;
export const ENAMAD_IMG = `https://trustseal.enamad.ir/logo.aspx?id=${ENAMAD_SEAL_ID}&Code=${ENAMAD_CODE}`;

export function EnamadSeal({ alt, className, imgClassName }: { alt: string; className?: string; imgClassName?: string }) {
  return (
    <a referrerPolicy="origin" target="_blank" rel="noopener" href={ENAMAD_HREF} className={className} data-testid="enamad-seal">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        referrerPolicy="origin"
        src={ENAMAD_IMG}
        alt={alt}
        className={imgClassName}
        style={{ cursor: "pointer" }}
        {...{ code: ENAMAD_CODE }}
      />
    </a>
  );
}
