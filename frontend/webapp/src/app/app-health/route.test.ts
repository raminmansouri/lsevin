import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("/app-health (mobile domain race probe)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("answers 204 with no body and forbids caching when the API answers", async () => {
    vi.stubEnv("INTERNAL_API_URL", "http://api.internal:8080/api/v1");
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET();
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://api.internal:8080/liveness");
  });

  it("answers 503 when the API is down, so this site loses the race", async () => {
    vi.stubEnv("INTERNAL_API_URL", "http://api.internal:8080");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    expect((await GET()).status).toBe(503);
  });

  it("answers 503 when the API answers with a server error", async () => {
    vi.stubEnv("INTERNAL_API_URL", "http://api.internal:8080");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("x", { status: 502 })));
    expect((await GET()).status).toBe(503);
  });

  it("does not fail the site over an unconfigured API address", async () => {
    vi.stubEnv("INTERNAL_API_URL", "");
    expect((await GET()).status).toBe(204);
  });
});
