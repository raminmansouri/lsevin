import { seoOrigin } from "./origin";
import { organizationId } from "./entity-schema";
import { JsonLd } from "./json-ld";

// Spellings people actually search for: the Persian brand, the Arabic
// transliteration, the Latin forms and the domain. Never add claims here
// (ratings, accreditation, founders) that the site does not publish.
const BRAND_ALTERNATES = ["السوین", "لسوين", "Lsevin", "L Sevin", "LSevin Care", "lsevincare.com"];

/** Factual platform identity only; never invent medical credentials or ratings. */
export function PublicSiteSchema({ locale }: { locale: string }) {
  const origin = seoOrigin();
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId(),
        name: "LSevin",
        alternateName: BRAND_ALTERNATES,
        url: origin,
        logo: {
          "@type": "ImageObject",
          url: `${origin}/pwa/icon-512.png`,
          width: 512,
          height: 512,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: "LSevin",
        alternateName: BRAND_ALTERNATES,
        url: origin,
        inLanguage: locale,
        publisher: { "@id": organizationId() },
      },
    ],
  };
  return JsonLd({ data: graph });
}
