import { describe, expect, it } from "vitest";

import { legacyEntityRoute } from "./legacy-entity-route";

const id = "019d9835-84a9-9bd9-113a-5223b42a5453";

describe("legacyEntityRoute", () => {
  it.each([
    [`/n/app/mobile/provider/${id}`, `/n/app/mobile/provider/${id}`],
    [`/n/app/mobile/service/${id}`, `/n/app/mobile/service/${id}`],
    [`/n/app/mobile/service/${id}/gallery`, `/n/app/mobile/service/${id}/gallery`],
    [`/n/app/mobile/specialist/${id}`, `/n/app/mobile/specialist/${id}`],
    [`/n/app/mobile/packages/${id}`, `/n/app/mobile/packages/${id}`],
    [`/service-providers/${id}`, `/service-providers/${id}`],
    [`/type/${id}`, `/type/${id}`],
    [`/providers/${id}`, `/n/app/mobile/provider/${id}`],
    [`/services/${id}/gallery`, `/n/app/mobile/service/${id}/gallery`],
    [`/specialists/${id}`, `/n/app/mobile/specialist/${id}`],
    [`/packages/${id}`, `/n/app/mobile/packages/${id}`],
  ])("%s -> %s", (from, to) => {
    expect(legacyEntityRoute(from)).toBe(to);
  });

  it.each([
    `/fa/n/app/mobile/provider/${id}`,
    `/fa/providers/${id}`,
    "/providers/dr-mojdeh-namdari",
    `/n/app/mobile/packages/${id}/checkout`,
    "/n/app/mobile/packages",
    `/providers/${id}/gallery`,
    "/n/app/mobile/profile",
    "/",
  ])("leaves %s to the normal routing", (path) => {
    expect(legacyEntityRoute(path)).toBeNull();
  });
});
