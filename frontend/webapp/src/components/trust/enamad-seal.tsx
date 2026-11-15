"use client";

import { useEffect, useState } from "react";

import { enamadUrls, sealForHost, type DomainTrustSeal } from "@/features/trust-seal/enamad";

/**
 * Enamad (Iran's e-commerce trust seal). Every domain has its own seal (Admin > Content >
 * Enamad); this shows the one for the domain the visitor is on, and nothing on a domain that
 * has none (another domain's seal would display as invalid).
 *
 * - Chosen in the browser: lsevincare.com and appmain.lsevin.com are served by the same pods
 *   and share cached pages, so the server cannot know which domain a cached page is shown on.
 *   Nothing renders on the server or the first client render, so hydration always matches.
 * - A plain <img>, not next/image: Enamad checks the seal against the page that shows it (the
 *   Referer), and next/image would fetch it through our own image optimizer instead.
 * - referrerPolicy "origin" on both the link and the image, and no rel="noreferrer", for the same
 *   reason.
 */
export function EnamadSeal({
  seals,
  alt,
  className,
  imgClassName,
}: {
  seals: readonly DomainTrustSeal[];
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const [seal, setSeal] = useState<DomainTrustSeal | null>(null);

  useEffect(() => {
    setSeal(sealForHost(seals, window.location.hostname));
  }, [seals]);

  if (!seal) return null;
  const { href, img } = enamadUrls(seal);
  return (
    <a referrerPolicy="origin" target="_blank" rel="noopener" href={href} className={className} data-testid="enamad-seal" data-enamad-host={seal.host}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        referrerPolicy="origin"
        src={img}
        alt={alt}
        className={imgClassName}
        style={{ cursor: "pointer" }}
        {...{ code: seal.enamadCode }}
      />
    </a>
  );
}
