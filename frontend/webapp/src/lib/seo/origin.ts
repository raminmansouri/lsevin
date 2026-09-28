import "server-only";

/** Public deployment origin, never a request Host header or a URL prefix. */
export function validateSeoOrigin(value: string | undefined, production = process.env.NODE_ENV === "production"): string {
  const candidate = value?.trim() || (production ? "" : "http://localhost:3000");
  try {
    const url = new URL(candidate);
    if (!/^https?:$/.test(url.protocol) || (production && url.protocol !== "https:") ||
        url.username || url.password || url.pathname !== "/" || url.search || url.hash ||
        !/^https?:\/\/[^/?#\\]+\/?$/i.test(candidate)) throw new Error();
    return url.origin;
  } catch {
    throw new Error("NEXT_PUBLIC_URL must be an absolute HTTP(S) origin (HTTPS in production), without credentials, path, query or fragment.");
  }
}

export const seoOrigin = () => validateSeoOrigin(process.env.NEXT_PUBLIC_URL);
