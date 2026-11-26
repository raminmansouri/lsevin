import { getImageProps } from "next/image";

/**
 * Props for a plain <img> that loads a right-sized, modern-format copy through
 * the Next.js image optimizer (next.config.ts `images`): src, srcSet and sizes.
 *
 * Plain <img src="https://…/files/x.webp"> tags downloaded the stored original
 * (120–200 KB each, often 1600 px+) for a 300 px card (2026-11-26 audit: 3 MB
 * of images on the home page, 14 MB on the map). Only URLs the optimizer is
 * configured for are rewritten — our own files host (`/files/**`) and local
 * paths without a query string; anything else (data:, SVG, the shop proxy,
 * third-party hosts) is returned unchanged.
 */
export function responsiveImg(
  src: string | null | undefined,
  sizes: string,
  quality?: number
): { src: string | undefined; srcSet?: string; sizes?: string } {
  const value = (src ?? "").trim();
  if (!value || !optimizable(value)) return { src: value || undefined };
  const { props } = getImageProps({ src: value, alt: "", fill: true, sizes, quality });
  return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
}

function filesHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_FILES_URL;
  if (!raw) return null;
  try {
    return new URL(raw).host;
  } catch {
    return null;
  }
}

export function optimizable(src: string): boolean {
  if (src.startsWith("data:") || src.startsWith("blob:") || /\.svg(?:$|[?#])/i.test(src)) return false;
  if (src.startsWith("/")) return !src.startsWith("//") && !src.startsWith("/_next/") && !src.includes("?");
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  return (url.protocol === "https:" || url.protocol === "http:") && url.host === filesHost() && url.pathname.startsWith("/files/") && !url.search;
}
