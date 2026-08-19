import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { normalizePortalLocale } from "@core/i18n/config";

const tokenPayloadSchema = z.object({
  iss: z.string().min(1),
  aud: z.string().min(1),
  sub: z.string().uuid(),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive(),
  jti: z.string().min(16).max(128),
  locale: z.string().min(2).max(16).optional(),
});

export type SignedIdentityToken = z.infer<typeof tokenPayloadSchema>;

function encode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function signature(input: string, secret: string) {
  return createHmac("sha256", secret).update(input).digest();
}

export function createSignedIdentityToken(input: {
  issuer: string;
  audience: string;
  subject: string;
  secret: string;
  locale?: string | null;
  ttlSeconds: number;
}) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SignedIdentityToken = {
    iss: input.issuer,
    aud: input.audience,
    sub: input.subject,
    iat: now,
    exp: now + input.ttlSeconds,
    jti: randomBytes(24).toString("base64url"),
    locale: normalizePortalLocale(input.locale).locale,
  };
  const body = encode(JSON.stringify(payload));
  return `${body}.${encode(signature(body, input.secret))}`;
}

export function verifySignedIdentityToken(token: string, input: {
  issuer: string;
  audience: string;
  secret: string;
  clockToleranceSeconds?: number;
}) {
  const [body, suppliedSignature, extra] = token.split(".");
  if (!body || !suppliedSignature || extra) return null;
  const expected = signature(body, input.secret);
  let actual: Buffer;
  try {
    actual = Buffer.from(suppliedSignature, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const result = tokenPayloadSchema.safeParse(parsed);
  if (!result.success) return null;
  const payload = result.data;
  const now = Math.floor(Date.now() / 1000);
  const tolerance = input.clockToleranceSeconds ?? 15;
  if (payload.iss !== input.issuer || payload.aud !== input.audience) return null;
  if (payload.iat > now + tolerance || payload.exp < now - tolerance) return null;
  return payload;
}
