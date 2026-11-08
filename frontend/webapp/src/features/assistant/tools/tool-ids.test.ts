import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/config/database/db", () => ({ default: vi.fn() }));
vi.mock("next-auth", () => ({ default: () => ({ auth: vi.fn(), handlers: {}, signIn: vi.fn(), signOut: vi.fn() }) }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));

import { buildJourneyPlanInputSchema } from "./build-journey-plan";
import { getAvailabilityInputSchema } from "./get-availability";
import { getServiceDetailsInputSchema } from "./get-service-details";
import { startBookingInputSchema } from "./start-booking";

// Real catalog ids are not RFC 4122 UUIDs (version/variant bits are arbitrary);
// z.string().uuid() rejected them, so the assistant could not open those services.
const catalogId = "019d9835-84a9-9bd9-113a-5223b42a5453";

describe("assistant tool ids", () => {
  it("accept production-shaped catalog ids", () => {
    expect(getServiceDetailsInputSchema.safeParse({ serviceId: catalogId }).success).toBe(true);
    expect(startBookingInputSchema.safeParse({ serviceId: catalogId, specialistId: catalogId }).success).toBe(true);
    expect(getAvailabilityInputSchema.safeParse({ serviceId: catalogId, specialistId: catalogId }).success).toBe(true);
    expect(buildJourneyPlanInputSchema.safeParse({ serviceId: catalogId, hotelServiceId: catalogId }).success).toBe(true);
  });

  it("still reject anything that is not an id", () => {
    expect(getServiceDetailsInputSchema.safeParse({ serviceId: "dr-mojdeh-namdari" }).success).toBe(false);
    expect(startBookingInputSchema.safeParse({ serviceId: "1; drop table x" }).success).toBe(false);
  });
});
