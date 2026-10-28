import "server-only";

/** Public deployment origin, never a request Host header or a URL prefix. */
export function validateSeoOrigin(
  value: string | undefined,
  production = process.env.NODE_ENV === "production"
): string {
  const candidate =
    value?.trim() || (production ? "" : "http://localhost:3000");
  try {
    const url = new URL(candidate);
    if (
      !/^https?:$/.test(url.protocol) ||
      (production && url.protocol !== "https:") ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      !/^https?:\/\/[^/?#\\]+\/?$/i.test(candidate)
    )
      throw new Error();
    return url.origin;
  } catch {
    throw new Error(
      "NEXT_PUBLIC_URL must be an absolute HTTP(S) origin (HTTPS in production), without credentials, path, query or fragment."
    );
  }
}

// The production app origin's public search domain, used when the build did
// not receive NEXT_PUBLIC_SEO_URL. Server B's Jenkins job definitions are a
// hand-synced copy that can lag the repository, and a release without the
// variable published every canonical on the app host instead of lsevincare.com.
// (Site A's image rewrites the app host string to lsevin.ir, key included, so
// it consolidates onto the same public domain.)
const SEO_DOMAIN_FOR_APP_ORIGIN: Record<string, string> = {
  "https://appmain.lsevin.com": "https://lsevincare.com",
};

// The public search domain can differ from the app/SSO origin. Never infer it
// from Host: both domains are served by the same application.
export const seoOrigin = () => {
  const explicit = process.env.NEXT_PUBLIC_SEO_URL?.trim();
  if (explicit) return validateSeoOrigin(explicit);
  const app = validateSeoOrigin(process.env.NEXT_PUBLIC_URL);
  return SEO_DOMAIN_FOR_APP_ORIGIN[app] ?? app;
};
