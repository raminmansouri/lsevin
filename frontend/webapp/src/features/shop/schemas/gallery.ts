import { z } from "zod";

import { shopId } from "./id";

export const MAX_PRODUCT_IMAGES = 10;

/** Public image URLs and storage paths; never executable or temporary URLs. */
export function isGalleryImageReference(value: string): boolean {
  if (!value || /[\s\\\u0000-\u001f]/.test(value) || value.startsWith("//"))
    return false;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return Boolean(url.hostname) && !url.username && !url.password;
    } catch {
      return false;
    }
  }
  return (
    !value.includes(":") &&
    !value.startsWith("?") &&
    !value.startsWith("#") &&
    !value.split(/[/?#]/).includes("..")
  );
}

export const galleryUrlsSchema = z
  .array(z.string().trim().min(1).max(2048).refine(isGalleryImageReference))
  .max(MAX_PRODUCT_IMAGES)
  .transform((urls) => [...new Set(urls)]);

export const productGallerySchema = z.object({
  productId: shopId,
  urls: galleryUrlsSchema,
});
