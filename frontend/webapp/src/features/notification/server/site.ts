/**
 * Which deployment this process is (sites A and B share notify.* through SymmetricDS).
 * A notification is delivered only by the site that created it: both sites run the
 * dispatch loop, and without this a replicated queued row would be sent twice.
 * NOTIFY_SITE_ID overrides; otherwise the host of the public URL (lsevin.ir, lsevincare.com…).
 */
export function notificationSiteId(): string | null {
  const explicit = process.env.NOTIFY_SITE_ID?.trim();
  if (explicit) return explicit;
  const url = process.env.NEXT_PUBLIC_URL || process.env.AUTH_URL || "";
  try {
    return url ? new URL(url).host.toLowerCase() : null;
  } catch {
    return null;
  }
}
