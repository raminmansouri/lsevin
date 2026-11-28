import type { ReactNode } from "react";

/**
 * Cloudflare's "Email Address Obfuscation" rewrites every e-mail address (and
 * mailto: link) it finds in HTML into `<a href="/cdn-cgi/l/email-protection">`.
 * That path answers 404 to crawlers and to visitors without JavaScript, so each
 * page showing an address gains a broken internal link.
 *
 * Cloudflare skips everything between `<!--email_off-->` and `<!--/email_off-->`.
 * React cannot emit comments, so the markers go out as raw HTML in empty,
 * hidden spans that wrap the children.
 */
export function EmailOff({ children }: { children: ReactNode }) {
  return (
    <>
      <span hidden dangerouslySetInnerHTML={{ __html: "<!--email_off-->" }} />
      {children}
      <span hidden dangerouslySetInnerHTML={{ __html: "<!--/email_off-->" }} />
    </>
  );
}
