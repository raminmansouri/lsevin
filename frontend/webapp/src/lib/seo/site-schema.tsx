import { seoOrigin } from "./origin";

/** Factual platform identity only; never invent medical credentials or ratings. */
export function PublicSiteSchema({ locale }: { locale: string }) {
  const origin = seoOrigin();
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: "LSevin",
        url: origin,
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: "LSevin",
        url: origin,
        inLanguage: locale,
        publisher: { "@id": `${origin}/#organization` },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph).replace(/</g, "\\u003c"),
      }}
    />
  );
}
