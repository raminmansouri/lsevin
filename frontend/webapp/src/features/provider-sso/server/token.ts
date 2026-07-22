import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { normalizePortalLocale } from "./util";

function encode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

export function createProviderPortalExchangeToken(input: {
  subject: string;
  locale?: string | null;
  secret: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: "lsevin-appmain",
    aud: "lsevin-providers-portal",
    sub: input.subject,
    iat: now,
    exp: now + 90,
    jti: randomBytes(24).toString("base64url"),
    locale: normalizePortalLocale(input.locale),
  };
  const body = encode(JSON.stringify(payload));
  const signature = createHmac("sha256", input.secret).update(body).digest();
  return `${body}.${encode(signature)}`;
}
