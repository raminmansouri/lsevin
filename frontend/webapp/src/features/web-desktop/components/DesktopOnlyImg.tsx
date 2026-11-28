import { responsiveImg } from "@/lib/media/responsive-img";

/** 1×1 transparent GIF: what a phone "loads" for a desktop-only image. */
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * An image of the desktop layout (shown from Tailwind `xl`, 1280 px).
 *
 * Every public page renders its mobile and desktop trees and hides one with
 * CSS; a plain <img> in the hidden desktop tree was still downloaded on phones
 * (and preloaded by React), at full size (2026-11-26 audit). Inside <picture>,
 * the only real source matches `(min-width: 1280px)`: phones fall back to the
 * 1×1 GIF and fetch nothing; desktops get an optimized, right-sized copy,
 * eagerly when `priority` (the desktop hero), lazily otherwise.
 *
 * Only for images that are never visible below 1280 px.
 */
export function DesktopOnlyImg({
  src,
  sizes,
  alt,
  className,
  priority = false,
  width,
  height,
}: {
  src: string | null | undefined;
  sizes: string;
  alt: string;
  className?: string;
  priority?: boolean;
  /** Intrinsic size for fixed-size images (logos), so the box is reserved. */
  width?: number;
  height?: number;
}) {
  const image = responsiveImg(src, sizes);
  if (!image.src) return null;
  return (
    <picture>
      <source media="(min-width: 1280px)" srcSet={image.srcSet ?? image.src} sizes={image.sizes} />
      <img
        src={BLANK}
        alt={alt}
        className={className}
        width={width}
        height={height}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
      />
    </picture>
  );
}
