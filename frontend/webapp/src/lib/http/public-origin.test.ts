import type { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { publicAppOrigin, publicAppUrl } from "./public-origin";

afterEach(() => vi.unstubAllEnvs());

function request(host: string, forwardedHost?: string) {
  return {
    headers: new Headers({
      host,
      ...(forwardedHost ? { "x-forwarded-host": forwardedHost } : {}),
    }),
    nextUrl: new URL("http://0.0.0.0:3000/fa/shop/checkout"),
  } as NextRequest;
}

describe("public aliases preserve host cookies through authentication", () => {
  it.each(["lsevin.ir", "lsevincare.com", "appmain.lsevin.com"])(
    "keeps %s with a canonical auth URL configured",
    (host) => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("AUTH_URL", "https://appmain.lsevin.com");
      expect(publicAppUrl(request(host), "/fa/sign-in").origin).toBe(
        `https://${host}`
      );
    }
  );
  it("uses the trusted forwarded alias behind an internal proxy", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(publicAppOrigin(request("0.0.0.0:3000", "lsevin.ir"))).toBe(
      "https://lsevin.ir"
    );
  });
  it("does not prefer an unknown incoming host over the configured origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://appmain.lsevin.com");
    expect(publicAppOrigin(request("attacker.invalid"))).toBe(
      "https://appmain.lsevin.com"
    );
  });
});
